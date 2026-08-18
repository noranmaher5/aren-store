require('dotenv').config();

const { getSupplier } = require('./services/suppliers');
const { normalizeCollection } = require('./services/suppliers/catalogNormalizer');

const REQUESTED_PRODUCTS = [
  'Netflix Premium', 'Shahid VIP', 'Disney+ Premium', 'Amazon Prime Video',
  'OSN+ Subscription', 'TOD Subscription', 'Apple TV+', 'Hulu Premium',
  'Snapchat Plus Code', 'YouTube Premium', 'Discord Nitro', 'Telegram Premium', 'X Premium',
  'Canva Pro', 'ChatGPT Plus', 'Microsoft 365 Personal', 'Google One Storage',
  'iCloud+ Storage', 'Adobe Creative Cloud',
  'Spotify Premium', 'Apple Music', 'Anghami Plus', 'Audible Premium'
];

const unwrap = payload => {
  if (Array.isArray(payload)) return payload;
  for (const key of ['results', 'items', 'products', 'giftcards', 'data']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const safeError = error => ({
  message: error.message,
  status: error.status
});

const safeProduct = product => ({
  name: product.name,
  supplierProductId: product.supplierProductId,
  supplierCost: product.supplierCost,
  currency: product.currency,
  quantity: product.stock,
  availability: product.availability,
  region: product.metadata?.region || product.metadata?.country,
  duration: product.metadata?.duration || product.metadata?.term
});

const safeRawItem = item => {
  if (!item || typeof item !== 'object') return item;
  return Object.fromEntries(
    ['id', 'product_id', 'productId', 'sku', 'code', 'name', 'title', 'price', 'amount', 'currency', 'category', 'category_id', 'country', 'region', 'duration', 'quantity', 'available', 'status']
      .filter(key => Object.prototype.hasOwnProperty.call(item, key))
      .map(key => [key, item[key]])
  );
};

async function main() {
  const supplier = getSupplier('fazercards');
  const report = {
    capabilities: {
      balance: null,
      categories: 'NOT IMPLEMENTED / NOT VERIFIED',
      search: null,
      productDetails: null
    },
    searches: []
  };

  try {
    const balance = await supplier.getBalance();
    report.capabilities.balance = { verified: true, responseKeys: Object.keys(balance || {}) };
  } catch (error) {
    report.capabilities.balance = { verified: false, error: safeError(error) };
  }

  let detailAttempts = 0;
  for (const requestedProduct of REQUESTED_PRODUCTS) {
    try {
      const response = await supplier.searchProducts(requestedProduct, 50);
      const normalized = normalizeCollection('fazercards', response);
      report.capabilities.search = { verified: true, responseKeys: Object.keys(response || {}) };
      const candidates = normalized.map(safeProduct);

      for (const candidate of normalized.slice(0, 3)) {
        if (detailAttempts >= 10) break;
        detailAttempts += 1;
        try {
          const detailResponse = await supplier.getProduct(candidate.supplierProductId);
          report.capabilities.productDetails = {
            verified: true,
            responseKeys: Object.keys(detailResponse || {})
          };
        } catch (error) {
          report.capabilities.productDetails = { verified: false, error: safeError(error) };
        }
      }

      const rawItems = unwrap(response);
      report.searches.push({
        requestedProduct,
        resultCount: rawItems.length,
        rawItemKeys: Object.keys(rawItems[0] || {}),
        sampleItems: rawItems.slice(0, 3).map(safeRawItem),
        candidates
      });
    } catch (error) {
      report.searches.push({ requestedProduct, resultCount: 0, candidates: [], error: safeError(error) });
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch(error => {
  console.error(JSON.stringify(safeError(error)));
  process.exitCode = 1;
});
