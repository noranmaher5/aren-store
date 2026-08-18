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
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['paid_unconfirmed', 'processing', 'pending_fulfillment', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'paid_unconfirmed'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'paymob', 'manual'],
    default: 'stripe'
  },
  paymentIntentId: String,
  checkoutHash: String,
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
    enum: ['digital_code', 'supplier', 'manual_request'],
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

module.exports = mongoose.model('Order', orderSchema);
