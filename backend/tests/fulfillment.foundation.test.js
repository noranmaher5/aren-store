const assert = require('assert');
const { isPaymentConfirmed, idempotencyKeyFor, safeDryRunEvent } = require('../services/fulfillment/fulfillment.service');
const { FULFILLMENT_STATES } = require('../services/fulfillment/fulfillmentState');
const { ERROR_CODES } = require('../services/fulfillment/fulfillmentErrors');
const { getFulfillmentType, getSupplierAdapter, FULFILLMENT_TYPES } = require('../services/fulfillment/supplierAdapter');

assert.equal(isPaymentConfirmed({ status: 'paid_unconfirmed' }), false);
assert.equal(isPaymentConfirmed({ paymentConfirmed: true }), true);
assert.equal(isPaymentConfirmed({ paymentDetails: { status: 'completed' } }), true);
assert.equal(idempotencyKeyFor('order-1', 'item-1'), 'aren:order-1:item-1');
assert.equal(FULFILLMENT_STATES.PENDING, 'PENDING');
assert.equal(ERROR_CODES.FULFILLMENT_DISABLED, 'FULFILLMENT_DISABLED');
assert.equal(getFulfillmentType({ supplier: 'fazercards', supplierMetadata: { supplierType: 'giftcard' } }), FULFILLMENT_TYPES.GIFT_CARD);
assert.equal(getFulfillmentType({ supplier: 'fazercards', supplierMetadata: { supplierType: 'unconfirmed' } }), FULFILLMENT_TYPES.UNKNOWN);
const adapter = getSupplierAdapter('fazercards');
assert.equal(adapter.supportsFulfillment(FULFILLMENT_TYPES.GIFT_CARD), true);
assert.equal(adapter.supportsFulfillment(FULFILLMENT_TYPES.TELEGRAM), false);

const expectCode = async (operation, code) => {
  try { await operation(); assert.fail('Expected controlled fulfillment error'); }
  catch (error) { assert.equal(error.code, code); }
};

const event = safeDryRunEvent({
  order: 'order-1', orderItemId: 'item-1', product: 'product-1',
  supplier: 'fazercards', supplierProductId: 'category:offer',
  fulfillmentType: 'GIFT_CARD', idempotencyKey: 'aren:order-1:item-1'
}, { status: 'DISABLED' });
assert.equal(event.event, 'FULFILLMENT_DRY_RUN');
assert.equal('deliveryData' in event, false);
assert.equal('apiKey' in event, false);
assert.equal('authorization' in event, false);

(async () => {
  await expectCode(() => adapter.createOrder(), ERROR_CODES.FULFILLMENT_DISABLED);
  await expectCode(() => adapter.getOrder(), ERROR_CODES.SUPPLIER_STATUS_UNKNOWN);
  await expectCode(() => adapter.normalizeDelivery(), ERROR_CODES.DELIVERY_SCHEMA_UNKNOWN);
  console.log(JSON.stringify({ passed: true, tests: [
    'unpaid order blocked', 'explicit payment proof accepted',
    'deterministic idempotency key', 'state machine', 'dry-run safe event',
    'supplier execution disabled', 'unknown status fail-closed', 'unknown delivery fail-closed'
  ] }));
})().catch(error => { console.error(error); process.exitCode = 1; });
