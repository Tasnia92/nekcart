import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Payout from '../models/Payout.js';
import Complaint from '../models/Complaint.js';
import Settings from '../models/Settings.js';
import {
  computeSupplierBalance,
  createPayoutForSupplier,
  processWeeklyPayouts,
  markPayoutAsPaid,
} from '../services/payout.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notifyUser, notifyAdmins } from '../services/notify.js';

export const dashboard = asyncHandler(async (_req, res) => {
  const [users, orders, products, pendingProducts, pendingVerifications, openComplaints] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Product.countDocuments(),
    Product.countDocuments({ status: 'pending' }),
    User.countDocuments({ role: 'supplier', verificationStatus: 'pending' }),
    Complaint.countDocuments({ status: { $in: ['open', 'in_review'] } }),
  ]);
  const revenue = await Order.aggregate([
    { $match: { status: 'delivered' } },
    { $group: { _id: null, subtotal: { $sum: '$subtotal' }, commission: { $sum: '$commissionAmount' } } },
  ]);
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);
  const byDay = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        value: { $sum: '$subtotal' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const hit = byDay.find((x) => x._id === key);
    trend.push({ date: key, count: hit?.count || 0, value: hit?.value || 0 });
  }

  res.json({
    stats: {
      users,
      orders,
      products,
      pendingProducts,
      pendingVerifications,
      openComplaints,
      revenueSubtotal: revenue[0]?.subtotal || 0,
      commission: revenue[0]?.commission || 0,
      trend,
    },
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ users });
});

export const listVerifications = asyncHandler(async (_req, res) => {
  const users = await User.find({
    role: 'supplier',
    verificationStatus: { $in: ['pending', 'approved', 'rejected'] },
  }).sort({ updatedAt: -1 });
  res.json({ users });
});

export const reviewVerification = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: status },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: 'Not found' });
  if (status === 'approved' || status === 'rejected') {
    await notifyUser(user._id, {
      title: status === 'approved' ? 'Verification approved' : 'Verification rejected',
      body: status === 'approved'
        ? 'Your supplier verification was approved. You can list products.'
        : 'Your supplier verification was rejected. Please resubmit with clearer documents.',
      link: '/supplier/settings',
    });
  }
  res.json({ user });
});

export const listPayouts = asyncHandler(async (_req, res) => {
  const payouts = await Payout.find().populate('supplier', 'name businessName email').sort({ createdAt: -1 });
  const suppliers = await User.find({ role: 'supplier' });
  const balances = [];
  for (const s of suppliers) {
    balances.push({ supplier: s, ...(await computeSupplierBalance(s._id)) });
  }
  const settings = await Settings.findOne({ key: 'global' });
  res.json({ payouts, balances, commissionRate: settings?.commissionRate ?? 0.05 });
});

export const createPayout = asyncHandler(async (req, res) => {
  try {
    const { supplierId, amount, note, status } = req.body;
    if (!supplierId) return res.status(400).json({ message: 'supplierId required' });
    const payout = await createPayoutForSupplier(supplierId, {
      status: status === 'pending' ? 'pending' : 'paid',
      note,
      amount: amount != null ? Number(amount) : undefined,
    });
    if (payout.status === 'paid') {
      await notifyUser(supplierId, {
        title: 'Payout sent',
        body: `A payout of ৳${payout.amount} was marked paid.`,
        link: '/supplier/earnings',
      });
    }
    res.status(201).json({ payout });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

export const runWeeklyPayouts = asyncHandler(async (_req, res) => {
  const result = await processWeeklyPayouts();
  res.json({
    ok: true,
    created: result.created.length,
    skipped: result.skipped.length,
    payouts: result.created,
    skippedDetails: result.skipped,
  });
});

export const payPayout = asyncHandler(async (req, res) => {
  try {
    const payout = await markPayoutAsPaid(req.params.id);
    await notifyUser(payout.supplier, {
      title: 'Payout sent',
      body: `A payout of ৳${payout.amount} was marked paid.`,
      link: '/supplier/earnings',
    });
    res.json({ payout });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

export const updateCommission = asyncHandler(async (req, res) => {
  let rate = Number(req.body.commissionRate);
  // Allow 5 meaning 5% as well as 0.05
  if (!Number.isNaN(rate) && rate > 1 && rate <= 100) rate = rate / 100;
  if (Number.isNaN(rate) || rate < 0 || rate > 1) {
    return res.status(400).json({ message: 'commissionRate must be 0–1 (or 0–100 as percent)' });
  }
  const settings = await Settings.findOneAndUpdate(
    { key: 'global' },
    { commissionRate: rate },
    { upsert: true, new: true }
  );
  res.json({ settings });
});

export const listComplaints = asyncHandler(async (_req, res) => {
  const complaints = await Complaint.find()
    .populate('reporter', 'name email role')
    .populate('order', 'orderNumber')
    .sort({ createdAt: -1 });
  res.json({ complaints });
});

export const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, adminNote: req.body.adminNote },
    { new: true }
  );
  if (!complaint) return res.status(404).json({ message: 'Not found' });
  res.json({ complaint });
});
