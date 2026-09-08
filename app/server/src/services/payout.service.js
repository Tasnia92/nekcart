import Order from '../models/Order.js';
import Payout from '../models/Payout.js';
import User from '../models/User.js';

/** Delivered orders that are merchandise-paid and not already in a pending/paid payout. */
export async function getEligibleOrders(supplierId) {
  const reserved = await Payout.find({
    supplier: supplierId,
    status: { $in: ['pending', 'paid'] },
  }).select('orderIds');
  const reservedIds = reserved.flatMap((p) => p.orderIds || []);

  const filter = {
    supplier: supplierId,
    status: 'delivered',
    paymentStatus: 'paid',
    payoutSettled: { $ne: true },
  };
  if (reservedIds.length) filter._id = { $nin: reservedIds };

  return Order.find(filter).sort({ createdAt: 1 });
}

export async function computeSupplierBalance(supplierId) {
  const eligible = await getEligibleOrders(supplierId);
  const available = Number(eligible.reduce((s, o) => s + (o.supplierAmount || 0), 0).toFixed(2));
  const commissionPending = Number(eligible.reduce((s, o) => s + (o.commissionAmount || 0), 0).toFixed(2));

  const allDelivered = await Order.find({
    supplier: supplierId,
    status: 'delivered',
    paymentStatus: 'paid',
  });
  const earned = Number(allDelivered.reduce((s, o) => s + (o.supplierAmount || 0), 0).toFixed(2));

  const paidAgg = await Payout.aggregate([
    { $match: { supplier: supplierId, status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const alreadyPaid = paidAgg[0]?.total || 0;

  const pendingAgg = await Payout.aggregate([
    { $match: { supplier: supplierId, status: 'pending' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const pendingPayouts = pendingAgg[0]?.total || 0;

  return {
    earned,
    alreadyPaid,
    pendingPayouts,
    available,
    commissionPending,
    orderCount: allDelivered.length,
    eligibleOrderCount: eligible.length,
    eligibleOrderIds: eligible.map((o) => o._id),
  };
}

function weekWindow(ref = new Date()) {
  const end = new Date(ref);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { periodStart: start, periodEnd: end };
}

/**
 * Create a payout for one supplier from eligible orders.
 * status: 'pending' (weekly batch) or 'paid' (immediate).
 */
export async function createPayoutForSupplier(supplierId, { status = 'paid', note = '', amount } = {}) {
  const eligible = await getEligibleOrders(supplierId);
  if (!eligible.length) {
    throw Object.assign(new Error('No eligible delivered orders to pay'), { status: 400 });
  }

  const orderIds = eligible.map((o) => o._id);
  const supplierAmount = Number(eligible.reduce((s, o) => s + (o.supplierAmount || 0), 0).toFixed(2));
  const commissionTotal = Number(eligible.reduce((s, o) => s + (o.commissionAmount || 0), 0).toFixed(2));
  const payAmount = amount != null ? Number(amount) : supplierAmount;

  if (payAmount <= 0) throw Object.assign(new Error('Payout amount must be > 0'), { status: 400 });
  if (payAmount - supplierAmount > 0.01) {
    throw Object.assign(new Error(`Amount exceeds available ৳${supplierAmount}`), { status: 400 });
  }

  const { periodStart, periodEnd } = weekWindow();
  const payout = await Payout.create({
    supplier: supplierId,
    amount: payAmount,
    commissionTotal,
    orderIds,
    status,
    periodStart,
    periodEnd,
    note: note || (status === 'pending' ? 'Weekly payout batch' : 'Supplier payout'),
  });

  if (status === 'paid') {
    await Order.updateMany({ _id: { $in: orderIds } }, { $set: { payoutSettled: true } });
  }

  return payout;
}

/** Build pending weekly payouts for every supplier with available balance. */
export async function processWeeklyPayouts() {
  const suppliers = await User.find({ role: 'supplier', isActive: true }).select('_id');
  const created = [];
  const skipped = [];
  for (const s of suppliers) {
    const bal = await computeSupplierBalance(s._id);
    if (bal.available <= 0) {
      skipped.push({ supplierId: s._id, reason: 'no_balance' });
      continue;
    }
    // Avoid duplicate pending for same eligible set
    const existingPending = await Payout.findOne({ supplier: s._id, status: 'pending' });
    if (existingPending) {
      skipped.push({ supplierId: s._id, reason: 'already_pending', payoutId: existingPending._id });
      continue;
    }
    const payout = await createPayoutForSupplier(s._id, {
      status: 'pending',
      note: 'Weekly payout',
    });
    created.push(payout);
  }
  return { created, skipped };
}

export async function markPayoutAsPaid(payoutId) {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw Object.assign(new Error('Payout not found'), { status: 404 });
  if (payout.status === 'paid') return payout;
  if (payout.status === 'failed') throw Object.assign(new Error('Cannot pay a failed payout'), { status: 400 });

  payout.status = 'paid';
  await payout.save();
  if (payout.orderIds?.length) {
    await Order.updateMany({ _id: { $in: payout.orderIds } }, { $set: { payoutSettled: true } });
  }
  return payout;
}
