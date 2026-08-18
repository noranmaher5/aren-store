require('dotenv').config();
const mongoose = require('mongoose');
const { importProduct } = require('./services/supplierCatalog.service');

// The IDs below are the only FoxReload products confirmed in Phase 6A.
// This script is deliberately idempotent and never imports search results.
const VERIFIED_PRODUCTS = [
  { name: 'Shahid VIP', id: 'product_01kz1ret63fk194vxzxggbq48x', category: 'movies' },
  { name: 'Discord Nitro', id: 'product_01ks0qnkd0e0hax8307rgkdndm', category: 'social-daily-apps' },
  { name: 'Telegram Premium', id: 'product_01kn1qqhfgekgte4mbtgtc58zp', category: 'social-daily-apps' },
  { name: 'ChatGPT Plus', id: 'product_01kzpevqmgf09v3h5wn2pgtv12', category: 'design-productivity-ai' },
  { name: 'Spotify Premium', id: 'product_01ky5a622te00byz1t31h4hhym', category: 'music-audio' }
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const results = [];

  for (const item of VERIFIED_PRODUCTS) {
    const result = await importProduct({
      supplierName: 'foxreload',
      supplierProductId: item.id,
      // No customer price is supplied here. New products remain unpublished
      // until an admin explicitly sets a selling price and publishes them.
      input: { category: item.category, productType: 'subscription', deliveryType: 'manual' },
      user: null
    });
    results.push({
      requestedProduct: item.name,
      supplierProductId: item.id,
      created: result.created,
      isActive: result.product.isActive,
      isOutOfStock: result.product.isOutOfStock,
      category: result.product.category,
      supplierAvailability: result.product.supplierAvailability
    });
  }

  console.log(JSON.stringify({ imported: results.length, results }, null, 2));
}

main()
  .catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
