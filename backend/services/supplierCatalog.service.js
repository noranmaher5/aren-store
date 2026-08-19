const Product = require('../models/Product');
const { getSupplier } = require('./suppliers');
const { normalize, normalizeFazerCardsOffer } = require('./suppliers/catalogNormalizer');

const IMPORTABLE_FIELDS = [
  'name', 'description', 'shortDescription', 'category', 'image', 'images',
  'platform', 'region', 'tags', 'price', 'originalPrice', 'currency',
  'productType', 'deliveryType', 'availabilityType', 'stock', 'isUnlimited',
  'isOutOfStock', 'isActive', 'manualRequest'
];

const foxCategoryToLocalCategory = category => {
  // Supplier taxonomy is retained in supplierMetadata. The storefront's
  // category enum is intentionally not inferred from supplier names/slugs.
  return category?.localCategory || 'general';
};

const syncFoxReloadCatalog = async ({ service = getSupplier('foxreload'), ProductModel = Product, dryRun = false } = {}) => {
  const stats = {
    categoriesFetched: 0, productsFetched: 0, productsInserted: 0, productsUpdated: 0,
    productsSkipped: 0, invalidProducts: 0, nullPriceProducts: 0, outOfStockProducts: 0,
    unknownStockProducts: 0, duplicateProducts: 0
  };
  const categories = await service.getAllCategories({ limit: 100 });
  stats.categoriesFetched = categories.length;
  const seenSupplierIds = new Set();

  for (const category of categories) {
    if (!category?.id) { stats.productsSkipped++; continue; }
    const pageSize = 100;
    for (let offset = 0; ; offset += pageSize) {
      const page = await service.listProducts({ categoryIdOrSlug: category.id, limit: pageSize, offset });
      const products = Array.isArray(page) ? page : page?.items || [];
      if (!products.length) break;
      for (const raw of products) {
        stats.productsFetched++;
        let normalized;
        try {
          normalized = normalize('foxreload', { ...raw, categoryId: raw.categoryId ?? category.id });
          if (!normalized.name || !normalized.supplierProductId) throw new Error('missing product name or ID');
        } catch (error) {
          stats.invalidProducts++;
          continue;
        }
        if (seenSupplierIds.has(normalized.supplierProductId)) {
          stats.duplicateProducts++;
          continue;
        }
        seenSupplierIds.add(normalized.supplierProductId);
        if (normalized.supplierCost === null || normalized.supplierCost === undefined) stats.nullPriceProducts++;
        if (normalized.stock === null || normalized.stock === undefined) stats.unknownStockProducts++;
        else if (normalized.stock <= 0) stats.outOfStockProducts++;
        if (dryRun) continue;

        const values = {
          name: normalized.name,
          description: normalized.description,
          category: foxCategoryToLocalCategory(category),
          price: normalized.supplierCost ?? null,
          currency: normalized.currency,
          ...(normalized.platform === undefined ? {} : { platform: normalized.platform }),
          ...(normalized.region === undefined ? {} : { region: normalized.region }),
          supplier: 'foxreload',
          supplierProductId: normalized.supplierProductId,
          supplierMetadata: {
            ...normalized.metadata,
            category,
            categoryId: normalized.categoryId ?? category.id,
            attributes: normalized.attributes,
            requiredNoteFields: normalized.requiredNoteFields,
            noteFieldOptions: normalized.noteFieldOptions,
            noteFieldTypes: normalized.noteFieldTypes,
            price: normalized.supplierCost,
            quantity: normalized.stock,
            countryCode: normalized.countryCode,
            region: normalized.region,
            platform: normalized.platform
          },
          supplierAvailability: {
            quantity: normalized.stock ?? null,
            status: normalized.availability,
            checkedAt: new Date()
          },
          isActive: false,
          isOutOfStock: normalized.stock !== null && normalized.stock !== undefined && normalized.stock <= 0,
          stock: normalized.stock ?? null
        };
        const existing = await ProductModel.findOne({ supplier: 'foxreload', supplierProductId: normalized.supplierProductId })
          .select('+supplierMetadata +supplierAvailability +supplierCost');
        if (existing) {
          Object.assign(existing, values);
          await existing.save();
          stats.productsUpdated++;
        } else {
          await ProductModel.create(values);
          stats.productsInserted++;
        }
      }
      if (products.length < pageSize || (page.total !== undefined && offset + products.length >= Number(page.total))) break;
    }
  }
  return stats;
};

