require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const { toPublicProduct } = require('./controllers/productController');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({ supplier: 'foxreload' })
    .select('+supplierCost +supplierMetadata +supplierAvailability')
    .lean();
  const publicProducts = products.map(toPublicProduct);
  console.log(JSON.stringify({
    supplierProducts: products.length,
    publicHasSupplierCost: publicProducts.some(product => 'supplierCost' in product),
    publicHasSupplierMetadata: publicProducts.some(product => 'supplierMetadata' in product),
    publicHasSupplierAvailability: publicProducts.some(product => 'supplierAvailability' in product),
    allUnpublished: products.every(product => product.isActive === false),
    zeroQuantityUnpublished: products
      .filter(product => product.supplierAvailability?.quantity === 0)
      .every(product => product.isActive === false),
    idsUnique: new Set(products.map(product => product.supplierProductId)).size === products.length
  }, null, 2));
}

main()
  .catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
