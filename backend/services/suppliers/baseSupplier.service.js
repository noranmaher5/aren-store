class BaseSupplierService {
  constructor({ name, baseUrl, apiKey, headers = {} }) {
    this.name = name;
    this.baseUrl = baseUrl?.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.headers = headers;
  }

  assertConfigured() {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error(`${this.name} supplier is not configured`);
    }
  }

  async request(path, options = {}) {
    this.assertConfigured();

    const timeoutMs = Number(options.timeoutMs || process.env.SUPPLIER_REQUEST_TIMEOUT_MS || 15000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const requestUrl = `${this.baseUrl}${path}`;
    const requestMethod = String(options.method || 'GET').toUpperCase();

    let response;
    try {
      const { timeoutMs: _timeoutMs, ...requestOptions } = options;
      response = await fetch(requestUrl, {
        ...requestOptions,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...this.headers,
          ...(requestOptions.headers || {})
        }
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`${this.name} request timed out`);
        timeoutError.code = 'ETIMEDOUT';
        timeoutError.category = 'NETWORK_TIMEOUT';
        throw timeoutError;
      }
      const requestError = new Error(`${this.name} request failed`);
      requestError.code = error?.cause?.code || error?.code || 'NETWORK_ERROR';
      requestError.category = /^CERT|TLS|SSL/i.test(requestError.code)
        ? 'TLS_ERROR'
        : 'NETWORK_ERROR';
      throw requestError;
    } finally {
      clearTimeout(timeout);
    }

    const bodyText = await response.text();
    let body = null;
    try {
      body = bodyText ? JSON.parse(bodyText) : null;
    } catch (error) {
      const parseError = new Error(`${this.name} returned invalid JSON`);
      parseError.code = 'INVALID_JSON';
      parseError.category = 'INVALID_JSON';
      parseError.status = response.status;
      throw parseError;
    }
    if (!response.ok) {
      const error = new Error(`${this.name} request failed with status ${response.status}`);
      error.status = response.status;
      error.code = `HTTP_${response.status}`;
      error.category = 'HTTP_ERROR';
      error.diagnostic = {
        status: response.status,
        contentType: response.headers?.get?.('content-type') || null,
        url: requestUrl,
        method: requestMethod,
        body: sanitizeDiagnosticBody(body)
      };
      throw error;
    }

    return body;
  }

  getCategories() {
    throw new Error(`${this.name} categories are not implemented`);
  }

  getBalance() {
    throw new Error(`${this.name} balance is not implemented`);
  }

  searchProducts() {
    throw new Error(`${this.name} product search is not implemented`);
  }

  getProduct() {
    throw new Error(`${this.name} product details are not implemented`);
  }

  createOrder() {
    throw new Error(`${this.name} order creation is not implemented`);
  }

  getOrderStatus() {
    throw new Error(`${this.name} order status is not implemented`);
  }

  getDeliveredData() {
    throw new Error(`${this.name} delivery retrieval is not implemented`);
  }
}

const SENSITIVE_KEY_PATTERN = /api[-_]?key|authorization|cookie|credential|password|secret|token/i;

function sanitizeDiagnosticBody(value, depth = 0) {
  if (depth > 4) return '[TRUNCATED]';
  if (Array.isArray(value)) return value.slice(0, 20).map(item => sanitizeDiagnosticBody(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).slice(0, 50).map(([key, item]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : sanitizeDiagnosticBody(item, depth + 1)
    ]));
  }
  if (typeof value === 'string') return value.length > 1000 ? `${value.slice(0, 1000)}...[TRUNCATED]` : value;
  return value;
}

module.exports = BaseSupplierService;
