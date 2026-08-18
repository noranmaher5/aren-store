const assert = require('assert');
const FoxReloadService = require('./services/suppliers/foxReload.service');
const { getFoxReloadExecutionConfig } = require('./services/suppliers/foxReloadExecutionConfig');
const {
  normalizeStatus,
  mapSupplierOrderToJob,
  normalizeDelivery,
  normalizeError,
  normalizeFoxReloadOrderFields,
  buildFoxReloadOrderPayload,
  pollOrder
} = require('./services/fulfillment/foxReloadAdapter');
const { ERROR_CODES } = require('./services/fulfillment/fulfillmentErrors');

assert.equal(getFoxReloadExecutionConfig({ FOXRELOAD_SANDBOX_ENABLED: 'false' }).enabled, false);
assert.equal(
  getFoxReloadExecutionConfig({ FOXRELOAD_SANDBOX_ENABLED: 'true' }).reason,
  'FOXRELOAD_SANDBOX_CREDENTIALS_MISSING'
);

for (const [source, expected] of [
  ['active', 'WAITING_SUPPLIER'],
  ['paid', 'WAITING_SUPPLIER'],
  ['processing', 'PROCESSING'],
  ['completed', 'COMPLETED'],
  ['failed', 'FAILED']
]) assert.equal(normalizeStatus(source), expected);
assert.throws(() => normalizeStatus('unknown'), error => error.code === ERROR_CODES.FOXRELOAD_UNKNOWN_STATUS);
assert.deepEqual(
  mapSupplierOrderToJob({ id: 'fox-order-1', status: 'processing' }),
  { supplierOrderId: 'fox-order-1', supplierStatus: 'PROCESSING' }
);
assert.throws(
  () => mapSupplierOrderToJob({ status: 'completed' }),
  error => error.code === ERROR_CODES.MANUAL_REVIEW_REQUIRED
);

const delivery = normalizeDelivery({
  status: 'completed',
  items: [{ externalData: ['TEST-CODE'], userGuide: 'Redeem safely' }]
});
assert.deepEqual(delivery.values, ['TEST-CODE']);
assert.equal(delivery.testOnly, false);
assert.throws(
  () => normalizeDelivery({ status: 'completed', items: [{ externalData: [] }] }),
  error => error.code === ERROR_CODES.FOXRELOAD_DELIVERY_UNKNOWN
);
assert.equal(normalizeError({ status: 401 }).code, ERROR_CODES.FOXRELOAD_AUTH_FAILED);
assert.equal(normalizeError({ status: 429 }).code, ERROR_CODES.FOXRELOAD_RATE_LIMITED);
assert.equal(normalizeError({ name: 'AbortError' }).code, ERROR_CODES.FOXRELOAD_TIMEOUT);

const payload = buildFoxReloadOrderPayload({
  items: [{ supplierProductId: 'fox-product-1', quantity: 1 }]
});
assert.deepEqual(payload, { items: [{ itemId: 'fox-product-1', quantity: 1 }] });
assert.throws(
  () => buildFoxReloadOrderPayload({ items: [{ supplierProductId: 'aren-product-id', quantity: 0 }] }),
  error => error.code === ERROR_CODES.MANUAL_REVIEW_REQUIRED
);
assert.throws(
  () => buildFoxReloadOrderPayload({ items: Array.from({ length: 11 }, () => ({ itemId: 'x', quantity: 1 })) }),
  error => error.code === ERROR_CODES.MANUAL_REVIEW_REQUIRED
);
assert.deepEqual(
  normalizeFoxReloadOrderFields(['email'], { email: 'customer@example.com' }),
  { email: 'customer@example.com' }
);
assert.throws(
  () => normalizeFoxReloadOrderFields(['email'], {}),
  error => error.code === ERROR_CODES.FOXRELOAD_CUSTOMER_DATA_REQUIRED
);

(async () => {
  const statuses = [{ status: 'active' }, { status: 'processing' }, { status: 'completed', items: [] }];
  let calls = 0;
  const result = await pollOrder({
    orderId: 'sandbox-only-test',
    getOrder: async () => statuses[calls++],
    maxAttempts: 3,
    sleep: async () => {}
  });
  assert.equal(result.status, 'completed');
  assert.equal(calls, 3);

  await assert.rejects(
    () => pollOrder({ getOrder: async () => ({ status: 'failed' }), maxAttempts: 2 }),
    error => error.code === ERROR_CODES.FOXRELOAD_REQUEST_FAILED
  );
  await assert.rejects(
    () => pollOrder({ getOrder: async () => { throw Object.assign(new Error('network'), { status: undefined }); }, maxAttempts: 1 }),
    error => error.code === ERROR_CODES.FOXRELOAD_REQUEST_FAILED
  );

  const service = new FoxReloadService();
  assert.throws(
    () => service.createOrder({ items: [{ itemId: 'sandbox-only-test', quantity: 1 }] }),
    error => [ERROR_CODES.FULFILLMENT_DISABLED, ERROR_CODES.FOXRELOAD_SANDBOX_NOT_CONFIGURED].includes(error.code)
  );
  console.log('FoxReload contract tests passed; no supplier request executed');
})().catch(error => { console.error(error); process.exitCode = 1; });
