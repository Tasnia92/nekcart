import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Settings from '../models/Settings.js';
import { lineTotal, orderTotals, amountDueNow, DELIVERY_FEE } from './calculations.js';
import { refundBeforeDelivery } from './payment.service.js';
import { notifyUser, notifyAdmins } from './notify.js';

async function nextOrderNumber() {
  const count = await Order.countDocuments();
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `SC-${String(count + 1).padStart(5, '0')}-${stamp}`;
}

/**
 * Build an awaiting_payment order. Stock is NOT reserved until SSL success.
 * Supplier is NOT notified until payment validates.
 */
export async function createOrderFromCart({ retailerId, items, paymentMethod, deliveryAddress, recipientName, recipientMobile, notes }) {
  if (!items?.length) throw Object.assign(new Error('Cart is empty'), { status: 400 });
  if (!recipientName?.trim()) throw Object.assign(new Error('Full name required'), { status: 400 });
  if (!recipientMobile?.trim()) throw Object.assign(new Error('Mobile required'), { status: 400 });
  if (!deliveryAddress?.trim()) throw Object.assign(new Error('Full address required'), { status: 400 });
  const mobile = recipientMobile.trim().replace(/\s+/g, '');
  if (!/^01\d{9}$/.test(mobile)) {
    throw Object.assign(new Error('Mobile must be 11 digits starting with 01'), { status: 400 });
  }

  const method = paymentMethod === 'online' ? 'online' : 'cod';
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, status: 'approved', isActive: true });
  if (products.length !== items.length) throw Object.assign(new Error('Invalid product in cart'), { status: 400 });

  const supplierId = String(products[0].supplier);
  if (products.some((p) => String(p.supplier) !== supplierId)) {
    throw Object.assign(new Error('All items must be from one supplier'), { status: 400 });
  }

  const orderItems = [];
  for (const item of items) {
    const product = products.find((p) => String(p._id) === String(item.productId));
    const qty = Number(item.quantity);
    if (qty < product.moq) throw Object.assign(new Error(`${product.name} MOQ is ${product.moq}`), { status: 400 });
    if (qty > product.stock) throw Object.assign(new Error(`${product.name} is out of stock`), { status: 400 });
    orderItems.push({
      product: product._id,
      name: product.name,
      unit: product.unit,
      price: product.price,
      quantity: qty,
      lineTotal: lineTotal(product.price, qty),
      imageUrl: product.imageUrl || '',
    });
  }

  const settings = await Settings.findOne({ key: 'global' });
  const rate = settings?.commissionRate ?? 0.05;
  const totals = orderTotals(orderItems, rate);
  const due = amountDueNow(method, totals.subtotal, totals.deliveryFee);

  const order = await Order.create({
    orderNumber: await nextOrderNumber(),
    retailer: retailerId,
    supplier: supplierId,
    items: orderItems,
    ...totals,
    amountDueNow: due,
    paymentMethod: method,
    recipientName: recipientName.trim(),
    recipientMobile: mobile,
    deliveryAddress: deliveryAddress.trim(),
    notes,
    status: 'awaiting_payment',
    paymentStatus: 'unpaid',
    deliveryFeePaid: false,
    productAmountPaid: false,
    deliveryFee: totals.deliveryFee || DELIVERY_FEE,
  });

  return order;
}

