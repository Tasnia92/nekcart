import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    commissionTotal: { type: Number, default: 0 },
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    periodStart: Date,
    periodEnd: Date,
    note: String,
  },
  { timestamps: true }
);

export default mongoose.model('Payout', payoutSchema);
