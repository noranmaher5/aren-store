const { ERROR_CODES, fulfillmentError } = require('./fulfillmentErrors');

const FULFILLMENT_TYPES = Object.freeze({
  GIFT_CARD: 'GIFT_CARD',
  GAME_KEY: 'GAME_KEY',
  TOPUP: 'TOPUP',
  MANUAL_SERVICE: 'MANUAL_SERVICE',
  TELEGRAM: 'TELEGRAM',
  STEAM: 'STEAM',
  FOXRELOAD: 'FOXRELOAD',
  UNKNOWN: 'UNKNOWN'
});

const FAZERCARDS_TYPES = new Map([
  ['giftcard', FULFILLMENT_TYPES.GIFT_CARD],
  ['gamekey', FULFILLMENT_TYPES.GAME_KEY],
  ['topup', FULFILLMENT_TYPES.TOPUP],
  ['manual', FULFILLMENT_TYPES.MANUAL_SERVICE],
  ['telegram_premium', FULFILLMENT_TYPES.TELEGRAM],
  ['telegram_stars', FULFILLMENT_TYPES.TELEGRAM],
  ['steam', FULFILLMENT_TYPES.STEAM]
]);

const getFulfillmentType = product => {
  if (product?.supplier === 'foxreload') return FULFILLMENT_TYPES.FOXRELOAD;
  const type = product?.supplierMetadata?.supplierType;
  if (product?.supplier === 'fazercards' && FAZERCARDS_TYPES.has(type)) return FAZERCARDS_TYPES.get(type);
  return FULFILLMENT_TYPES.UNKNOWN;
};

const parseSupplierProductId = product => {
  const value = String(product?.supplierProductId || '');
  if (!value || !value.includes(':')) throw fulfillmentError(ERROR_CODES.SUPPLIER_PRODUCT_ID_MISSING);
  const [categoryId, offerId] = value.split(':');
  if (!categoryId || !offerId) throw fulfillmentError(ERROR_CODES.SUPPLIER_PRODUCT_ID_MISSING);
  return { categoryId, offerId };
};

const createFazerCardsAdapter = () => ({
  supplier: 'fazercards',
  supportsFulfillment: type => [
    FULFILLMENT_TYPES.GIFT_CARD,
    FULFILLMENT_TYPES.GAME_KEY,
    FULFILLMENT_TYPES.TOPUP,
    FULFILLMENT_TYPES.MANUAL_SERVICE
  ].includes(type),
  validateProduct: product => {
    parseSupplierProductId(product);
    return true;
  },
  validateAvailability: product => {
    const quantity = product?.supplierAvailability?.quantity;
    const status = String(product?.supplierAvailability?.status || '').toUpperCase();
    if (quantity === undefined || quantity === null || status === 'UNKNOWN') {
      throw fulfillmentError(ERROR_CODES.PRODUCT_UNAVAILABLE, 'Supplier availability is unknown');
    }
    if (Number(quantity) <= 0 || status === 'OUT_OF_STOCK') {
      throw fulfillmentError(ERROR_CODES.PRODUCT_UNAVAILABLE, 'Supplier product is unavailable');
    }
    return true;
  },
  // Deliberately disabled. No supplier order endpoint is called in Phase 11.
  createOrder: async () => {
    throw fulfillmentError(ERROR_CODES.FULFILLMENT_DISABLED, 'FazerCards order execution is disabled');
  },
  getOrder: async () => {
    throw fulfillmentError(ERROR_CODES.SUPPLIER_STATUS_UNKNOWN, 'FazerCards order status contract is unconfirmed');
  },
  normalizeStatus: () => {
    throw fulfillmentError(ERROR_CODES.SUPPLIER_STATUS_UNKNOWN, 'FazerCards status values are unconfirmed');
  },
  normalizeDelivery: () => {
    throw fulfillmentError(ERROR_CODES.DELIVERY_SCHEMA_UNKNOWN, 'FazerCards delivery schema is unconfirmed');
  }
});

const createFoxReloadAdapter = () => ({
  supplier: 'foxreload',
  supportsFulfillment: type => type === FULFILLMENT_TYPES.FOXRELOAD,
  validateProduct: product => {
    if (!product?.supplierProductId) throw fulfillmentError(ERROR_CODES.SUPPLIER_PRODUCT_ID_MISSING);
    return true;
  },
  validateAvailability: product => {
    const quantity = product?.supplierAvailability?.quantity;
    const status = String(product?.supplierAvailability?.status || '').toUpperCase();
    if (quantity === undefined || quantity === null || status === 'UNKNOWN') throw fulfillmentError(ERROR_CODES.PRODUCT_UNAVAILABLE, 'Supplier availability is unknown');
    if (Number(quantity) <= 0 || status === 'OUT_OF_STOCK') throw fulfillmentError(ERROR_CODES.PRODUCT_UNAVAILABLE, 'Supplier product is unavailable');
    return true;
  },
  createOrder: async () => { throw fulfillmentError(ERROR_CODES.FULFILLMENT_DISABLED); }
});

const getSupplierAdapter = supplier => {
  if (supplier === 'fazercards') return createFazerCardsAdapter();
  if (supplier === 'foxreload') return createFoxReloadAdapter();
  return null;
};

module.exports = {
  FULFILLMENT_TYPES,
  getFulfillmentType,
  getSupplierAdapter,
  parseSupplierProductId
};
