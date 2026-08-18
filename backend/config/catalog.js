// Customer-requested catalog taxonomy. Supplier products are assigned only
// when an admin explicitly chooses a category during import.
const CATALOG_CATEGORIES = [
  { id: 'movies', name: 'Movies & Digital Entertainment', products: ['Netflix Premium', 'Shahid VIP', 'Disney+ Premium', 'Amazon Prime Video', 'OSN+ Subscription', 'TOD Subscription', 'Apple TV+', 'Hulu Premium'] },
  { id: 'social-daily-apps', name: 'Social Media & Daily Apps', products: ['Snapchat Plus Code', 'YouTube Premium', 'Discord Nitro', 'Telegram Premium', 'X Premium'] },
  { id: 'design-productivity-ai', name: 'Design, Productivity & AI', products: ['Canva Pro', 'ChatGPT Plus', 'Microsoft 365 Personal', 'Google One Storage', 'iCloud+ Storage', 'Adobe Creative Cloud'] },
  { id: 'music-audio', name: 'Music & Audio', products: ['Spotify Premium', 'Apple Music', 'Anghami Plus', 'Audible Premium'] }
];

const REQUESTED_PRODUCTS = [...CATALOG_CATEGORIES.flatMap(category => category.products), 'Coins'];

// Phase 7 allowlist: only products with a confirmed live FoxReload identity
// may be imported. Add a product here only after a new live verification.
const VERIFIED_FOXRELOAD_PRODUCTS = new Set([
  'product_01kz1ret63fk194vxzxggbq48x',
  'product_01ks0qnkd0e0hax8307rgkdndm',
  'product_01kn1qqhfgekgte4mbtgtc58zp',
  'product_01kzpevqmgf09v3h5wn2pgtv12',
  'product_01ky5a622te00byz1t31h4hhym'
]);

module.exports = { CATALOG_CATEGORIES, REQUESTED_PRODUCTS, VERIFIED_FOXRELOAD_PRODUCTS };
