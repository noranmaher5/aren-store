const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'roblox',       
      'minecraft',    
      'steam',        
      'discord',      
      'chatgpt',      
      'movies',       
      'social-daily-apps',
      'design-productivity-ai',
      'music-audio',
      'gift-cards', 
      'ebooks',       
      'games',        
      'general'      
    ],
    lowercase: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: false,
    min: [0, 'Price cannot be negative']
  },
  // Quote-only products show a request-for-price CTA instead of checkout.
  isQuoteOnly: {
    type: Boolean,
    default: undefined
  },
  options: [{
    name: { type: String, required: true, trim: true, maxlength: 120 },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '', maxlength: 500 },
    isActive: { type: Boolean, default: true }
  }],
  originalPrice: {
    type: Number,
    default: 0
  },
  promotion: {
    active: { type: Boolean, default: false },
    name: { type: String, trim: true, default: '' },
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    value: { type: Number, min: 0, default: 0 },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null }
  },
  currency: {
    type: String,
    default: 'USD'
  },
  image: {
    type: String,
    default: ''
  },
  images: [String],
  platform: {
    type: String,
    trim: true
  },
  region: {
    type: String,
    default: 'Global'
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isUnlimited: {
    type: Boolean,
    default: false
  },
  isOutOfStock: {
    type: Boolean,
    default: false
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  // Optional supplier metadata. Existing manually managed products retain the
  // legacy behavior through the defaults below.
  supplier: {
    type: String,
    enum: ['manual', 'none', 'foxreload', 'fazercards'],
    default: 'manual'
  },
  supplierProductId: {
    type: String,
    trim: true,
    default: ''
  },
  supplierMetadata: {
    type: mongoose.Schema.Types.Mixed,
    select: false,
    default: undefined
  },
  supplierAvailability: {
    quantity: { type: Number, min: 0, select: false },
    status: { type: String, select: false },
    checkedAt: { type: Date, select: false }
  },
  supplierCost: {
    type: Number,
    min: 0,
    select: false,
    default: undefined
  },
  productType: {
    type: String,
    enum: ['digital', 'subscription', 'gift_card', 'service'],
    default: 'digital'
  },
  deliveryType: {
    type: String,
    enum: ['instant', 'automatic', 'manual'],
    default: 'instant'
  },
  availabilityType: {
    type: String,
    enum: ['in_stock', 'on_demand', 'scheduled'],
    default: 'in_stock'
  },
  manualRequest: {
    enabled: { type: Boolean, default: false },
    expectedDeliveryNote: { type: String, default: '' },
    leadTimeDays: { type: Number, min: 0, default: 0 }
  },
  totalSold: {
    type: Number,
    default: 0
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },

 // Reviews
reviews: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    name: { 
      type: String, 
      required: true 
    },
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5 
    },
    comment: { 
      type: String, 
      required: true 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
}],
  extraInfo: {
  type: String,
  default: ''
},
youtubeUrl: {
  type: String,
  default: ''
},
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Auto-generate slug from name
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-') +
      '-' + Date.now();
  }
  next();
});

// Update average rating
productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = { average: 0, count: 0 };
    return;
  }
  const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
  this.rating.average = Math.round((sum / this.reviews.length) * 10) / 10;
  this.rating.count = this.reviews.length;
};

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

productSchema.set('toJSON', { virtuals: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1, price: 1 });
// External identity is stable per supplier. The partial filter keeps legacy
// manually-managed products with an empty supplierProductId valid.
productSchema.index(
  { supplier: 1, supplierProductId: 1 },
  { unique: true, partialFilterExpression: { supplierProductId: { $type: 'string', $gt: '' } } }
);

module.exports = mongoose.model('Product', productSchema);
