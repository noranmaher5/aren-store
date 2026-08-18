require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const { REQUESTED_PRODUCTS } = require('./config/catalog');

// Read-only audit. It intentionally labels unlinked products for review rather
// than deleting them: supplier linkage is the only safe proof of origin.
async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({}).select('name supplier supplierProductId isActive category price').lean();
  const linked = products.filter(product => ['foxreload', 'fazercards'].includes(product.supplier) && product.supplierProductId);
  const unlinked = products.filter(product => !(['foxreload', 'fazercards'].includes(product.supplier) && product.supplierProductId));
  const requested = REQUESTED_PRODUCTS.map(name => ({ name, matches: products.filter(product => product.name.toLowerCase().includes(name.toLowerCase().replace(' subscription', '').replace(' premium', ''))).map(product => product._id) }));

  console.log(JSON.stringify({
    total: products.length,
    linkedSupplierProducts: linked.length,
    unlinkedNeedsReview: unlinked.length,
    bySupplier: products.reduce((counts, product) => { counts[product.supplier || 'unknown'] = (counts[product.supplier || 'unknown'] || 0) + 1; return counts; }, {}),
    requestedNameMatches: requested
  }, null, 2));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