const FAZERCARDS_CATALOGS = {
  giftcards: { categories: 'getGiftCardCategories', offers: 'getGiftCardOffers', listKey: 'offers', type: 'giftcard', categoryId: item => item?.category_id },
  gamekeys: { categories: 'getGameKeyCategories', offers: 'getGameKeyOffers', listKey: 'keys', type: 'gamekey', categoryId: item => item?.game_id },
  topups: { categories: 'getTopupCategories', offers: 'getTopupOffers', listKey: 'offers', type: 'topup', categoryId: item => item?.category_id },
  manual: { categories: 'getManualServices', offers: 'getManualOffers', listKey: 'items', type: 'manual', categoryId: item => item?.id }
};

const listFromResponse = (response, keys) => {
  if (Array.isArray(response)) return response;
  for (const key of keys) if (Array.isArray(response?.[key])) return response[key];
  return [];
};

const nextCursorFromResponse = response => response?.meta?.next_cursor || response?.next_cursor || response?.pagination?.next_cursor;

const syncFazerCardsCatalog = async ({
  service = getSupplier('fazercards'),
  ProductModel = Product,
  dryRun = false,
  catalogTypes = ['giftcards'],
  pageSize = 100
} = {}) => {
  const stats = {
    catalogsFetched: 0, categoriesFetched: 0, productsFetched: 0,
    productsInserted: 0, productsUpdated: 0, productsSkipped: 0,
    invalidProducts: 0, nullPriceProducts: 0, outOfStockProducts: 0,
    unknownStockProducts: 0, duplicateProducts: 0, deletedProducts: 0
  };
  const seenSupplierIds = new Set();

  for (const catalogType of catalogTypes) {
    const config = FAZERCARDS_CATALOGS[catalogType];
    if (!config || typeof service[config.categories] !== 'function' || typeof service[config.offers] !== 'function') {
      stats.productsSkipped++;
      continue;
    }
    stats.catalogsFetched++;
    let categoryCursor;
    do {
      const categoryResponse = await service[config.categories]({ limit: pageSize, cursor: categoryCursor });
      const categories = listFromResponse(categoryResponse, ['categories', 'items', 'results', 'data']);
      stats.categoriesFetched += categories.length;
      for (const category of categories) {
        const categoryId = config.categoryId(category);
        if (!categoryId) { stats.productsSkipped++; continue; }
        let offerCursor;
        do {
          const offerResponse = await service[config.offers](categoryId, { limit: pageSize, cursor: offerCursor });
          const offers = listFromResponse(offerResponse, [config.listKey, 'offers', 'keys', 'items', 'results', 'data']);
          for (const raw of offers) {
            stats.productsFetched++;
            let normalized;
            try {
              normalized = normalizeFazerCardsOffer(raw, {
                type: config.type,
                categoryId,
                categoryName: category.name || category.category_name || offerResponse?.name || offerResponse?.category?.name
              });
              if (!normalized.name || !normalized.supplierProductId) throw new Error('missing product identity');
            } catch (error) {
              stats.invalidProducts++;
              continue;
            }
            if (seenSupplierIds.has(normalized.supplierProductId)) { stats.duplicateProducts++; continue; }
            seenSupplierIds.add(normalized.supplierProductId);
            if (normalized.supplierCost === null || normalized.supplierCost === undefined) stats.nullPriceProducts++;
            if (normalized.stock === null || normalized.stock === undefined) stats.unknownStockProducts++;
            else if (normalized.stock <= 0) stats.outOfStockProducts++;
            if (dryRun) continue;

            const values = {
              name: normalized.name,
              description: normalized.description,
              category: 'general',
              ...(normalized.supplierCost === undefined ? {} : { price: normalized.supplierCost, supplierCost: normalized.supplierCost }),
              currency: normalized.currency,
              ...(normalized.region === undefined ? {} : { region: normalized.region }),
              supplier: 'fazercards',
              supplierProductId: normalized.supplierProductId,
              supplierMetadata: { ...normalized.metadata, attributes: normalized.attributes, category, categoryId },
              supplierAvailability: { quantity: normalized.stock ?? null, status: normalized.availability, checkedAt: new Date() },
              isActive: false,
              isOutOfStock: normalized.stock !== null && normalized.stock !== undefined && normalized.stock <= 0,
              // Supplier quantity is kept separate; local DigitalCode stock is never fabricated.
              stock: 0,
              productType: normalized.productType === 'giftcard' ? 'gift_card' : normalized.productType === 'manual' ? 'service' : 'digital',
              deliveryType: normalized.deliveryType
            };
            const existing = await ProductModel.findOne({ supplier: 'fazercards', supplierProductId: normalized.supplierProductId })
              .select('+supplierMetadata +supplierAvailability +supplierCost');
            if (existing) { Object.assign(existing, values); await existing.save(); stats.productsUpdated++; }
            else { await ProductModel.create(values); stats.productsInserted++; }
          }
          offerCursor = nextCursorFromResponse(offerResponse);
        } while (offerCursor);
      }
      categoryCursor = nextCursorFromResponse(categoryResponse);
    } while (categoryCursor);
  }
  return stats;
};

