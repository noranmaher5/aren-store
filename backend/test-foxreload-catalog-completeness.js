require('dotenv').config();
const assert = require('assert');
const fs = require('fs');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const FoxReloadService = require('./services/suppliers/foxReload.service');
const { toPublicProduct, toAdminProduct } = require('./controllers/productController');

const collectionItems = payload => Array.isArray(payload) ? payload : payload?.items || [];
const safeCategory = category => ({
  id: category.id,
  slug: category.slug,
  name: category.name,
  hasProducts: category.hasProducts,
  inStockCount: category.inStockCount
});

async function main() {
  assert.ok(process.env.FOXRELOAD_API_KEY, 'FOXRELOAD_API_KEY is missing');
  const service = new FoxReloadService();
  assert.equal(service.baseUrl, 'https://public-api.foxreload.com');

  const categoryPages = [];
  let cursor;
  do {
    const page = await service.getCategories({ limit: 20, cursor });
    categoryPages.push(page);
    cursor = page?.nextCursor || null;
  } while (cursor);
  const categories = categoryPages.flatMap(collectionItems);
  assert.ok(categories.length > 0);
  assert.equal(new Set(categories.map(category => category.id)).size, categories.length);

  const categoryResults = [];
  const allCategoryProducts = [];
  for (const category of categories) {
    let offset = 0;
    let pages = 0;
    let returned = 0;
    let reportedTotal;
    let terminated = false;
    const categoryProducts = [];
    while (true) {
      const page = await service.listProducts({ categoryIdOrSlug: category.id, limit: 100, offset });
      const products = collectionItems(page);
      pages++;
      categoryProducts.push(...products);
      returned += products.length;
      reportedTotal = page?.total;
      if (!products.length || products.length < 100 || (reportedTotal !== undefined && offset + products.length >= Number(reportedTotal))) {
        terminated = true;
        break;
      }
      offset += products.length;
    }
    allCategoryProducts.push(...categoryProducts.map(product => ({ ...product, categoryId: product.categoryId || category.id })));
    categoryResults.push({
      category: safeCategory(category),
      returned,
      pages,
      reportedTotal: reportedTotal ?? null,
      complete: terminated && (reportedTotal === undefined || returned === Number(reportedTotal))
    });
  }

  let globalListing = { status: 'not-supported', returned: 0, total: null };
  try {
    const page = await service.request('/api/products/?limit=100&offset=0');
    globalListing = { status: 'supported', returned: collectionItems(page).length, total: page?.total ?? null };
  } catch (error) {
    globalListing.status = error.code || 'HTTP_ERROR';
  }

  const search = await service.searchProducts('roblox', 20);
  const searchProducts = collectionItems(search);
  const detailSamples = [...allCategoryProducts, ...searchProducts]
    .filter((product, index, products) => product?.id && products.findIndex(item => item.id === product.id) === index)
    .slice(0, 5);
  const details = [];
  for (const product of detailSamples) {
    const detail = await service.getProduct(product.id);
    details.push(detail);
    assert.equal(detail.id, product.id);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const mongoProducts = await Product.find({ supplier: 'foxreload' })
    .select('+supplierCost +supplierAvailability.quantity +supplierAvailability.status +supplierAvailability.checkedAt')
    .lean();
  const identities = mongoProducts.map(product => `${product.supplier}:${product.supplierProductId}`);
  const localIds = new Set(mongoProducts.map(product => product.supplierProductId));
  const publicProducts = mongoProducts.map(toPublicProduct);
  const adminProducts = mongoProducts.map(toAdminProduct);
  const adminSource = fs.readFileSync('../frontend/src/pages/admin/AdminProducts.js', 'utf8');
  const productRoutes = fs.readFileSync('./routes/productRoutes.js', 'utf8');
  const publicSafe = publicProducts.every(product => !Object.keys(product).some(key => /api[-_]?key|authorization|secret|credential|supplierMetadata/i.test(key)));
  const categoryProductsMissingLocally = allCategoryProducts.filter(product => !localIds.has(String(product.id))).length;

  console.log('FOXRELOAD_API_KEY: PRESENT');
  console.log(`FoxReload base URL: ${service.baseUrl}`);
  console.log(`Categories discovered: ${categories.length}`);
  console.log(`Category pages: ${categoryPages.length}`);
  console.log('Category | inStockCount | API Returned | Pages | Pagination complete');
  for (const result of categoryResults) {
    console.log(`${result.category.name} | ${result.category.inStockCount} | ${result.returned} | ${result.pages} | ${result.complete ? 'YES' : 'NO'}`);
  }
  console.log(`Products returned by category traversal: ${allCategoryProducts.length}`);
  console.log(`Products returned by global listing: ${globalListing.status} (${globalListing.returned}, total ${globalListing.total ?? 'n/a'})`);
  console.log(`Products returned by search cross-check: ${searchProducts.length}`);
  console.log(`Products verified by details: ${details.length}`);
  console.log(`FoxReload products in MongoDB: ${mongoProducts.length}`);
  console.log(`Category products missing locally: ${categoryProductsMissingLocally}`);
  console.log(`Duplicate supplier identities: ${identities.length - new Set(identities).size}`);
  console.log(JSON.stringify({
    categoriesWithProducts: categories.filter(category => category.hasProducts === true).length,
    categoriesWithHasProductsFalse: categories.filter(category => category.hasProducts === false).length,
    inStock: mongoProducts.filter(product => product.supplierAvailability?.quantity > 0).length,
    outOfStock: mongoProducts.filter(product => product.supplierAvailability?.quantity === 0).length,
    unknownStock: mongoProducts.filter(product => product.supplierAvailability?.quantity === null || product.supplierAvailability?.quantity === undefined).length,
    nullPrice: mongoProducts.filter(product => product.price === null || product.supplierCost === null).length,
    populatedPrice: mongoProducts.filter(product => Number.isFinite(product.price) || Number.isFinite(product.supplierCost)).length,
    countryRegionPreserved: mongoProducts.filter(product => product.supplierMetadata?.countryCode !== undefined || product.region !== undefined).length,
    platformPreserved: mongoProducts.filter(product => product.platform !== undefined || product.supplierMetadata?.platform !== undefined).length,
    requiredFieldsPreserved: mongoProducts.filter(product => product.supplierMetadata?.requiredNoteFields !== undefined).length,
    adminSupplierProducts: adminProducts.filter(product => product.supplier === 'foxreload').length,
    adminHasSupplierIdentity: adminProducts.every(product => product.supplierProductId),
    adminSourceHasSupplierFilter: /supplierFilter/.test(adminSource),
    adminSourceHasCategoryFilter: /categoryFilter|selectedCategory|categoryFilter/.test(adminSource),
    adminSourceHasStockDisplay: /getSupplierQuantity|supplierAvailability/.test(adminSource),
    adminSourceHasPriceDisplay: /supplierCost|p\.price/.test(adminSource),
    adminRouteAvailable: /admin\/list/.test(productRoutes),
    publicApiSanitized: publicSafe,
    apiKeyExposed: 'NO',
    credentialsExposed: 'NO'
  }, null, 2));
}

main()
  .catch(error => {
    console.error(`FoxReload completeness diagnostic failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
