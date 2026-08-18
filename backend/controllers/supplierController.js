const { getSupplier } = require('../services/suppliers');
const { normalizeCollection, normalize, normalizeFazerCardsOffer } = require('../services/suppliers/catalogNormalizer');
const { importProduct } = require('../services/supplierCatalog.service');
const { toAdminProduct } = require('./productController');

const SENSITIVE_KEY = /(api[-_]?key|secret|password|token|authorization|credential)/i;

const sanitize = (value) => {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEY.test(key))
      .map(([key, item]) => [key, sanitize(item)])
  );
};

const withSupplier = (req) => getSupplier(req.params.supplier);
const isFazerCards = req => String(req.params.supplier || '').toLowerCase() === 'fazercards';

const catalogCategories = {
  giftcards: 'getGiftCardCategories',
  gamekeys: 'getGameKeyCategories',
  topups: 'getTopupCategories',
  manual: 'getManualServices'
};

const catalogOffers = {
  giftcards: 'getGiftCardOffers',
  gamekeys: 'getGameKeyOffers',
  topups: 'getTopupOffers',
  manual: 'getManualOffers'
};

const specialCatalogs = {
  'telegram-premium': 'getTelegramPremiumCatalog',
  'telegram-stars': 'getTelegramStarsCatalog',
  'steam-topup': 'getSteamTopupRates',
  'steam-gifts': 'getSteamGiftGames'
};

const normalizeFazerCatalog = (type, result, category) => {
  const listKey = { giftcards: 'offers', gamekeys: 'keys', topups: 'offers', manual: 'items' }[type];
  const context = {
    type: type === 'giftcards' ? 'giftcard' : type === 'gamekeys' ? 'gamekey' : type === 'topups' ? 'topup' : 'manual',
    categoryId: category?.id || category?.category_id || category?.game_id || result?.manual_service_id,
    categoryName: category?.name || result?.name || result?.category?.name
  };
  return (result?.[listKey] || []).flatMap(item => {
    try { return [normalizeFazerCardsOffer(item, context)]; } catch (error) { return []; }
  });
};

exports.getSpecialCatalog = async (req, res, next) => {
  try {
    if (!isFazerCards(req)) return res.status(400).json({ success: false, message: 'Catalog browsing is currently available for FazerCards only' });
    const type = String(req.params.catalogType || '').toLowerCase();
    const method = specialCatalogs[type];
    if (!method || typeof withSupplier(req)[method] !== 'function') return res.status(400).json({ success: false, message: 'Unsupported FazerCards catalog type' });
    const result = await withSupplier(req)[method](req.query);
    res.json({ success: true, supplier: req.params.supplier, catalogType: type, data: sanitize(result) });
  } catch (err) { next(err); }
};

exports.getCatalogCategories = async (req, res, next) => {
  try {
    if (!isFazerCards(req)) return res.status(400).json({ success: false, message: 'Catalog browsing is currently available for FazerCards only' });
    const method = catalogCategories[String(req.params.catalogType || '').toLowerCase()];
    if (!method || typeof withSupplier(req)[method] !== 'function') return res.status(400).json({ success: false, message: 'Unsupported FazerCards catalog type' });
    const result = await withSupplier(req)[method](req.query);
    res.json({ success: true, supplier: req.params.supplier, catalogType: req.params.catalogType, data: sanitize(result) });
  } catch (err) { next(err); }
};

exports.getCatalogOffers = async (req, res, next) => {
  try {
    if (!isFazerCards(req)) return res.status(400).json({ success: false, message: 'Catalog browsing is currently available for FazerCards only' });
    const type = String(req.params.catalogType || '').toLowerCase();
    const method = catalogOffers[type];
    if (!method || typeof withSupplier(req)[method] !== 'function') return res.status(400).json({ success: false, message: 'Unsupported FazerCards catalog type' });
    const result = await withSupplier(req)[method](req.params.categoryId, req.query);
    const category = { id: req.params.categoryId, name: result?.name || result?.category?.name };
    res.json({
      success: true,
      supplier: req.params.supplier,
      catalogType: type,
      data: sanitize(result),
      normalized: normalizeFazerCatalog(type, result, category)
    });
  } catch (err) { next(err); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const result = await withSupplier(req).getCategories();
    res.json({ success: true, supplier: req.params.supplier, data: sanitize(result) });
  } catch (err) {
    next(err);
  }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const query = String(req.query.query || '').trim();
    if (!query) return res.status(400).json({ success: false, message: 'query is required' });

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const result = await withSupplier(req).searchProducts(query, limit);
    res.json({ success: true, supplier: req.params.supplier, data: sanitize(result), normalized: normalizeCollection(req.params.supplier, result) });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const productId = String(req.params.productId || '').trim();
    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });

    const result = await withSupplier(req).getProduct(productId);
    const normalized = isFazerCards(req)
      ? normalizeFazerCardsOffer(result, { type: 'giftcard', categoryId: result.category_id, categoryName: result.category_name })
      : normalize(req.params.supplier, result);
    res.json({ success: true, supplier: req.params.supplier, data: sanitize(result), normalized });
  } catch (err) {
    next(err);
  }
};

exports.getBalance = async (req, res, next) => {
  try {
    const result = await withSupplier(req).getBalance();
    res.json({ success: true, supplier: req.params.supplier, data: sanitize(result) });
  } catch (err) {
    next(err);
  }
};

exports.importProduct = async (req, res, next) => {
  try {
    const supplier = String(req.params.supplier || '').toLowerCase();
    const supplierProductId = String(req.params.productId || '').trim();
    const result = await importProduct({ supplierName: supplier, supplierProductId, input: req.body, user: req.user });
    res.status(result.created ? 201 : 200).json({
      success: true,
      created: result.created,
      product: toAdminProduct(result.product),
      message: result.created ? 'Supplier product imported' : 'Supplier product synchronized'
    });
  } catch (err) { next(err); }
};
