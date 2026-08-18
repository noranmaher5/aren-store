const mongoose = require('mongoose');
const { FULFILLMENT_STATES } = require('../services/fulfillment/fulfillmentState');

const fulfillmentJobSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  orderItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  supplier: { type: String, required: true },
  supplierProductId: { type: String, required: true },
  fulfillmentType: { type: String, required: true },
  status: { type: String, enum: Object.values(FULFILLMENT_STATES), default: FULFILLMENT_STATES.PENDING },
  attempts: { type: Number, default: 0, min: 0 },
  maxAttempts: { type: Number, default: 3, min: 0 },
  idempotencyKey: { type: String, required: true, unique: true, trim: true },
  supplierOrderId: { type: String, trim: true, default: '' },
  supplierStatus: { type: String, trim: true, default: '' },
  deliveryData: { type: mongoose.Schema.Types.Mixed, select: false },
  errorCode: { type: String, trim: true, default: '' },
  errorMessage: { type: String, trim: true, default: '' },
  lastAttemptAt: Date,
  nextAttemptAt: Date,
  completedAt: Date,
  manualReviewReason: { type: String, trim: true, default: '' }
}, { timestamps: true });

fulfillmentJobSchema.index({ order: 1, orderItemId: 1 }, { unique: true });
fulfillmentJobSchema.index({ status: 1, nextAttemptAt: 1 });

module.exports = mongoose.model('FulfillmentJob', fulfillmentJobSchema);
