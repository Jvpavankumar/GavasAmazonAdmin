export const FREE_DELIVERY_MIN = 999;
export const SHIPPING_FEE = 99;

export function formatPrice(amountInr: number) {
  return `₹${Math.round(amountInr).toLocaleString('en-IN')}`;
}

export function formatPriceParts(amountInr: number) {
  const value = Math.round(amountInr).toLocaleString('en-IN');
  return { whole: value, symbol: '₹' };
}

export function formatDeliveryThreshold() {
  return `₹${FREE_DELIVERY_MIN.toLocaleString('en-IN')}`;
}

export function isFreeDelivery(subtotalInr: number) {
  return subtotalInr >= FREE_DELIVERY_MIN;
}

export function getShipping(subtotalInr: number) {
  return isFreeDelivery(subtotalInr) ? 0 : SHIPPING_FEE;
}

export function getOrderTotalInr(subtotalInr: number) {
  return subtotalInr + getShipping(subtotalInr);
}

export function getDiscountPercent(price: number, originalPrice?: number | null) {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round((1 - price / originalPrice) * 100);
}

export function calcSalePrice(mrp: number, discountPercent: number) {
  if (mrp <= 0) return 0;
  if (discountPercent <= 0) return Math.round(mrp);
  return Math.max(1, Math.round(mrp * (1 - discountPercent / 100)));
}
