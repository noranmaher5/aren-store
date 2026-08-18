require('dotenv').config();

const FazerCardsService = require('./services/suppliers/fazerCards.service');

const typeOf = value => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

// Returns structure only. It never returns primitive values, including secrets.
const summarizeShape = (value, depth = 0) => {
  if (depth > 3) return { type: typeOf(value) };
  if (Array.isArray(value)) return { type: 'array', length: value.length, item: value.length ? summarizeShape(value[0], depth + 1) : null };
  if (!value || typeof value !== 'object') return { type: typeOf(value) };
  return {
    type: 'object',
    keys: Object.keys(value),
    fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, summarizeShape(item, depth + 1)]))
  };
};

const fieldTypes = value => value && typeof value === 'object' && !Array.isArray(value)
  ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, typeOf(item)]))
  : {};

const extractOrderId = order => {
  if (!order || typeof order !== 'object') return null;
  for (const key of ['id', 'order_id', 'orderId']) {
    if (typeof order[key] === 'string' && order[key]) return { field: key, value: order[key] };
  }
  return null;
};

const safeError = error => ({
  status: error?.status,
  code: error?.code,
  message: String(error?.message || '').replace(/(api[-_]?key|authorization|bearer|secret|token)\s*[:=]?\s*\S+/ig, '$1:[REDACTED]')
});

const run = async () => {
  const service = new FazerCardsService();
  const report = {
    supplier: 'fazercards',
    phase: 12,
    readOnly: true,
    methodPolicy: { allowed: ['GET'], orderCreationCalled: false, mutationsCalled: false },
    ordersEndpoint: {
      endpoint: 'GET /api/v2/orders',
      supported: true,
      responseShapeDocumented: '{ ok, items, total, page, limit }',
      observed: null
    },
    orderDetails: {
      endpoint: 'GET /api/v2/orders/{orderId}',
      supported: true,
      responseShapeDocumented: '{ ok, order }',
      observed: null
    },
    statuses: { documented: [], observedLive: [], productionMapping: 'UNKNOWN_STATUS / FAIL CLOSED' },
    delivery: { documented: false, observed: null, normalized: 'NOT IMPLEMENTED — schema is not documented' },
    customerFields: {
      giftCard: { required: ['category_id', 'card_id', 'quantity'], validation: 'Documented supplier order fields; no separate customer fields documented' },
      gameKey: { required: ['game_id', 'key_id', 'quantity'], validation: 'Documented supplier order fields; no separate customer fields documented' },
      topup: { required: ['category_id', 'offer_id', 'fields'], validation: 'fields are defined by catalog offer; exact customer validation is offer-specific' },
      manualService: { required: ['manual_service_id', 'product_id'], optional: ['fields'], validation: 'Field definitions are category-specific' },
      telegramPremium: { required: ['telegram_username', 'months'], validation: 'Documented by direct buy contract; not called' },
      telegramStars: { required: ['telegram_username', 'quantity'], validation: 'Documented by direct buy contract; not called' }
    },
    webhook: {
      readEndpoint: 'GET /api/v2/account/webhook',
      deliveriesEndpoint: 'GET /api/v2/account/webhook/deliveries',
      configured: null,
      responseShape: null,
      eventNames: 'NOT DOCUMENTED except webhook.test description',
      payload: 'NOT DOCUMENTED',
      signature: 'NOT DOCUMENTED',
      retry: 'NOT DOCUMENTED',
      duplicateHandling: 'NOT DOCUMENTED'
    },
    polling: {
      endpoint: 'GET /api/v2/orders/{orderId}',
      sufficientForCompletion: 'UNKNOWN — order fields/status values are not defined in OpenAPI',
      terminalSuccess: 'UNKNOWN',
      terminalFailure: 'UNKNOWN',
      intermediateStates: 'UNKNOWN',
      interval: 'NOT DOCUMENTED',
      rateLimits: 'NOT DOCUMENTED'
    },
    blockers: []
  };

  try {
    const orders = await service.request('/orders?page=1&limit=100');
    const items = Array.isArray(orders?.items) ? orders.items : [];
    report.ordersEndpoint.observed = {
      responseKeys: Object.keys(orders || {}),
      itemCount: items.length,
      paginationKeys: ['total', 'page', 'limit'].filter(key => Object.prototype.hasOwnProperty.call(orders || {}, key)),
      itemKeys: items[0] ? Object.keys(items[0]) : [],
      itemFieldTypes: fieldTypes(items[0]),
      total: typeof orders?.total === 'number' ? orders.total : undefined
    };

    if (items.length === 0) {
      report.ordersEndpoint.observed.note = 'NO EXISTING ORDERS AVAILABLE FOR LIVE STATUS VERIFICATION';
    } else {
      const id = extractOrderId(items[0]);
      if (!id) {
        report.orderDetails.observed = { attempted: false, reason: 'No documented/extractable order ID field in live item' };
      } else {
        const detail = await service.request(`/orders/${encodeURIComponent(id.value)}`);
        const order = detail?.order;
        report.orderDetails.observed = {
          attempted: true,
          responseKeys: Object.keys(detail || {}),
          orderIdField: id.field,
          orderKeys: Object.keys(order || {}),
          orderShape: summarizeShape(order),
          deliveryKeys: order?.deliveryData && typeof order.deliveryData === 'object' ? Object.keys(order.deliveryData) : [],
          deliveryValuesLogged: false
        };
        if (order?.status !== undefined) report.statuses.observedLive = [String(order.status)];
        if (order?.deliveryData !== undefined) report.delivery.observed = summarizeShape(order.deliveryData);
      }
    }
  } catch (error) {
    report.ordersEndpoint.observed = { requestError: safeError(error) };
    report.blockers.push('GET /orders could not be verified live');
  }

  try {
    const webhook = await service.request('/account/webhook');
    report.webhook.configured = Boolean(webhook?.webhook);
    report.webhook.responseShape = {
      responseKeys: Object.keys(webhook || {}),
      webhookKeys: webhook?.webhook ? Object.keys(webhook.webhook) : [],
      secretValueLogged: false
    };
  } catch (error) {
    report.webhook.error = safeError(error);
  }

  if (report.statuses.observedLive.length === 0) report.blockers.push('No live order status values available');
  report.blockers.push('Official OpenAPI does not define order object fields/status enum in detail');
  report.blockers.push('Delivered-data schema is not documented');
  report.blockers.push('Webhook payload, signature, retry, and duplicate-event contracts are not documented');

  console.log(JSON.stringify(report, null, 2));
};

if (require.main === module) run().catch(error => {
  console.error(JSON.stringify({ phase: 12, readOnly: true, error: safeError(error) }));
  process.exitCode = 1;
});

module.exports = { summarizeShape, extractOrderId, safeError, run };
