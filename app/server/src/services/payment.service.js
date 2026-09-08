import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import { notifyUser, notifyAdmins } from './notify.js';
import { DELIVERY_FEE } from './calculations.js';

function cfg() {
  const apiBase = (process.env.SSLCOMMERZ_API_BASE || 'https://sandbox.sslcommerz.com').replace(/\/$/, '');
  const validatorBase = (process.env.SSLCOMMERZ_VALIDATOR_BASE || apiBase).replace(/\/$/, '');
  return {
    storeId: process.env.SSLCOMMERZ_STORE_ID || '',
    storePasswd: process.env.SSLCOMMERZ_STORE_PASSWD || '',
    initUrl: `${apiBase}/gwprocess/v4/api.php`,
    validateUrl: `${validatorBase}/validator/api/validationserverAPI.php`,
    serverUrl: (process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, ''),
    clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
  };
}

export function sslConfigured() {
  const { storeId, storePasswd } = cfg();
  return Boolean(storeId && storePasswd);
}

/**
 * Init SSLCommerz session. Amount = delivery fee only (COD) or subtotal+fee (online).
 * Returns { redirectUrl, tranId, sessionkey }.
 */
export async function createSslCommerzSession(order, retailer) {
  const c = cfg();
  if (!c.storeId || !c.storePasswd) {
    throw Object.assign(new Error('SSLCommerz store credentials missing in .env'), { status: 500 });
  }

  const tranId = order.sslTranId || `NEK-${order.orderNumber}-${Date.now()}`;
  const totalAmount = Number(order.amountDueNow || DELIVERY_FEE).toFixed(2);

  const params = new URLSearchParams({
    store_id: c.storeId,
    store_passwd: c.storePasswd,
    total_amount: totalAmount,
    currency: 'BDT',
    tran_id: tranId,
    success_url: `${c.serverUrl}/api/payments/ssl/success`,
    fail_url: `${c.serverUrl}/api/payments/ssl/fail`,
    cancel_url: `${c.serverUrl}/api/payments/ssl/cancel`,
    ipn_url: `${c.serverUrl}/api/payments/ssl/ipn`,
    cus_name: order.recipientName || retailer?.name || 'Retailer',
    cus_email: retailer?.email || 'retailer@soukcart.com',
    cus_add1: order.deliveryAddress || 'Dhaka',
    cus_city: 'Dhaka',
    cus_postcode: '1000',
    cus_country: 'Bangladesh',
    cus_phone: order.recipientMobile || retailer?.phone || '01700000000',
    shipping_method: 'NO',
    product_name: `Soukcart order ${order.orderNumber}`,
    product_category: 'grocery',
    product_profile: 'general',
    value_a: String(order._id),
    value_b: order.paymentMethod || 'cod',
    value_c: String(order.deliveryFee || DELIVERY_FEE),
  });

  const res = await fetch(c.initUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json().catch(() => ({}));

  if (!data?.GatewayPageURL) {
    const reason = data?.failedreason || data?.status || 'SSL session init failed';
    throw Object.assign(new Error(String(reason)), { status: 502, ssl: data });
  }

  order.sslTranId = tranId;
  order.sslSessionKey = data.sessionkey || '';
  await order.save();

  return {
    provider: 'sslcommerz',
    sandbox: process.env.SSLCOMMERZ_IS_SANDBOX !== 'false',
    redirectUrl: data.GatewayPageURL,
    tranId,
    sessionkey: data.sessionkey,
    amount: Number(totalAmount),
  };
}

export async function validateSslPayment({ valId, tranId }) {
  const c = cfg();
  if (!valId) throw Object.assign(new Error('Missing val_id'), { status: 400 });

  const qs = new URLSearchParams({
    val_id: valId,
    store_id: c.storeId,
    store_passwd: c.storePasswd,
    format: 'json',
  });
  const res = await fetch(`${c.validateUrl}?${qs.toString()}`);
  const data = await res.json().catch(() => ({}));

  const ok = ['VALID', 'VALIDATED'].includes(String(data?.status || '').toUpperCase());
  if (!ok) {
    throw Object.assign(new Error(data?.error || data?.status || 'Payment validation failed'), {
      status: 400,
      ssl: data,
    });
  }

  if (tranId && data.tran_id && String(data.tran_id) !== String(tranId)) {
    throw Object.assign(new Error('tran_id mismatch'), { status: 400, ssl: data });
  }

  return data;
}

/** Activate order after validated delivery-fee (and merchandise if online) payment. Idempotent. */
export async function activateOrderAfterPayment(order, sslData = {}) {
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });

  if (order.status !== 'awaiting_payment' && order.deliveryFeePaid) {
    return order; // already active
  }

  if (order.status !== 'awaiting_payment') {
    throw Object.assign(new Error(`Order not awaiting payment (status=${order.status})`), { status: 400 });
  }

  // Reserve stock now (not before payment)
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product || product.stock < item.quantity) {
      throw Object.assign(new Error(`${item.name || 'Product'} is out of stock`), { status: 400 });
    }
  }
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
  }

  order.deliveryFeePaid = true;
  if (order.paymentMethod === 'online') {
    order.productAmountPaid = true;
    order.paymentStatus = 'paid';
  } else {
    order.productAmountPaid = false;
    order.paymentStatus = 'unpaid'; // merchandise still due on delivery
  }
  if (sslData.val_id) order.sslValId = sslData.val_id;
  if (sslData.tran_id) order.sslTranId = sslData.tran_id;
  order.status = 'placed'; // PENDING_SUPPLIER
  await order.save();

  await notifyUser(order.supplier, {
    title: 'New order received',
    body: `Order ${order.orderNumber} — ৳${order.subtotal} merchandise. Confirm or cancel.`,
    relatedOrder: order._id,
    link: '/supplier/orders',
  });
  await notifyUser(order.retailer, {
    title: 'Order placed',
    body: `Payment received. Order ${order.orderNumber} is with the supplier for approval.`,
    relatedOrder: order._id,
    link: '/retailer/orders',
  });

  return order;
}

