const SENSITIVE_KEY = /(api[-_]?key|secret|password|token|authorization|credential)/i;

const asObject = value => (value && typeof value === 'object' ? value : {});
const first = (obj, keys) => keys.map(key => obj[key]).find(value => value !== undefined && value !== null && value !== '');
const structuredValue = (raw, attributes, keys) => {
  const source = keys.find(key => Object.prototype.hasOwnProperty.call(raw, key));
  if (source) return raw[source];
  const attribute = keys.find(key => Object.prototype.hasOwnProperty.call(attributes, key));
  return attribute ? attributes[attribute] : undefined;
};
const numberOrUndefined = value => {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};
const numberOrNullable = value => {
  if (value === null) return null;
  if (value === undefined || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const availabilityState = quantity => {
  if (quantity === undefined || quantity === null) return 'UNKNOWN';
  return quantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';
};

const sanitizeMetadata = value => {
  if (Array.isArray(value)) return value.map(sanitizeMetadata);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !SENSITIVE_KEY.test(key))
    .map(([key, item]) => [key, sanitizeMetadata(item)]));
};

const unwrapCollection = payload => {
  if (Array.isArray(payload)) return payload;
  const object = asObject(payload);
  for (const key of ['results', 'items', 'products', 'giftcards', 'data']) {
    if (Array.isArray(object[key])) return object[key];
  }
  return [];
};

const unwrapProduct = payload => {
  const object = asObject(payload);
  if (object.product && typeof object.product === 'object') return object.product;
  if (object.data && typeof object.data === 'object' && !Array.isArray(object.data)) return object.data;
  return object;
};

const normalize = (supplier, payload) => {
  const raw = unwrapProduct(payload);
  const attributes = asObject(raw.attributes);
  const supplierProductId = first(raw, ['id', 'product_id', 'productId', 'sku', 'code', 'slug']);
  if (supplierProductId === undefined) {
    const error = new Error(`${supplier} product response has no stable product id`);
    error.code = 'INVALID_SUPPLIER_PRODUCT';
    throw error;
  }

  const quantityKey = ['quantity', 'stock', 'available_quantity', 'availableQuantity']
    .find(key => Object.prototype.hasOwnProperty.call(raw, key));
  const quantityRaw = quantityKey ? raw[quantityKey] : undefined;
  const quantity = numberOrNullable(quantityRaw);
  const priceRaw = Object.prototype.hasOwnProperty.call(raw, 'price') ? raw.price : first(raw, ['cost', 'supplier_cost', 'supplierCost', 'amount']);
  const cost = numberOrNullable(priceRaw);
  const availability = first(raw, ['availability', 'available', 'status']);
  const structuredRegion = structuredValue(raw, attributes, ['region', 'region_code', 'regionCode']);
  const countryCode = structuredValue(raw, attributes, ['country_code', 'countryCode']);
  const platform = structuredValue(raw, attributes, ['platform']);
  const duration = first(raw, ['duration', 'months', 'term', 'period']);
  const variant = first(raw, ['variant', 'edition', 'plan', 'package']);

  return {
    name: String(first(raw, ['name', 'title', 'product_name']) || '').trim(),
    description: String(first(raw, ['description', 'details', 'short_description']) || '').trim(),
    image: String(first(raw, ['image', 'image_url', 'imageUrl', 'thumbnail']) || '').trim(),
    supplier,
    supplierProductId: String(supplierProductId),
    ...(Object.prototype.hasOwnProperty.call(raw, 'slug') ? { slug: raw.slug } : {}),
    ...(Object.prototype.hasOwnProperty.call(raw, 'categoryId') ? { categoryId: raw.categoryId } : {}),
    supplierCost: cost,
    currency: String(first(raw, ['currency', 'currency_code']) || 'USD').toUpperCase(),
    stock: quantity,
    availability: availabilityState(quantity),
    ...(structuredRegion === undefined ? {} : { region: structuredRegion }),
    ...(countryCode === undefined ? {} : { countryCode }),
    ...(platform === undefined ? {} : { platform }),
    ...(duration === undefined ? {} : { duration }),
    ...(variant === undefined ? {} : { variant }),
    ...(Object.prototype.hasOwnProperty.call(raw, 'orderMinQuantity') ? { orderMinQuantity: numberOrNullable(raw.orderMinQuantity) } : {}),
    ...(Object.prototype.hasOwnProperty.call(raw, 'orderMaxQuantity') ? { orderMaxQuantity: numberOrNullable(raw.orderMaxQuantity) } : {}),
    ...(Object.prototype.hasOwnProperty.call(raw, 'requiredNoteFields') ? { requiredNoteFields: raw.requiredNoteFields } : {}),
    ...(Object.prototype.hasOwnProperty.call(raw, 'noteFieldOptions') ? { noteFieldOptions: raw.noteFieldOptions } : {}),
    ...(Object.prototype.hasOwnProperty.call(raw, 'noteFieldTypes') ? { noteFieldTypes: raw.noteFieldTypes } : {}),
    attributes: sanitizeMetadata(attributes),
    productType: first(raw, ['product_type', 'productType', 'type']),
    deliveryType: first(raw, ['delivery_type', 'deliveryType']),
    metadata: sanitizeMetadata(raw)
  };
};

