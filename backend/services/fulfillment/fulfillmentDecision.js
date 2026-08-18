const { FULFILLMENT_TYPES } = require('./supplierAdapter');

const getOrderItemFulfillmentDecision = (product, item) => {
  if (!product || !item || !(Number(item.quantity) > 0) || !(Number(item.price) > 0)) {
    return { type: 'MANUAL_REVIEW', reason: 'INVALID_ORDER_ITEM' };
  }
  if (product.supplier === 'foxreload') {
    return product.supplierProductId ? { type: 'FOXRELOAD', fulfillmentType: 'FOXRELOAD' } : { type: 'MANUAL_REVIEW', reason: 'MISSING_SUPPLIER_PRODUCT_ID' };
  }
  if (product.supplier === 'fazercards') {
    return product.supplierProductId ? { type: 'FAZERCARDS', fulfillmentType: FULFILLMENT_TYPES.GIFT_CARD } : { type: 'MANUAL_REVIEW', reason: 'MISSING_SUPPLIER_PRODUCT_ID' };
  }
  if (!product.supplier || product.supplier === 'manual' || product.supplier === 'none') {
    return { type: 'DIGITAL_CODE' };
  }
  return { type: 'MANUAL_REVIEW', reason: 'UNKNOWN_SUPPLIER' };
};

module.exports = { getOrderItemFulfillmentDecision };
