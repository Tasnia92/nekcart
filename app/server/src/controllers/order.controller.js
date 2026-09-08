import Order from '../models/Order.js';
import { createOrderFromCart, setOrderStatus } from '../services/order.service.js';
import { createSslCommerzSession, sslConfigured } from '../services/payment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const placeOrder = asyncHandler(async (req, res) => {
  try {
    if (!sslConfigured()) {
      return res.status(500).json({ message: 'SSLCommerz is not configured. Add store id/password to .env.' });
    }
    const order = await createOrderFromCart({
      retailerId: req.user._id,
      items: req.body.items,
      paymentMethod: req.body.paymentMethod,
      deliveryAddress: req.body.deliveryAddress,
      recipientName: req.body.recipientName,
      recipientMobile: req.body.recipientMobile,
      notes: req.body.notes,
    });
    const payment = await createSslCommerzSession(order, req.user);
    res.status(201).json({
      order,
      payment,
      message: 'Redirect to SSLCommerz to pay before the order is placed.',
    });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message, ssl: e.ssl });
  }
});

export const myOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'retailer') filter.retailer = req.user._id;
  if (req.user.role === 'supplier') filter.supplier = req.user._id;

  if (req.query.status) {
    filter.status = req.query.status;
  } else if (req.query.all !== '1') {
    // Incomplete SSL checkouts are not active orders for anyone
    filter.status = { $nin: ['awaiting_payment'] };
  }

  const orders = await Order.find(filter)
    .populate('retailer', 'name email')
    .populate('supplier', 'name businessName')
    .sort({ createdAt: -1 });
  res.json({ orders });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('retailer', 'name email')
    .populate('supplier', 'name businessName');
  if (!order) return res.status(404).json({ message: 'Not found' });
  const uid = String(req.user._id);
  if (req.user.role !== 'admin' && uid !== String(order.retailer._id) && uid !== String(order.supplier._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json({ order });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Not found' });
  try {
    const updated = await setOrderStatus(order, req.body.status, req.user);
    if (req.body.cancelReason && !updated.cancelReason) {
      updated.cancelReason = req.body.cancelReason;
      await updated.save();
    }
    res.json({ order: updated });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});
