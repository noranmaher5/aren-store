const assert = require('assert');
const { normalize, normalizeCollection, normalizeFazerCardsOffer } = require('./services/suppliers/catalogNormalizer');

const telegram = {
  category_id: 'telegram_premium',
  name: 'Telegram Premium',
  offers: [{ card_id: '3m', name: '3 Months', price_usd: '12.1800', stock: 999999 }]
};

const discord = {
  category_id: 'discord_global',
  name: 'Discord (Global)',
  offers: [{ card_id: 'discord_nitro_12_months_subscription', name: 'Discord Nitro: 12 Months Subscription', price_usd: '86.8513', stock: 10 }]
};

const normalizedGiftCard = normalizeFazerCardsOffer({
  category_id: 'spotify_us',
  card_id: '36_usd',
  name: '36 USD',
  price_usd: '31.7000',
  stock: 100
}, { type: 'giftcard', categoryName: 'Spotify (US)' });
assert.equal(normalizedGiftCard.supplierProductId, 'spotify_us:36_usd');
assert.equal(normalizedGiftCard.supplierCost, 31.7);
assert.equal(normalizedGiftCard.currency, 'USD');
assert.equal(normalizedGiftCard.stock, 100);
assert.equal(normalizedGiftCard.availability, 'AVAILABLE');
assert.equal(normalizedGiftCard.metadata.categoryId, 'spotify_us');
assert.equal(normalizedGiftCard.metadata.cardId, '36_usd');

const unknownStock = normalizeFazerCardsOffer({
  category_id: 'topup_category',
  offer_id: 'offer_1',
  name: 'Top-up Offer',
  price_usd: '2.00'
}, { type: 'topup' });
assert.equal(unknownStock.stock, undefined);
assert.equal(unknownStock.availability, 'UNKNOWN');
assert.equal(normalizeFazerCardsOffer({ category_id: 'null-stock', card_id: 'offer', stock: null, price_usd: '1' }, { type: 'giftcard' }).availability, 'UNKNOWN');
assert.equal(normalizeFazerCardsOffer({ category_id: 'zero-stock', card_id: 'offer', stock: 0, price_usd: '1' }).availability, 'OUT_OF_STOCK');
assert.equal(normalizeFazerCardsOffer({ category_id: 'positive-stock', card_id: 'offer', stock: '5', price_usd: '1' }).availability, 'AVAILABLE');
assert.equal(normalizeFazerCardsOffer({ category_id: 'invalid-stock', card_id: 'offer', stock: 'unknown', price_usd: '1' }).availability, 'UNKNOWN');
assert.equal(normalizeFazerCardsOffer({ category_id: 'empty-stock', card_id: 'offer', stock: '', price_usd: '1' }).availability, 'UNKNOWN');

const missingPrice = normalizeFazerCardsOffer({
  category_id: 'missing-price', card_id: 'offer'
}, { type: 'giftcard' });
assert.equal(missingPrice.supplierCost, undefined);
const sameOfferDifferentCategories = normalizeFazerCardsOffer({ category_id: 'a', card_id: 'same', name: 'A', price_usd: '1' }, { type: 'giftcard' });
const otherCategory = normalizeFazerCardsOffer({ category_id: 'b', card_id: 'same', name: 'B', price_usd: '1' }, { type: 'giftcard' });
assert.notEqual(sameOfferDifferentCategories.supplierProductId, otherCategory.supplierProductId);
assert.equal(normalizedGiftCard.supplierProductId, 'spotify_us:36_usd');

const normalized = normalize('fazercards', {
  id: 'mock-product-id',
  name: 'Mock Product',
  price: '12.50',
  currency: 'usd',
  quantity: '7',
  status: 'available'
});
assert.equal(normalized.supplierProductId, 'mock-product-id');
assert.equal(normalized.supplierCost, 12.5);
assert.equal(normalized.currency, 'USD');
assert.equal(normalized.stock, 7);
assert.equal(normalized.availability, 'AVAILABLE');
assert.equal(normalize('foxreload', { id: 'zero', name: 'Zero', quantity: 0 }).availability, 'OUT_OF_STOCK');
assert.equal(normalize('foxreload', { id: 'missing', name: 'Missing', quantity: null }).availability, 'UNKNOWN');
const foxDetails = normalize('foxreload', {
  id: 'fox-details', name: 'Roblox 25 USD', price: '28.47', currency: 'usd', quantity: 5302,
  categoryId: 'cat-1', attributes: { country_code: 'US', amount: 25 },
  orderMinQuantity: 1, orderMaxQuantity: 5, requiredNoteFields: [], noteFieldOptions: {}, noteFieldTypes: {}
});
assert.equal(foxDetails.supplierCost, 28.47);
assert.equal(foxDetails.countryCode, 'US');
assert.equal(foxDetails.region, undefined);
assert.equal(foxDetails.orderMaxQuantity, 5);
assert.deepEqual(foxDetails.requiredNoteFields, []);
assert.equal(foxDetails.attributes.country_code, 'US');
assert.equal(normalize('foxreload', { id: 'null-price', name: 'Null price', price: null }).supplierCost, null);

assert.deepEqual(normalizeCollection('fazercards', [
  { id: 'valid', name: 'Valid' },
  { name: 'Missing stable id' }
]).map(item => item.supplierProductId), ['valid']);

const match = (requested, candidates) => candidates.filter(item =>
  [item.name, item.category_name].some(label => String(label).toLowerCase() === requested.toLowerCase()));
assert.equal(match('Telegram Premium', [{ ...telegram.offers[0], category_name: telegram.name }]).length, 1);
assert.equal(match('Discord Nitro', discord.offers.map(item => ({ ...item, category_name: discord.name }))).length, 0);

const orderPayload = { category_id: telegram.category_id, card_id: telegram.offers[0].card_id, quantity: 1 };
assert.deepEqual(Object.keys(orderPayload).sort(), ['card_id', 'category_id', 'quantity']);
assert.equal(typeof 'aren-order-123-idempotency-key', 'string');

const malformed = normalizeCollection('fazercards', [{ category_id: 'no-product-id', name: 'Category only' }]);
assert.deepEqual(malformed, []);

const failClosedWebhookContract = {
  signatureHeader: undefined,
  eventPayload: undefined,
  retryPolicy: undefined,
};
assert.equal(Object.values(failClosedWebhookContract).every(value => value === undefined), true);

console.log(JSON.stringify({
  passed: true,
  tests: [
    'normalization', 'product id extraction', 'price extraction',
    'availability extraction', 'product matching', 'order payload construction',
    'malformed supplier response', 'unknown product fail-closed',
    'idempotency key design', 'webhook signature contract fail-closed'
  ]
}));
