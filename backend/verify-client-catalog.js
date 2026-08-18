require('dotenv').config();

const { getSupplier } = require('./services/suppliers');

const REQUESTS = [
  ['Movies & Digital Entertainment', 'Netflix Premium'],
  ['Movies & Digital Entertainment', 'Shahid VIP'],
  ['Movies & Digital Entertainment', 'Disney+ Premium'],
  ['Movies & Digital Entertainment', 'Amazon Prime Video'],
  ['Movies & Digital Entertainment', 'OSN+ Subscription'],
  ['Movies & Digital Entertainment', 'TOD Subscription'],
  ['Movies & Digital Entertainment', 'Apple TV+'],
  ['Movies & Digital Entertainment', 'Hulu Premium'],
  ['Social Media & Daily Apps', 'Snapchat Plus Code'],
  ['Social Media & Daily Apps', 'YouTube Premium'],
  ['Social Media & Daily Apps', 'Discord Nitro'],
  ['Social Media & Daily Apps', 'Telegram Premium'],
  ['Social Media & Daily Apps', 'X Premium'],
  ['Design, Productivity & AI', 'Canva Pro'],
  ['Design, Productivity & AI', 'ChatGPT Plus'],
  ['Design, Productivity & AI', 'Microsoft 365 Personal'],
  ['Design, Productivity & AI', 'Google One Storage'],
  ['Design, Productivity & AI', 'iCloud+ Storage'],
  ['Design, Productivity & AI', 'Adobe Creative Cloud'],
  ['Music & Audio', 'Spotify Premium'],
  ['Music & Audio', 'Apple Music'],
  ['Music & Audio', 'Anghami Plus'],
  ['Music & Audio', 'Audible Premium']
];

const unwrap = payload => {
  if (Array.isArray(payload)) return payload;
  for (const key of ['results', 'items', 'products', 'data']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const text = value => String(value || '').toLowerCase().replace(/[+®™]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const has = (name, value) => text(name).split(/\s+/).includes(value);
const valueOf = (item, keys) => keys.map(key => item?.[key]).find(value => value !== undefined && value !== null && value !== '');

function clearlyMatches(requested, item) {
  const name = text(item.name || item.title || item.product_name);
  if (!name) return false;
  const rules = {
    'Netflix Premium': () => has(name, 'netflix') && has(name, 'premium'),
    'Shahid VIP': () => has(name, 'shahid') && has(name, 'vip'),
    'Disney+ Premium': () => has(name, 'disney') && has(name, 'premium'),
    'Amazon Prime Video': () => has(name, 'amazon') && has(name, 'prime') && has(name, 'video'),
    'OSN+ Subscription': () => has(name, 'osn') && has(name, 'subscription'),
    'TOD Subscription': () => has(name, 'tod') && has(name, 'subscription'),
    'Apple TV+': () => has(name, 'apple') && has(name, 'tv'),
    'Hulu Premium': () => has(name, 'hulu') && has(name, 'premium'),
    'Snapchat Plus Code': () => has(name, 'snapchat') && has(name, 'plus') && has(name, 'code'),
    'YouTube Premium': () => has(name, 'youtube') && has(name, 'premium'),
    'Discord Nitro': () => has(name, 'discord') && has(name, 'nitro'),
    'Telegram Premium': () => has(name, 'telegram') && has(name, 'premium'),
    'X Premium': () => /^(x premium|x \+ premium)/i.test(name),
    'Canva Pro': () => has(name, 'canva') && has(name, 'pro'),
    'ChatGPT Plus': () => (has(name, 'chatgpt') || text(name).replace(/\s+/g, '').includes('chatgpt')) && has(name, 'plus'),
    'Microsoft 365 Personal': () => has(name, 'microsoft') && has(name, '365') && has(name, 'personal'),
    'Google One Storage': () => has(name, 'google') && has(name, 'one') && has(name, 'storage'),
    'iCloud+ Storage': () => has(name, 'icloud') && has(name, 'storage'),
    'Adobe Creative Cloud': () => has(name, 'adobe') && has(name, 'creative') && has(name, 'cloud'),
    'Spotify Premium': () => has(name, 'spotify') && has(name, 'premium'),
    'Apple Music': () => has(name, 'apple') && has(name, 'music'),
    'Anghami Plus': () => has(name, 'anghami') && has(name, 'plus'),
    'Audible Premium': () => has(name, 'audible') && has(name, 'premium')
  };
  return Boolean(rules[requested]?.());
}

function summarize(item) {
  return {
    id: valueOf(item, ['id', 'product_id', 'productId', 'sku', 'code']),
    name: valueOf(item, ['name', 'title', 'product_name']),
    price: valueOf(item, ['price', 'cost', 'supplier_cost', 'amount']),
    currency: valueOf(item, ['currency', 'currency_code']),
    availability: valueOf(item, ['quantity', 'stock', 'available_quantity', 'availableQuantity', 'availability', 'available', 'status']),
    image: valueOf(item, ['image', 'image_url', 'imageUrl', 'thumbnail']),
    delivery: valueOf(item, ['delivery_type', 'deliveryType']),
    metadataKeys: Object.keys(item || {}).filter(key => !/api[-_]?key|secret|password|token|authorization|credential/i.test(key))
  };
}

async function verify() {
  const supplier = getSupplier('foxreload');
  const categories = await supplier.getCategories();
  const report = [];

  for (const [category, requested] of REQUESTS) {
    let searchResults = [];
    let searchError = null;
    try { searchResults = unwrap(await supplier.searchProducts(requested, 25)); }
    catch (error) { searchError = error.message; }

    const match = searchResults.find(item => clearlyMatches(requested, item));
    let detail = match;
    let detailError = null;
    if (match) {
      const id = valueOf(match, ['id', 'product_id', 'productId', 'sku', 'code']);
      if (id) {
        try { const detailPayload = await supplier.getProduct(id); detail = unwrap(detailPayload)[0] || detailPayload; }
        catch (error) { detailError = error.message; }
      }
    }
    report.push({ category, requested, found: Boolean(match), match: match ? summarize({ ...match, ...(detail || {}) }) : null, candidateNames: searchResults.slice(0, 5).map(item => valueOf(item, ['name', 'title', 'product_name'])).filter(Boolean), searchError, detailError });
  }

  console.log(JSON.stringify({ categoryCount: Array.isArray(categories) ? categories.length : Object.keys(categories || {}).length, report }, null, 2));
}

verify().catch(error => { console.error(`Verification failed: ${error.message}`); process.exitCode = 1; });
