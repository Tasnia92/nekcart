export const DELIVERY_FEE = 120;

export function lineTotal(price, quantity) {
  return Number((price * quantity).toFixed(2));
}

export function orderTotals(items, commissionRate = 0.05) {
  const subtotal = Number(items.reduce((s, i) => s + i.lineTotal, 0).toFixed(2));
  const commissionAmount = Number((subtotal * commissionRate).toFixed(2));
  const supplierAmount = Number((subtotal - commissionAmount).toFixed(2));
  const deliveryFee = DELIVERY_FEE;
  return { subtotal, commissionRate, commissionAmount, supplierAmount, deliveryFee };
}

/** COD pays delivery fee only online; online pays merchandise + delivery fee. */
export function amountDueNow(paymentMethod, subtotal, deliveryFee = DELIVERY_FEE) {
  if (paymentMethod === 'online') return Number((subtotal + deliveryFee).toFixed(2));
  return Number(deliveryFee.toFixed(2));
}