export async function setOrderStatus(order, nextStatus, actor) {
  // After admin starts delivery, nobody can cancel
  if (['cancelled', 'supplier_cancelled', 'refunded'].includes(nextStatus)) {
    if (['out_for_delivery', 'delivered'].includes(order.status) || order.deliveryStarted) {
      throw Object.assign(new Error('Cannot cancel after delivery has started'), { status: 400 });
    }
  }

  const allowed = {
    supplier: {
      placed: ['supplier_approved', 'supplier_cancelled'],
      supplier_approved: ['supplier_confirmed', 'supplier_cancelled'],
    },
    admin: {
      placed: ['cancelled'],
      supplier_approved: ['cancelled'],
      supplier_confirmed: ['cancelled', 'out_for_delivery'],
      out_for_delivery: ['delivered'],
    },
    retailer: {
      awaiting_payment: ['cancelled'],
      placed: ['cancelled'],
      supplier_approved: ['cancelled'],
      supplier_confirmed: ['cancelled'],
    },
  };

  const map = allowed[actor.role] || {};
  const nexts = map[order.status] || [];
  if (!nexts.includes(nextStatus)) {
    throw Object.assign(new Error(`Cannot move ${order.status} → ${nextStatus}`), { status: 400 });
  }

  // Cancel with refund if fee was paid and delivery not started
  if (['cancelled', 'supplier_cancelled'].includes(nextStatus) && order.deliveryFeePaid) {
    return refundBeforeDelivery(order, `${actor.role} cancelled before delivery`);
  }

  if (nextStatus === 'supplier_cancelled' && !order.deliveryFeePaid) {
    order.status = 'supplier_cancelled';
    await order.save();
    await notifyUser(order.retailer, {
      title: 'Order cancelled',
      body: `Order ${order.orderNumber} was cancelled by the supplier.`,
      relatedOrder: order._id,
      link: '/retailer/orders',
    });
    return order;
  }

  const prev = order.status;
  order.status = nextStatus;

  if (nextStatus === 'cancelled' || nextStatus === 'supplier_cancelled') {
    if (prev !== 'awaiting_payment') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }
  }

  if (nextStatus === 'supplier_approved') {
    await notifyUser(order.retailer, {
      title: 'Order confirmed',
      body: `Supplier approved order ${order.orderNumber}. Waiting for final confirm.`,
      relatedOrder: order._id,
      link: '/retailer/orders',
    });
  }

  if (nextStatus === 'supplier_confirmed') {
    await notifyAdmins({
      title: 'Order ready for delivery',
      body: `Order ${order.orderNumber} confirmed by supplier. Start delivery when ready.`,
      relatedOrder: order._id,
      link: '/admin/orders',
    });
    await notifyUser(order.retailer, {
      title: 'Order confirmed',
      body: `Order ${order.orderNumber} is confirmed and waiting for delivery.`,
      relatedOrder: order._id,
      link: '/retailer/orders',
    });
  }

  if (nextStatus === 'out_for_delivery') {
    order.deliveryStarted = true;
    await notifyUser(order.retailer, {
      title: 'Out for delivery',
      body: `Order ${order.orderNumber} is on the way.`,
      relatedOrder: order._id,
      link: '/retailer/tracking',
    });
    await notifyUser(order.supplier, {
      title: 'Delivery started',
      body: `Admin started delivery for order ${order.orderNumber}.`,
      relatedOrder: order._id,
      link: '/supplier/orders',
    });
  }

  if (nextStatus === 'delivered') {
    if (order.paymentMethod === 'cod') {
      order.productAmountPaid = true;
      order.paymentStatus = 'paid';
    }
    await notifyUser(order.retailer, {
      title: 'Order delivered',
      body: `Order ${order.orderNumber} was delivered successfully.`,
      relatedOrder: order._id,
      link: '/retailer/orders',
    });
    await notifyUser(order.supplier, {
      title: 'Order delivered',
      body: `Order ${order.orderNumber} was marked delivered.`,
      relatedOrder: order._id,
      link: '/supplier/orders',
    });
  }

  if (nextStatus === 'cancelled') {
    await notifyUser(order.supplier, {
      title: 'Order cancelled',
      body: `Order ${order.orderNumber} was cancelled.`,
      relatedOrder: order._id,
      link: '/supplier/orders',
    });
    await notifyUser(order.retailer, {
      title: 'Order cancelled',
      body: `Order ${order.orderNumber} was cancelled.`,
      relatedOrder: order._id,
      link: '/retailer/orders',
    });
  }

  await order.save();
  return order;
}