export async function markSslFailed(order, reason = 'Payment failed') {
  if (!order || order.status !== 'awaiting_payment') return order;
  order.status = 'cancelled';
  order.cancelReason = reason;
  await order.save();
  return order;
}

/** Refund delivery fee (and online merchandise if paid) before admin starts delivery. Stub marks refunded. */
export async function refundBeforeDelivery(order, reason = 'Cancelled before delivery') {
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
  if (['out_for_delivery', 'delivered'].includes(order.status)) {
    throw Object.assign(new Error('Cannot cancel or refund after delivery has started'), { status: 400 });
  }
  // Restore stock if order was active
  if (order.status !== 'awaiting_payment' && order.status !== 'cancelled' && order.status !== 'refunded') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }
  order.status = 'refunded';
  order.paymentStatus = 'refunded';
  order.cancelReason = reason;
  await order.save();

  await notifyUser(order.retailer, {
    title: 'Refund processed',
    body: `Order ${order.orderNumber}: payment refunded (${reason}).`,
    relatedOrder: order._id,
    link: '/retailer/orders',
  });
  await notifyUser(order.supplier, {
    title: 'Order cancelled / refunded',
    body: `Order ${order.orderNumber} was cancelled before delivery. ${reason}`,
    relatedOrder: order._id,
    link: '/supplier/orders',
  });
  await notifyAdmins({
    title: 'Refund required',
    body: `Order ${order.orderNumber} refunded before delivery (${reason}).`,
    relatedOrder: order._id,
    link: '/admin/orders',
  });
  return order;
}

export function clientRedirect(path) {
  const { clientUrl } = cfg();
  return `${clientUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function findOrderFromSslPayload(body = {}) {
  const id = body.value_a || body.value_A;
  const tranId = body.tran_id || body.tranId;
  if (id) {
    const byId = await Order.findById(id);
    if (byId) return byId;
  }
  if (tranId) return Order.findOne({ sslTranId: tranId });
  return null;
}
