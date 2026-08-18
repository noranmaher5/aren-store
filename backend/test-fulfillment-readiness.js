const assert = require('assert');
const { getOrderItemFulfillmentDecision } = require('./services/fulfillment/fulfillmentDecision');
const { createDryRunAdapter } = require('./services/fulfillment/dryRunAdapter');
const { isPaymentConfirmed, idempotencyKeyFor } = require('./services/fulfillment/fulfillment.service');

const item = { quantity: 1, price: 100 };
assert.equal(getOrderItemFulfillmentDecision({ supplier: 'manual' }, item).type, 'DIGITAL_CODE');
assert.equal(getOrderItemFulfillmentDecision({ supplier: 'foxreload', supplierProductId: 'fox-1' }, item).type, 'FOXRELOAD');
assert.equal(getOrderItemFulfillmentDecision({ supplier: 'fazercards', supplierProductId: 'cat:offer' }, item).type, 'FAZERCARDS');
assert.equal(getOrderItemFulfillmentDecision({ supplier: 'fazercards' }, item).type, 'MANUAL_REVIEW');
assert.equal(getOrderItemFulfillmentDecision({ supplier: 'fazercards', supplierProductId: 'cat:offer' }, { ...item, price: 0 }).type, 'MANUAL_REVIEW');

assert.equal(isPaymentConfirmed({ status: 'paid_unconfirmed' }), false);
assert.equal(isPaymentConfirmed({ status: 'paid', paymentDetails: { status: 'captured' } }), true);
assert.equal(isPaymentConfirmed({ status: 'paid_unconfirmed', paymentDetails: { status: 'captured' } }), true);
assert.equal(idempotencyKeyFor('order-1', 'item-1'), 'aren:order-1:item-1');

(async () => {
  const fox = createDryRunAdapter('foxreload');
  const order = await fox.createOrder({ mode: 'dry-run' });
  assert.equal(order.status, 'DRY_RUN_SUCCESS');
  assert.equal((await fox.getOrder({ mode: 'dry-run' })).status, 'DRY_RUN_SUCCESS');
  assert.equal((await fox.normalizeDelivery({ mode: 'dry-run' })).testOnly, true);
  await assert.rejects(() => fox.createOrder({ mode: 'production' }), /Dry-run mode is required/);
  console.log('fulfillment readiness tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
