const enabled = String(process.env.SUPPLIER_FULFILLMENT_ENABLED || '').toLowerCase() === 'true';

module.exports = {
  supplierFulfillmentEnabled: enabled,
  maxAttempts: 3,
};
