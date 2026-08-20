const mongoose = require('mongoose');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const FulfillmentJob = require('../../models/FulfillmentJob');
const config = require('../../config/fulfillment');
const { FULFILLMENT_STATES } = require('./fulfillmentState');
const { ERROR_CODES, fulfillmentError } = require('./fulfillmentErrors');
const { getFulfillmentType, getSupplierAdapter, FULFILLMENT_TYPES } = require('./supplierAdapter');
const { createDryRunAdapter } = require('./dryRunAdapter');

const isPaymentConfirmed = order => {
  if (order?.paymentConfirmed === true) return true;
  const state = String(order?.paymentDetails?.status || order?.paymentDetails?.state || '').toLowerCase();
  return ['paid', 'completed', 'succeeded', 'captured'].includes(state) || order?.status === 'paid';
};

const isPhase28PaymentConfirmed = order => order?.paymentStatus === 'PAID';

const idempotencyKeyFor = (orderId, orderItemId) => `aren:${orderId}:${orderItemId}`;

const safeDryRunEvent = (job, validation = {}) => ({
  event: 'FULFILLMENT_DRY_RUN',
  orderId: String(job.order),
  orderItemId: String(job.orderItemId),
  productId: String(job.product),
  supplier: job.supplier,
  supplierProductId: job.supplierProductId,
  fulfillmentType: job.fulfillmentType,
  idempotencyKey: job.idempotencyKey,
  validation
});