const pick = (source, keys) => Object.fromEntries(keys
  .filter(key => Object.prototype.hasOwnProperty.call(source || {}, key))
  .map(key => [key, source[key]]));

const getAvailabilityStatus = (quantity, availability) => {
  if (availability !== undefined && availability !== null && availability !== '') {
    return String(availability).toUpperCase();
  }
  if (quantity === undefined || quantity === null) return 'UNKNOWN';
  return Number(quantity) > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';
};

const getSupplierProduct = async (supplierName, supplierProductId, input = {}) => {
  if (supplierName === 'fazercards') {
    return getFazerCardsProduct(supplierProductId, input);
  }
  const result = await getSupplier(supplierName).getProduct(supplierProductId);
  return normalize(supplierName, result);
};

const getFazerCardsProduct = async (supplierProductId, input = {}) => {
  const service = getSupplier('fazercards');
  const [categoryId, offerId] = String(supplierProductId || '').split(':');
  const type = input.supplierMetadata?.supplierType || 'giftcard';
  if (!categoryId || !offerId) {
    const error = new Error('FazerCards supplierProductId must contain category and offer IDs');
    error.statusCode = 400;
    error.code = 'INVALID_SUPPLIER_PRODUCT_ID';
    throw error;
  }

  if (type === 'giftcard') {
    return normalizeFazerCardsOffer(await service.getProduct(supplierProductId), { type, categoryId });
  }

  const methods = {
    gamekey: ['getGameKeyOffers', 'keys', 'key_id'],
    topup: ['getTopupOffers', 'offers', 'offer_id'],
    manual: ['getManualOffers', 'items', 'id']
  };
  if (!methods[type]) {
    const error = new Error(`FazerCards import type is not supported: ${type}`);
    error.statusCode = 400;
    error.code = 'UNSUPPORTED_SUPPLIER_PRODUCT_TYPE';
    throw error;
  }
  const [method, listKey, idKey] = methods[type];
  const result = await service[method](categoryId);
  const offer = (result?.[listKey] || []).find(item => String(item[idKey]) === offerId);
  if (!offer) {
    const error = new Error('FazerCards supplier offer was not found');
    error.statusCode = 404;
    error.code = 'SUPPLIER_PRODUCT_NOT_FOUND';
    throw error;
  }
  return normalizeFazerCardsOffer(offer, { type, categoryId, categoryName: result.name || result.category?.name });
};

