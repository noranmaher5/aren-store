const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  siteName: {
    type: String,
    default: 'Aren Store'
  },
  // ── إعدادات الإشعارات بالإيميل ────────────────────────────────────────────
  emailNotifications: {
    orderConfirmation: { type: Boolean, default: true },  
    welcomeEmail:      { type: Boolean, default: true },  
    lowStockAlert:     { type: Boolean, default: true },  
    adminNewOrder:     { type: Boolean, default: false }, 
  },
  promotionCampaign: {
    enabled: { type: Boolean, default: true },
    eyebrow: { type: String, default: 'Limited time offers', trim: true, maxlength: 80 },
    titleLine1: { type: String, default: 'Big deals.', trim: true, maxlength: 80 },
    titleLine2: { type: String, default: 'Small prices.', trim: true, maxlength: 80 },
    description: { type: String, default: 'Discover real promotions on selected Aren Store subscriptions and digital products.', trim: true, maxlength: 240 },
    stripTitle: { type: String, default: 'Special prices are live right now', trim: true, maxlength: 100 },
    stripText: { type: String, default: 'Grab your favorites while these verified promotions are active.', trim: true, maxlength: 240 },
    showCountdown: { type: Boolean, default: false },
    countdownEndsAt: { type: Date, default: null },
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