const getOrderAndProduct = async (orderId, itemId) => {
  if (!mongoose.isValidObjectId(orderId) || !mongoose.isValidObjectId(itemId)) {
    throw fulfillmentError(ERROR_CODES.MANUAL_REVIEW_REQUIRED, 'Invalid order or item identifier');
  }
  const order = await Order.findById(orderId).select('+deliveredData');
  if (!order) throw fulfillmentError(ERROR_CODES.PRODUCT_NOT_FOUND, 'Order not found');
  const item = order.items.id(itemId);
  if (!item) throw fulfillmentError(ERROR_CODES.PRODUCT_NOT_FOUND, 'Order item not found');
  const product = await Product.findById(item.product)
    .select('+supplierMetadata +supplierAvailability +supplierCost');
  if (!product) throw fulfillmentError(ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found');
  return { order, item, product };
};

const validateOrderForFulfillment = async (orderId, itemId) => {
  const { order, item, product } = await getOrderAndProduct(orderId, itemId);
  if (!isPhase28PaymentConfirmed(order)) throw fulfillmentError(ERROR_CODES.ORDER_NOT_PAID, 'Payment confirmation is not proven');
  if (order.status === 'completed') throw fulfillmentError(ERROR_CODES.FULFILLMENT_ALREADY_COMPLETED);
  if (['cancelled', 'refunded'].includes(order.status)) throw fulfillmentError(ERROR_CODES.MANUAL_REVIEW_REQUIRED, 'Order is not fulfillable');
  if (!product.isActive) throw fulfillmentError(ERROR_CODES.MANUAL_REVIEW_REQUIRED, 'Product is not active');
  if (!product.supplier || !['foxreload', 'fazercards'].includes(product.supplier)) throw fulfillmentError(ERROR_CODES.SUPPLIER_NOT_SUPPORTED);
  if (!product.supplierProductId) throw fulfillmentError(ERROR_CODES.SUPPLIER_PRODUCT_ID_MISSING);
  if (!(Number(item.quantity) > 0) || !(Number(product.price) > 0)) throw fulfillmentError(ERROR_CODES.PRODUCT_PRICE_INVALID, 'Order quantity or selling price is invalid');

  const type = getFulfillmentType(product);
  const adapter = getSupplierAdapter(product.supplier);
  if (!adapter || type === FULFILLMENT_TYPES.UNKNOWN || !adapter.supportsFulfillment(type)) {
    throw fulfillmentError(ERROR_CODES.UNSUPPORTED_FULFILLMENT_TYPE);
  }
  adapter.validateProduct(product);
  adapter.validateAvailability(product);
  return { order, item, product, type, adapter };
};

const createPendingJob = async (orderId, itemId) => {
  const idempotencyKey = idempotencyKeyFor(orderId, itemId);
  let validated;
  try {
    validated = await validateOrderForFulfillment(orderId, itemId);
  } catch (validationError) {
    if (validationError.code === ERROR_CODES.ORDER_NOT_PAID) throw validationError;
    let context;
    try { context = await getOrderAndProduct(orderId, itemId); } catch (contextError) { throw validationError; }
    if (!context.product.supplierProductId) throw validationError;
    const manualJob = await FulfillmentJob.findOneAndUpdate(
      { idempotencyKey },
      {
        $setOnInsert: {
          order: orderId,
          orderItemId: itemId,
          product: context.product._id,
          supplier: context.product.supplier || 'unknown',
          supplierProductId: context.product.supplierProductId,
          fulfillmentType: getFulfillmentType(context.product),
          status: FULFILLMENT_STATES.MANUAL_REVIEW,
          maxAttempts: config.maxAttempts,
          idempotencyKey,
          errorCode: validationError.code || ERROR_CODES.MANUAL_REVIEW_REQUIRED,
          errorMessage: validationError.message,
          manualReviewReason: validationError.code || ERROR_CODES.MANUAL_REVIEW_REQUIRED
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return { job: manualJob, created: manualJob.createdAt?.getTime() === manualJob.updatedAt?.getTime(), manualReview: true, error: validationError };
  }
  try {
    const job = await FulfillmentJob.create({
      order: orderId,
      orderItemId: itemId,
      product: validated.product._id,
      supplier: validated.product.supplier,
      supplierProductId: validated.product.supplierProductId,
      fulfillmentType: validated.type,
      status: FULFILLMENT_STATES.PENDING,
      maxAttempts: config.maxAttempts,
      idempotencyKey
    });
    return { job, created: true, validation: validated };
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await FulfillmentJob.findOne({ idempotencyKey });
      if (existing?.status === FULFILLMENT_STATES.COMPLETED) throw fulfillmentError(ERROR_CODES.FULFILLMENT_ALREADY_COMPLETED);
      if (existing?.supplierOrderId) throw fulfillmentError(ERROR_CODES.SUPPLIER_ORDER_ALREADY_EXISTS);
      if (existing?.status === FULFILLMENT_STATES.PROCESSING) throw fulfillmentError(ERROR_CODES.FULFILLMENT_ALREADY_PROCESSING);
      return { job: existing, created: false, validation: validated };
    }
    throw error;
  }
};

const processJob = async jobId => {
  const job = await FulfillmentJob.findById(jobId);
  if (!job) throw fulfillmentError(ERROR_CODES.PRODUCT_NOT_FOUND, 'Fulfillment job not found');
  if (job.status === FULFILLMENT_STATES.COMPLETED) throw fulfillmentError(ERROR_CODES.FULFILLMENT_ALREADY_COMPLETED);
  if (job.supplierOrderId) throw fulfillmentError(ERROR_CODES.SUPPLIER_ORDER_ALREADY_EXISTS);

  if (!config.supplierFulfillmentEnabled) {
    console.info(JSON.stringify(safeDryRunEvent(job, { status: 'DISABLED' })));
    return { job, executed: false, code: ERROR_CODES.FULFILLMENT_DISABLED };
  }

  const acquired = await FulfillmentJob.findOneAndUpdate(
    { _id: job._id, status: FULFILLMENT_STATES.PENDING, supplierOrderId: '' },
    { $set: { status: FULFILLMENT_STATES.PROCESSING, lastAttemptAt: new Date() }, $inc: { attempts: 1 } },
    { new: true }
  );
  if (!acquired) throw fulfillmentError(ERROR_CODES.FULFILLMENT_ALREADY_PROCESSING);

  // The enabled branch remains intentionally fail-closed until the supplier order contract is approved.
  await FulfillmentJob.findByIdAndUpdate(acquired._id, {
    $set: { status: FULFILLMENT_STATES.MANUAL_REVIEW, errorCode: ERROR_CODES.FULFILLMENT_DISABLED, manualReviewReason: 'Supplier execution adapter is not enabled in Phase 11' }
  });
  throw fulfillmentError(ERROR_CODES.FULFILLMENT_DISABLED);
};

const processDryRunJob = async jobId => {
  const job = await FulfillmentJob.findById(jobId);
  if (!job) throw fulfillmentError(ERROR_CODES.PRODUCT_NOT_FOUND, 'Fulfillment job not found');
  if (job.status === FULFILLMENT_STATES.COMPLETED) throw fulfillmentError(ERROR_CODES.FULFILLMENT_ALREADY_COMPLETED);
  if (job.supplierOrderId) throw fulfillmentError(ERROR_CODES.SUPPLIER_ORDER_ALREADY_EXISTS);

  const acquired = await FulfillmentJob.findOneAndUpdate(
    { _id: job._id, status: FULFILLMENT_STATES.PENDING, supplierOrderId: '' },
    { $set: { status: FULFILLMENT_STATES.PROCESSING, lastAttemptAt: new Date() }, $inc: { attempts: 1 } },
    { new: true }
  );
  if (!acquired) throw fulfillmentError(ERROR_CODES.FULFILLMENT_ALREADY_PROCESSING);

  const adapter = createDryRunAdapter(acquired.supplier);
  const supplierOrder = await adapter.createOrder({ mode: 'dry-run' });
  const delivery = adapter.normalizeDelivery({ mode: 'dry-run' });
  const completed = await FulfillmentJob.findByIdAndUpdate(acquired._id, {
    $set: {
      status: FULFILLMENT_STATES.COMPLETED,
      supplierStatus: supplierOrder.status,
      deliveryData: delivery,
      completedAt: new Date()
    }
  }, { new: true }).select('+deliveryData');
  return { job: completed, executed: true, dryRun: true };
};

const canStartFulfillment = async orderId => {
  if (!mongoose.isValidObjectId(orderId)) return { allowed: false, code: ERROR_CODES.MANUAL_REVIEW_REQUIRED };
  const order = await Order.findById(orderId).select('status paymentStatus paymentConfirmed paymentDetails');
  if (!order || !isPhase28PaymentConfirmed(order)) return { allowed: false, code: ERROR_CODES.ORDER_NOT_PAID };
  if (!config.supplierFulfillmentEnabled) return { allowed: false, code: ERROR_CODES.FULFILLMENT_DISABLED };
  return { allowed: true };
};

module.exports = {
  isPaymentConfirmed,
  idempotencyKeyFor,
  validateOrderForFulfillment,
  createPendingJob,
  processJob,
  processDryRunJob,
  canStartFulfillment,
  safeDryRunEvent
};