const normalizeCollection = (supplier, payload) => unwrapCollection(payload).flatMap(item => {
  try { return [normalize(supplier, item)]; } catch (error) {
    return [];
  }
});

const normalizeFazerCardsOffer = (payload, context = {}) => {
  const raw = asObject(payload);
  const type = context.type || 'giftcard';
  const categoryId = first(raw, ['category_id', 'game_id', 'manual_service_id']) || context.categoryId;
  const offerId = type === 'giftcard'
    ? first(raw, ['card_id'])
    : type === 'gamekey'
      ? first(raw, ['key_id'])
      : type === 'topup'
        ? first(raw, ['offer_id'])
        : type === 'manual'
          ? first(raw, ['id', 'product_id'])
          : type === 'telegram_premium'
            ? first(raw, ['months'])
            : first(raw, ['id']);

  if (categoryId === undefined || offerId === undefined) {
    const error = new Error('FazerCards offer response has no stable category and offer identifiers');
    error.code = 'INVALID_SUPPLIER_PRODUCT';
    throw error;
  }

  const quantity = numberOrUndefined(first(raw, ['stock', 'quantity']));
  const price = numberOrUndefined(first(raw, ['price_usd', 'price']));
  const categoryName = context.categoryName || first(raw, ['category_name']);
  const name = String(first(raw, ['name', 'title']) || categoryName || `${categoryId}:${offerId}`).trim();
  const variant = first(raw, ['months', 'duration', 'term', 'period', 'variant']) || undefined;
  const region = first(raw, ['region', 'country', 'country_code', 'countryCode']) || undefined;

  const identityMetadata = type === 'giftcard'
    ? { categoryId: String(categoryId), cardId: String(offerId), supplierType: type }
    : type === 'gamekey'
      ? { categoryId: String(categoryId), keyId: String(offerId), supplierType: type }
      : type === 'topup'
        ? { categoryId: String(categoryId), offerId: String(offerId), supplierType: type }
        : { categoryId: String(categoryId), offerId: String(offerId), supplierType: type };

  return {
    name,
    description: String(first(raw, ['description', 'note_product', 'note']) || '').trim(),
    image: String(first(raw, ['imageurl', 'image', 'image_url']) || '').trim(),
    supplier: 'fazercards',
    supplierProductId: `${categoryId}:${offerId}`,
    productType: type,
    ...(variant === undefined ? {} : { variant }),
    ...(region === undefined ? {} : { region }),
    supplierCost: price,
    currency: 'USD',
    stock: quantity,
    availability: availabilityState(quantity),
    deliveryType: type === 'manual' ? 'manual' : 'automatic',
    metadata: sanitizeMetadata({
      ...raw,
      ...identityMetadata,
      categoryName,
    })
  };
};

module.exports = { normalize, normalizeCollection, normalizeFazerCardsOffer, unwrapCollection, sanitizeMetadata, availabilityState };
