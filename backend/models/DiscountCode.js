const mongoose = require('mongoose');

const discountCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: String,

  //type of discount: percentage or fixed amount
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },

  // maximum uses allowed (0 = unlimited)
  maxUses: {
    type: Number,
    default: 0,
  },
  // maximum uses per user
  maxUsesPerUser: {
    type: Number,
    default: 1,
  },

  // number of times the code has been used
  usedCount: {
    type: Number,
    default: 0,
  },

  // users who have used the code
  usedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    usedAt: { type: Date, default: Date.now },
    discountAmount: Number,
  }],

  // optional expiration date
  expiresAt: Date,

  isActive: {
    type: Boolean,
    default: true,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('DiscountCode', discountCodeSchema);