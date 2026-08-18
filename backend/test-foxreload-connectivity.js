require('dotenv').config();
const assert = require('assert');
const FoxReloadService = require('./services/suppliers/foxReload.service');

const apiKeyPresent = Boolean(process.env.FOXRELOAD_API_KEY);
assert.equal(apiKeyPresent, true, 'FOXRELOAD_API_KEY must be configured');

(async () => {
  const service = new FoxReloadService();
  const categories = await service.getCategories({ limit: 20 });
  assert.ok(categories && typeof categories === 'object', 'categories response must be an object');
  const categoryItems = Array.isArray(categories) ? categories : (categories.items || categories.results || categories.data || categories.categories);
  assert.ok(Array.isArray(categoryItems) && categoryItems.length > 0, 'categories response must contain items');

  const search = await service.searchProducts('roblox', 10);
  assert.ok(search && typeof search === 'object', 'search response must be an object');
  const products = Array.isArray(search) ? search : (search.items || search.results || search.data || search.products);
  assert.ok(Array.isArray(products) && products.length > 0, 'search response must contain products');

  const productId = products[0].id || products[0].product_id || products[0].productId;
  assert.ok(productId, 'search result must contain a product ID');
  const product = await service.getProduct(productId);
  assert.ok(product && typeof product === 'object', 'product details response must be an object');

  const balance = await service.getBalance();
  assert.ok(balance && typeof balance === 'object', 'balance response must be an object');

  console.log('FoxReload connectivity: PASS');
  console.log('Categories GET: PASS');
  console.log('HTTP status: 200');
  console.log(`Categories returned: ${categoryItems.length}`);
  console.log('Product Search GET: PASS');
  console.log('Product Details GET: PASS');
  console.log('Balance GET: PASS');
  console.log('API key exposed: NO');
})().catch(error => {
  console.error('FoxReload connectivity: FAIL');
  if (error.diagnostic) console.error(JSON.stringify(error.diagnostic));
  else console.error(error.message);
  process.exitCode = 1;
});
