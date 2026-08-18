require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const FoxReloadService = require('./services/suppliers/foxReload.service');
const { normalize } = require('./services/suppliers/catalogNormalizer');
const { syncFoxReloadCatalog } = require('./services/supplierCatalog.service');
const { toPublicProduct } = require('./controllers/productController');

const assertNormalization = () => {
  const normalized = normalize('foxreload', {
    id: 'fixture-product',
    name: 'Fixture product',
    price: null,
    quantity: 0,
    attributes: { country_code: 'US', region: 'NA', platform: 'Steam', custom: 'kept' },
    requiredNoteFields: ['email'],
    noteFieldOptions: { email: [] },
    noteFieldTypes: { email: 'email' }
  });
  assert.equal(normalized.supplierCost, null);
  assert.equal(normalized.stock, 0);
  assert.equal(normalized.countryCode, 'US');
  assert.equal(normalized.region, 'NA');
  assert.equal(normalized.platform, 'Steam');
  assert.deepEqual(normalized.requiredNoteFields, ['email']);
  assert.equal(normalized.attributes.custom, 'kept');
  assert.equal(normalize('foxreload', { id: 'null-stock', name: 'Unknown', quantity: null }).stock, null);
  assert.equal(normalize('foxreload', { id: 'null-region', name: 'Unknown', region: null }).region, null);
};

const assertCursorPagination = async () => {
  let calls = 0;
  const pages = [
    { items: [{ id: 'category-1' }], nextCursor: 'cursor-2' },
    { items: [{ id: 'category-2' }], nextCursor: null }
  ];
  const fakeService = {
    getCategories: async options => {
      assert.equal(options.cursor, calls ? 'cursor-2' : undefined);
      return pages[calls++];
    }
  };
  const categories = await FoxReloadService.prototype.getAllCategories.call(fakeService, { limit: 20 });
  assert.deepEqual(categories.map(category => category.id), ['category-1', 'category-2']);
  assert.equal(calls, 2);
};

async function main() {
  assert.equal(Boolean(process.env.FOXRELOAD_API_KEY), true, 'FOXRELOAD_API_KEY must be configured');
  assertNormalization();
  await assertCursorPagination();

  await mongoose.connect(process.env.MONGODB_URI);
  const syncStartedAt = new Date();
  const first = await syncFoxReloadCatalog();
  const second = await syncFoxReloadCatalog();
  const products = await Product.find({ supplier: 'foxreload' })
    .select('+supplierCost +supplierMetadata +supplierAvailability.quantity +supplierAvailability.status +supplierAvailability.checkedAt')
    .lean();
  const ids = products.map(product => product.supplierProductId);
  assert.equal(new Set(ids).size, ids.length, 'supplier product IDs must be unique');
  const syncedProducts = products.filter(product => product.supplierAvailability?.checkedAt >= syncStartedAt);
  assert.ok(syncedProducts.length > 0 && syncedProducts.every(product => product.isActive === false), 'synced products must remain unpublished');
  assert.ok(products.every(product => !('apiKey' in product) && !('authorization' in product)), 'credentials must not be stored');

  const publicProduct = toPublicProduct(products[0] || {});
  assert.equal('supplierCost' in publicProduct, false);
  assert.equal('supplierMetadata' in publicProduct, false);
  assert.equal('supplierAvailability' in publicProduct, false);

  console.log(JSON.stringify({
    categoriesFetched: first.categoriesFetched,
    productsFetched: first.productsFetched,
    firstSync: { inserted: first.productsInserted, updated: first.productsUpdated },
    secondSync: { inserted: second.productsInserted, updated: second.productsUpdated },
    nullPriceProducts: first.nullPriceProducts,
    outOfStockProducts: first.outOfStockProducts,
    unknownStockProducts: first.unknownStockProducts,
    invalidProducts: first.invalidProducts,
    duplicateProducts: first.duplicateProducts,
    productsStored: products.length,
    duplicatesCreated: products.length - new Set(ids).size,
    normalization: 'PASS',
    pagination: 'PASS',
    apiKeyExposed: 'NO',
    credentialsExposed: 'NO'
  }, null, 2));
}

main()
  .catch(error => { console.error(`FoxReload catalog sync test failed: ${error.message}`); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
