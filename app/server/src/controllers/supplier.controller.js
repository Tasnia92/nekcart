import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import { computeSupplierBalance } from '../services/payout.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboard = asyncHandler(async (req, res) => {
  const supplierId = req.user._id;
  const [orders, products, pendingOrders] = await Promise.all([
    Order.countDocuments({ supplier: supplierId, status: { $nin: ['awaiting_payment'] } }),
    Product.countDocuments({ supplier: supplierId }),
    Order.countDocuments({ supplier: supplierId, status: 'placed' }),
  ]);
  const balance = await computeSupplierBalance(supplierId);
  const lowStock = await Product.find({ supplier: supplierId, stock: { $lte: 10 } }).limit(5);
  res.json({ stats: { orders, products, pendingOrders, ...balance }, lowStock });
});

export const submitVerification = asyncHandler(async (req, res) => {
  const { businessName, shopLink, businessDescription, nidDocUrl } = req.body;
  if (!businessName || !shopLink || !nidDocUrl) {
    return res.status(400).json({ message: 'businessName, shopLink, and nidDocUrl are required' });
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      businessName,
      shopLink,
      businessDescription,
      nidDocUrl,
      verificationStatus: 'pending',
    },
    { new: true }
  );
  res.json({ user });
});

export const retailers = asyncHandler(async (req, res) => {
  const orders = await Order.find({ supplier: req.user._id, status: { $nin: ['awaiting_payment'] } }).populate('retailer', 'name email businessName phone');
  const map = new Map();
  for (const o of orders) {
    if (!o.retailer) continue;
    const id = String(o.retailer._id);
    const row = map.get(id) || {
      _id: o.retailer._id,
      name: o.retailer.name,
      email: o.retailer.email,
      businessName: o.retailer.businessName,
      phone: o.retailer.phone,
      orders: 0,
      gross: 0,
      lastOrderAt: null,
    };
    row.orders += 1;
    row.gross += o.subtotal || 0;
    const t = new Date(o.createdAt).getTime();
    if (!row.lastOrderAt || t > new Date(row.lastOrderAt).getTime()) row.lastOrderAt = o.createdAt;
    map.set(id, row);
  }
  res.json({ retailers: [...map.values()] });
});

export const inventory = asyncHandler(async (req, res) => {
  const products = await Product.find({ supplier: req.user._id }).populate('category', 'name').sort({ stock: 1 });
  res.json({ products });
});

export const earnings = asyncHandler(async (req, res) => {
  const balance = await computeSupplierBalance(req.user._id);
  const recent = await Order.find({ supplier: req.user._id, status: 'delivered' })
    .sort({ updatedAt: -1 })
    .limit(20);
  res.json({ balance, recent });
});

export const notifications = asyncHandler(async (req, res) => {
  const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ notifications: items });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  res.json({ notification: item });
});
