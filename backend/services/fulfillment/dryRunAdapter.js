const { fulfillmentError, ERROR_CODES } = require('./fulfillmentErrors');

const assertDryRun = mode => {
  if (mode !== 'dry-run') throw fulfillmentError(ERROR_CODES.FULFILLMENT_DISABLED, 'Dry-run mode is required');
};

const createDryRunAdapter = supplier => ({
  supplier,
  createOrder: async ({ mode } = {}) => {
    assertDryRun(mode);
    return { mode, supplier, supplierOrderId: `DRY-RUN-${supplier.toUpperCase()}`, status: 'DRY_RUN_SUCCESS' };
  },
  getOrder: async ({ mode } = {}) => {
    assertDryRun(mode);
    return { mode, supplier, status: 'DRY_RUN_SUCCESS' };
  },
  normalizeDelivery: ({ mode } = {}) => {
    assertDryRun(mode);
    return { mode, testOnly: true, delivery: 'DRY-RUN-CODE-ONLY' };
  }
});

module.exports = { createDryRunAdapter };
