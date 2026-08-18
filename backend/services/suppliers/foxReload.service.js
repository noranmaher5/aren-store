const BaseSupplierService = require('./baseSupplier.service');
const { fulfillmentError, ERROR_CODES } = require('../fulfillment/fulfillmentErrors');
const { getFoxReloadExecutionConfig } = require('./foxReloadExecutionConfig');

class FoxReloadService extends BaseSupplierService {
  constructor() {
    const executionConfig = getFoxReloadExecutionConfig();
    super({
      name: 'FoxReload',
      baseUrl: executionConfig.enabled
        ? executionConfig.baseUrl
        : process.env.FOXRELOAD_BASE_URL || 'https://public-api.foxreload.com',
      apiKey: executionConfig.enabled ? process.env.FOXRELOAD_SANDBOX_API_KEY : process.env.FOXRELOAD_API_KEY,
      headers: {
        'X-API-Key': executionConfig.enabled ? process.env.FOXRELOAD_SANDBOX_API_KEY : process.env.FOXRELOAD_API_KEY,
        'X-Language': process.env.FOXRELOAD_LANGUAGE || 'en',
        'X-Currency': process.env.FOXRELOAD_CURRENCY || 'usd'
      }
    });
    this.executionConfig = executionConfig;
  }

  assertSandboxOrderExecution() {
    if (String(process.env.SUPPLIER_FULFILLMENT_ENABLED).toLowerCase() !== 'true') {
      throw fulfillmentError(ERROR_CODES.FULFILLMENT_DISABLED, 'FoxReload order execution is disabled');
    }
    if (String(process.env.FOXRELOAD_SANDBOX_ENABLED).toLowerCase() === 'true' && !this.executionConfig.enabled) {
      throw fulfillmentError(ERROR_CODES.FOXRELOAD_SANDBOX_NOT_CONFIGURED, 'FoxReload sandbox configuration is incomplete');
    }
  }

  getCategories(limitOrOptions = 20) {
    const options = typeof limitOrOptions === 'object' && limitOrOptions !== null
      ? limitOrOptions
      : { limit: limitOrOptions };
    const params = new URLSearchParams({ limit: String(options.limit ?? 20) });
    if (options.cursor) params.set('cursor', String(options.cursor));
    return this.request(`/api/categories/?${params}`);
  }

  async getAllCategories(options = {}) {
    const categories = [];
    let cursor;
    do {
      const page = await this.getCategories({ ...options, cursor });
      categories.push(...(Array.isArray(page) ? page : page.items || []));
      cursor = page?.nextCursor || null;
    } while (cursor);
    return categories;
  }

  getCategory(categoryIdOrSlug) {
    return this.request(`/api/categories/${encodeURIComponent(categoryIdOrSlug)}`);
  }

  listProducts({ categoryIdOrSlug, limit = 100, offset = 0, withStockOnly } = {}) {
    if (!categoryIdOrSlug) throw new Error('FoxReload categoryIdOrSlug is required');
    const params = new URLSearchParams({
      category_id_or_slug: String(categoryIdOrSlug),
      limit: String(limit),
      offset: String(offset)
    });
    if (withStockOnly !== undefined) params.set('withStockOnly', String(withStockOnly));
    return this.request(`/api/products/?${params}`);
  }

  searchProducts(query, limit = 20) {
    const params = new URLSearchParams({ query, limit: String(limit) });
    return this.request(`/api/products/search?${params}`);
  }

  getProduct(productId) {
    return this.request(`/api/products/${encodeURIComponent(productId)}/`);
  }

  createOrder(payload) {
    this.assertSandboxOrderExecution();
    return this.request('/api/orders/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  getOrderStatus(orderId) {
    return this.request(`/api/orders/${encodeURIComponent(orderId)}`);
  }

  payOrder(orderId, payload) {
    this.assertSandboxOrderExecution();
    return this.request(`/api/orders/${encodeURIComponent(orderId)}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  getBalance() {
    return this.request('/api/access/me/balances/');
  }

  getDeliveredData(orderId) {
    return this.getOrderStatus(orderId);
  }
}

module.exports = FoxReloadService;