const importProduct = async ({ supplierName, supplierProductId, input = {}, user }) => {
  supplierName = String(supplierName || '').trim().toLowerCase();
  supplierProductId = String(supplierProductId || '').trim();
  if (!['foxreload', 'fazercards'].includes(supplierName)) {
    const error = new Error('Unsupported supplier');
    error.statusCode = 400;
    error.code = 'UNSUPPORTED_SUPPLIER';
    throw error;
  }
  if (!supplierProductId) {
    const error = new Error('Supplier product ID is required');
    error.statusCode = 400;
    error.code = 'SUPPLIER_PRODUCT_ID_MISSING';
    throw error;
  }
  const normalized = await getSupplierProduct(supplierName, supplierProductId, input);
  if (!normalized || !normalized.name || !normalized.supplierProductId || normalized.supplierProductId !== supplierProductId) {
    const error = new Error('Supplier response is missing a valid product identity');
    error.statusCode = 422;
    error.code = 'INVALID_SUPPLIER_PRODUCT';
    throw error;
  }
  const existing = await Product.findOne({ supplier: supplierName, supplierProductId });
  const publicInput = pick(input, IMPORTABLE_FIELDS);

  if (publicInput.category === undefined || String(publicInput.category).trim() === '') {
    const error = new Error('An Aren category is required for supplier product import');
    error.statusCode = 400;
    throw error;
  }

  const productTypeMap = { giftcard: 'gift_card', gamekey: 'digital', topup: 'service', manual: 'service' };
  const supplierValues = {
    supplier: supplierName,
    supplierProductId,
    ...(normalized.supplierCost === undefined ? {} : { supplierCost: normalized.supplierCost }),
    supplierMetadata: normalized.metadata,
    supplierAvailability: {
      ...(normalized.stock === undefined ? {} : { quantity: normalized.stock }),
      status: getAvailabilityStatus(normalized.stock, normalized.availability),
      checkedAt: new Date()
    }
  };

  const values = existing
    ? {
        ...supplierValues,
        ...(publicInput.category === undefined ? {} : { category: publicInput.category }),
        ...(normalized.region === undefined ? {} : { region: normalized.region })
      }
    : {
        ...publicInput,
        ...supplierValues,
        name: normalized.name,
        description: normalized.description || '',
        image: normalized.image || '',
        region: normalized.region || publicInput.region || 'Global',
        currency: publicInput.currency || normalized.currency,
        price: 0,
        productType: productTypeMap[normalized.productType] || publicInput.productType || 'digital',
        isActive: false,
        createdBy: user?.id
      };

  if (!values.name) {
    const error = new Error('Supplier product does not contain a public name');
    error.statusCode = 422;
    throw error;
  }

  if (supplierName === 'fazercards' && normalized.supplierCost === undefined) {
    const error = new Error('FazerCards offer has no documented price and cannot be imported');
    error.statusCode = 422;
    error.code = 'SUPPLIER_PRICE_REQUIRED';
    throw error;
  }

  // Supplier quantity is kept separately for admin visibility. Legacy `stock`
  // remains zero for supplier products so DigitalCode stock is never fabricated.
  values.stock = 0;
  if (normalized.stock !== undefined) values.isOutOfStock = normalized.stock <= 0;
  if (values.deliveryType === undefined && ['instant', 'automatic', 'manual'].includes(normalized.deliveryType)) values.deliveryType = normalized.deliveryType;

  if (existing) {
    Object.assign(existing, values);
    await existing.save();
    return { product: existing, created: false, normalized };
  }

  const product = await Product.create(values);
  return { product, created: true, normalized };
};

module.exports = { getSupplierProduct, importProduct, syncFoxReloadCatalog, syncFazerCardsCatalog, IMPORTABLE_FIELDS };
