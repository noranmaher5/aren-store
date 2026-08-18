const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { summarizeShape, extractOrderId, safeError } = require('./audit-fazercards-order-contract');
const { supplierFulfillmentEnabled } = require('./config/fulfillment');
const { ERROR_CODES } = require('./services/fulfillment/fulfillmentErrors');
const { getSupplierAdapter } = require('./services/fulfillment/supplierAdapter');

const auditSource = fs.readFileSync(path.join(__dirname, 'audit-fazercards-order-contract.js'), 'utf8');
assert.equal(/method:\s*['"]POST['"]/.test(auditSource), false);
assert.equal(/giftcards\/order|gamekeys\/order|topups\/order|manual-services\/order/.test(auditSource), false);

assert.deepEqual(summarizeShape({ status: 'completed', deliveryData: { code: 'hidden' } }).fields.deliveryData.keys, ['code']);
assert.deepEqual(extractOrderId({ order_id: 'ord-1' }).field, 'order_id');
assert.equal(extractOrderId({ name: 'no id' }), null);
assert.equal(safeError(new Error('Authorization: secret-value')).message.includes('secret-value'), false);

const adapter = getSupplierAdapter('fazercards');
assert.equal(supplierFulfillmentEnabled, false);
assert.equal(adapter.supportsFulfillment('GIFT_CARD'), true);
assert.equal(adapter.supportsFulfillment('TELEGRAM'), false);

Promise.all([
  Promise.resolve().then(() => adapter.createOrder()).then(() => assert.fail('supplier createOrder must fail closed')).catch(error => assert.equal(error.code, ERROR_CODES.FULFILLMENT_DISABLED)),
  Promise.resolve().then(() => adapter.getOrder()).then(() => assert.fail('supplier getOrder must fail closed')).catch(error => assert.equal(error.code, ERROR_CODES.SUPPLIER_STATUS_UNKNOWN)),
  Promise.resolve().then(() => adapter.normalizeDelivery()).then(() => assert.fail('delivery normalizer must fail closed')).catch(error => assert.equal(error.code, ERROR_CODES.DELIVERY_SCHEMA_UNKNOWN))
]).then(() => {
  console.log(JSON.stringify({ passed: true, tests: [
    'GET-only audit source', 'no order POST endpoint', 'unknown status fail-closed',
    'unknown delivery fail-closed', 'missing order id fail-closed',
    'sensitive values omitted from shapes/logs', 'fulfillment disabled',
    'FazerCards adapter fail-closed'
  ] }));
}).catch(error => { console.error(error); process.exitCode = 1; });
