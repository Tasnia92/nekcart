import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    unit: String,
    price: Number,
    quantity: Number,
    lineTotal: Number,
    imageUrl: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 120 },
    commissionRate: { type: Number, default: 0.05 },
    commissionAmount: { type: Number, default: 0 },
    supplierAmount: { type: Number, default: 0 },
    /** Amount charged in the current SSL session (fee only for COD; fee+merchandise for online). */
    amountDueNow: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'partial_refund'],
      default: 'unpaid',
    },
    deliveryFeePaid: { type: Boolean, default: false },
    productAmountPaid: { type: Boolean, default: false },
    sslTranId: String,
    sslValId: String,
    sslSessionKey: String,
    status: {
      type: String,
      enum: [
        'awaiting_payment',
        'placed',
        'supplier_approved',
        'supplier_confirmed',
        'supplier_cancelled',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refunded',
      ],
      default: 'awaiting_payment',
    },
    recipientName: String,
    recipientMobile: String,
    deliveryAddress: String,
    notes: String,
    cancelReason: String,
    deliveryStarted: { type: Boolean, default: false },
    payoutSettled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
