function getActivePromotion(product, now = new Date()) {
  const promotion = product?.promotion;
  if (!promotion?.active || !Number.isFinite(Number(promotion.value)) || Number(promotion.value) <= 0) return null;
  if (promotion.startsAt && new Date(promotion.startsAt) > now) return null;
  if (promotion.endsAt && new Date(promotion.endsAt) < now) return null;
  return promotion;
}

function getEffectivePrice(product, now = new Date()) {
  const basePrice = Number(product?.price || 0);
  const promotion = getActivePromotion(product, now);
  const legacyOriginalPrice = Number(product?.originalPrice || 0);
  if (!promotion) {
    const hasLegacyDiscount = legacyOriginalPrice > basePrice;
    return {
      price: basePrice,
      originalPrice: legacyOriginalPrice,
      promotion: null,
      discountPercentage: hasLegacyDiscount ? Math.round(((legacyOriginalPrice - basePrice) / legacyOriginalPrice) * 100) : 0
    };
  }
  const originalPrice = Number(product.originalPrice || basePrice);
  const value = Number(promotion.value);
  const discount = promotion.type === 'fixed' ? value : (originalPrice * value) / 100;
  const price = Math.max(0, Math.round((originalPrice - discount) * 100) / 100);
  return { price, originalPrice, promotion, discountPercentage: originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0 };
}

function withEffectivePricing(product, now = new Date()) {
  const data = typeof product.toObject === 'function' ? product.toObject() : { ...product };
  const pricing = getEffectivePrice(data, now);
  return { ...data, ...pricing };
}

module.exports = { getActivePromotion, getEffectivePrice, withEffectivePricing };
