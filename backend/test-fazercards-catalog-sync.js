const assert = require('assert');
const { syncFazerCardsCatalog } = require('./services/supplierCatalog.service');

const records = new Map();
const ProductModel = {
  findOne: (_query) => ({
    select: async () => records.get('cat-1:offer-1') || null
  }),
  create: async (values) => {
    const record = { ...values, save: async function save() { records.set(this.supplierProductId, this); } };
    records.set(record.supplierProductId, record);
    return record;
  }
};

const service = {
  getGiftCardCategories: async ({ cursor } = {}) => cursor
    ? { categories: [], meta: { has_more: false } }
    : { categories: [{ category_id: 'cat-1', name: 'Test Cards' }], meta: { has_more: false } },
  getGiftCardOffers: async () => ({
    category_id: 'cat-1',
    name: 'Test Cards',
    offers: [{ card_id: 'offer-1', name: 'Test Card', price_usd: null, stock: null }],
    meta: { has_more: false }
  })
};

(async () => {
  const first = await syncFazerCardsCatalog({ service, ProductModel });
  const second = await syncFazerCardsCatalog({ service, ProductModel });
  const product = records.get('cat-1:offer-1');

  assert.equal(first.productsInserted, 1);
  assert.equal(first.productsUpdated, 0);
  assert.equal(second.productsInserted, 0);
  assert.equal(second.productsUpdated, 1);
  assert.equal(product.supplierAvailability.quantity, null);
  assert.equal(product.price, null);
  assert.equal(product.supplierProductId, 'cat-1:offer-1');
  assert.equal(first.duplicateProducts, 0);
  assert.equal(second.duplicateProducts, 0);
  console.log('FazerCards catalog sync and idempotency: PASS');
})().catch(error => {
  console.error(`FazerCards catalog sync test failed: ${error.message}`);
  process.exitCode = 1;
});
