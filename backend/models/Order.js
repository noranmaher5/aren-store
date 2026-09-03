const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  image: String,
  price: {
    type: Number,
    required: true
  },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  productSlug: String,
  unitPrice: Number,
  totalPrice: Number,
  supplierProductId: String,
  productSupplier: String,
  productCategory: String,
  productCurrency: String,
  cost: { type: Number, min: 0, default: 0 },
  countryCode: String,
  region: String,
  platform: String,
  attributes: mongoose.Schema.Types.Mixed,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  codes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DigitalCode'
  }]
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  subtotalAmount: { type: Number, min: 0 },
  discountCode: { type: String, uppercase: true, trim: true, default: '' },
  discountAmount: { type: Number, min: 0, default: 0 },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'FULFILLED', 'COMPLETED', 'CANCELLED', 'FAILED', 'REFUNDED',
      'paid_unconfirmed', 'processing', 'pending_fulfillment', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'PENDING_PAYMENT'
  },
  referralEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referralCode: { type: String, uppercase: true, trim: true, default: '' },
  deliveryEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  fulfillmentStatus: {
    type: String,
    enum: ['NOT_STARTED', 'PROCESSING', 'FULFILLED', 'FAILED'],
    default: 'NOT_STARTED'
  },
  customer: {
    name: String,
    email: String,
    phone: String
  },
  deliveryMethod: {
    type: String,
    enum: ['email', 'whatsapp'],
    required: true
  },
  deliveryContact: {
    type: String,
    required: true,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'paymob', 'manual', 'bank_transfer'],
    default: 'stripe'
  },
  selectedPaymentAccount: {
    id: String,
    label: String,
    bankName: String,
    accountName: String,
    accountNumber: String,
    iban: String,
    currency: String,
    notes: String
  },
  paymentProofUrl: { type: String, trim: true, default: '' },
  paymentProofSubmittedAt: Date,
  paymentIntentId: String,
  checkoutHash: String,
  idempotencyKey: { type: String, trim: true },
  paymentDetails: mongoose.Schema.Types.Mixed,
  supplier: {
    type: String,
    enum: ['manual', 'none', 'foxreload', 'fazercards'],
    default: undefined
  },
  supplierOrderId: {
    type: String,
    trim: true,
    default: ''
  },
  supplierDeliveryStatus: {
    type: String,
    trim: true,
    default: ''
  },
  fulfillmentType: {
    type: String,
    enum: ['digital_code', 'supplier', 'manual_request', 'manual_code', 'manual_account'],
    default: undefined
  },
  deliveredData: {
    type: mongoose.Schema.Types.Mixed,
    select: false,
    default: undefined
  },
  fulfillmentMetadata: {
    type: mongoose.Schema.Types.Mixed,
    default: undefined
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  notes: String,
  refundReason: String
}, {
  timestamps: true
});

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `DGV-${Date.now().toString(36).toUpperCase()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentIntentId: 1 });
orderSchema.index({ user: 1, checkoutHash: 1, status: 1, createdAt: -1 });
orderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Order', orderSchema);
