require('dotenv').config();

const BASE_URL = (process.env.FAZERCARDS_BASE_URL || 'https://api.fzr.cards/api/v2').replace(/\/$/, '');
const API_KEY = process.env.FAZERCARDS_API_KEY || process.env.FAZER_API_KEY;

const requestedProducts = [
  'Netflix Premium', 'Shahid VIP', 'Disney+ Premium', 'Amazon Prime Video',
  'OSN+ Subscription', 'TOD Subscription', 'Apple TV+', 'Hulu Premium',
  'Snapchat Plus', 'YouTube Premium', 'Discord Nitro', 'Telegram Premium',
  'X Premium', 'Canva Pro', 'ChatGPT Plus', 'Microsoft 365 Personal',
  'Google One Storage', 'iCloud+ Storage', 'Adobe Creative Cloud',
  'Spotify Premium', 'Apple Music', 'Anghami Plus', 'Audible Premium'
];

const catalogKeywords = [
  'netflix', 'shahid', 'disney', 'amazon', 'osn', 'tod', 'apple', 'hulu',
  'snapchat', 'youtube', 'discord', 'telegram', 'premium', 'canva', 'chatgpt',
  'microsoft', 'google', 'icloud', 'adobe', 'spotify', 'music', 'anghami', 'audible'
];

const normalizeText = value => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9+]+/g, ' ')
  .trim();

const safeKeys = value => value && typeof value === 'object' ? Object.keys(value) : [];
const safeItem = item => {
  if (!item || typeof item !== 'object') return item;
  const fields = [
    'id', 'category_id', 'card_id', 'game_id', 'key_id', 'offer_id',
    'name', 'category_name', 'price_usd', 'stock', 'region', 'platform', 'delivery_minutes'
  ];
  return Object.fromEntries(fields
    .filter(field => Object.prototype.hasOwnProperty.call(item, field))
    .map(field => [field, item[field]]));
};
const isRelevantCategory = item => catalogKeywords.some(keyword => normalizeText(item?.name).includes(keyword));

const request = async (path, query = {}) => {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json', 'X-API-Key': API_KEY },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(`GET ${path} failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
};

const paginate = async path => {
  const items = [];
  let cursor;
  for (let page = 0; page < 20; page += 1) {
    const body = await request(path, { limit: 100, cursor });
    items.push(...(Array.isArray(body?.items) ? body.items : []));
    if (!body?.meta?.has_more || !body.meta.next_cursor) break;
    cursor = body.meta.next_cursor;
  }
  return items;
};

const classify = (requested, candidates) => {
  const exact = candidates.filter(item => [item.name, item.category_name]
    .some(label => normalizeText(label) === normalizeText(requested)));
  if (exact.length === 1) return { status: 'FOUND', item: safeItem(exact[0]) };
  if (exact.length > 1) return { status: 'AMBIGUOUS', candidates: exact.map(safeItem) };
  if (candidates.length) return { status: 'AMBIGUOUS', candidates: candidates.slice(0, 10).map(safeItem) };
  return { status: 'NOT FOUND' };
};

const main = async () => {
  if (!API_KEY) throw new Error('FazerCards API credential is not configured');

  const result = {
    readOnly: true,
    account: {},
    catalogs: {},
    requestedProducts: {},
    orders: {},
    webhook: {},
  };

  const me = await request('/me');
  result.account.meKeys = safeKeys(me);
  const balance = await request('/balance');
  result.account.balanceKeys = safeKeys(balance);

  const giftcards = await paginate('/giftcards');
  result.catalogs.giftcards = { count: giftcards.length, sample: giftcards.slice(0, 5).map(safeItem) };
  const giftcardOffers = [];
  for (const category of giftcards.filter(isRelevantCategory)) {
    const details = await request('/giftcards/cards', { category_id: category.category_id });
    for (const offer of details?.offers || []) {
      giftcardOffers.push({ ...offer, category_id: details.category_id, category_name: details.name });
    }
  }
  result.catalogs.giftcardOffers = { count: giftcardOffers.length, sample: giftcardOffers.slice(0, 10).map(safeItem) };

  const gamekeys = await paginate('/gamekeys');
  result.catalogs.gamekeys = { count: gamekeys.length, sample: gamekeys.slice(0, 5).map(safeItem) };
  const gamekeyOffers = [];
  for (const game of gamekeys.filter(isRelevantCategory)) {
    const details = await request('/gamekeys/keys', { game_id: game.game_id });
    for (const offer of details?.keys || []) gamekeyOffers.push({ ...offer, game_id: details.game_id, region: details.region });
  }
  result.catalogs.gamekeyOffers = { count: gamekeyOffers.length, sample: gamekeyOffers.slice(0, 10).map(safeItem) };

  const topups = await paginate('/topups');
  result.catalogs.topups = { count: topups.length, sample: topups.slice(0, 5).map(safeItem) };
  const topupOffers = [];
  for (const category of topups.filter(isRelevantCategory)) {
    const details = await request('/topups/offers', { category_id: category.category_id });
    for (const offer of details?.offers || []) topupOffers.push({ ...offer, category_id: details.category_id, category_name: details.name });
  }
  result.catalogs.topupOffers = { count: topupOffers.length, sample: topupOffers.slice(0, 10).map(safeItem) };

  const manualServices = await request('/manual-services');
  result.catalogs.manualServices = { count: manualServices?.items?.length || 0, sample: (manualServices?.items || []).slice(0, 5).map(safeItem) };
  const manualOffers = [];
  for (const category of manualServices?.items || []) {
    const details = await request(`/manual-services/${encodeURIComponent(category.id)}/offers`);
    for (const offer of details?.items || []) manualOffers.push({ ...offer, category_id: details.manual_service_id, category_name: details.category?.name });
  }
  result.catalogs.manualOffers = { count: manualOffers.length, sample: manualOffers.slice(0, 10).map(safeItem) };

  const allOffers = [...giftcardOffers, ...gamekeyOffers, ...topupOffers, ...manualOffers];
  for (const product of requestedProducts) {
    const related = allOffers.filter(item => [item.name, item.category_name]
      .some(label => normalizeText(label).includes(normalizeText(product)) || normalizeText(product).includes(normalizeText(label))));
    result.requestedProducts[product] = classify(product, related);
  }

  for (const [name, path] of Object.entries({
    telegramStars: '/telegram/stars',
    telegramPremium: '/telegram/premium',
    steamTopupRates: '/steam-topup/rates',
    steamGiftGames: '/steam-gifts/games',
  })) {
    try {
      const body = await request(path);
      result.catalogs[name] = { responseKeys: safeKeys(body), itemCount: Array.isArray(body?.items) ? body.items.length : undefined };
    } catch (error) {
      result.catalogs[name] = { error: error.message };
    }
  }

  const orders = await request('/orders', { page: 1, limit: 1 });
  result.orders = { responseKeys: safeKeys(orders), total: orders?.total, itemKeys: safeKeys(orders?.items?.[0]) };
  const webhook = await request('/account/webhook');
  result.webhook = { responseKeys: safeKeys(webhook), configured: Boolean(webhook?.webhook), webhookKeys: safeKeys(webhook?.webhook) };

  console.log(JSON.stringify(result, null, 2));
};

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
