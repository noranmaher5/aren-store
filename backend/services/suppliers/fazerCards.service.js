const BaseSupplierService = require('./baseSupplier.service');

class FazerCardsService extends BaseSupplierService {
  constructor() {
    super({
      name: 'FazerCards',
      baseUrl: process.env.FAZERCARDS_BASE_URL || 'https://api.fzr.cards/api/v2',
      apiKey: process.env.FAZERCARDS_API_KEY || process.env.FAZER_API_KEY,
      headers: { 'X-API-Key': process.env.FAZERCARDS_API_KEY || process.env.FAZER_API_KEY }
    });
  }

  getAccount() {
    return this.request('/me');
  }

  getBalance() {
    return this.request('/balance');
  }

  getGiftCardCategories(params = {}) {
    return this.request(this.withQuery('/giftcards', params));
  }

  getGiftCardOffers(categoryId, params = {}) {
    return this.request(this.withQuery('/giftcards/cards', { ...params, category_id: this.requiredId(categoryId, 'categoryId') }));
  }

  getGameKeyCategories(params = {}) {
    return this.request(this.withQuery('/gamekeys', params));
  }

  getGameKeyOffers(gameId, params = {}) {
    return this.request(this.withQuery('/gamekeys/keys', { ...params, game_id: this.requiredId(gameId, 'gameId') }));
  }

  getTopupCategories(params = {}) {
    return this.request(this.withQuery('/topups', params));
  }

  getTopupOffers(categoryId, params = {}) {
    return this.request(this.withQuery('/topups/offers', { ...params, category_id: this.requiredId(categoryId, 'categoryId') }));
  }

  getManualServices(params = {}) {
    return this.request(this.withQuery('/manual-services', params));
  }

  getManualOffers(serviceId, params = {}) {
    return this.request(this.withQuery(`/manual-services/${encodeURIComponent(this.requiredId(serviceId, 'serviceId'))}/offers`, params));
  }

  getTelegramStarsCatalog() {
    return this.request('/telegram/stars');
  }

  getTelegramPremiumCatalog() {
    return this.request('/telegram/premium');
  }

  getSteamTopupRates() {
    return this.request('/steam-topup/rates');
  }

  getSteamGiftGames(params = {}) {
    return this.request(this.withQuery('/steam-gifts/games', params));
  }

  // Compatibility route: FazerCards has no documented free-text search.
  searchProducts() {
    const error = new Error('FazerCards free-text product search is not supported by the documented API; browse categories and offers instead');
    error.statusCode = 400;
    error.code = 'CATALOG_BROWSE_REQUIRED';
    throw error;
  }

  getCategories() {
    return this.getGiftCardCategories();
  }

  getProduct(productId) {
    const [categoryId, cardId] = String(productId || '').split(':');
    if (!categoryId || !cardId) {
      const error = new Error('FazerCards gift card product ID must be category_id:card_id');
      error.statusCode = 400;
      error.code = 'INVALID_SUPPLIER_PRODUCT_ID';
      throw error;
    }
    return this.getGiftCardOffers(categoryId).then(result => {
      const offer = (result.offers || []).find(item => String(item.card_id) === cardId);
      if (!offer) {
        const error = new Error('FazerCards gift card offer was not found');
        error.statusCode = 404;
        error.code = 'SUPPLIER_PRODUCT_NOT_FOUND';
        throw error;
      }
      return { ...offer, category_id: result.category_id || categoryId, category_name: result.name };
    });
  }

  requiredId(value, field) {
    const id = String(value || '').trim();
    if (!id) throw new Error(`FazerCards ${field} is required`);
    return id;
  }

  withQuery(path, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
    });
    return query.toString() ? `${path}?${query}` : path;
  }
}

module.exports = FazerCardsService;
