const Order       = require('../models/Order');
const DiscountCode = require('../models/DiscountCode');
const Product     = require('../models/Product');
const DigitalCode = require('../models/DigitalCode');
const crypto      = require('crypto');
const emailService = require('../services/emailService');
const Notification = require('../models/Notification'); 
const { getEffectivePrice } = require('../utils/promotion');

exports.getConfig = async (req, res) => {
  res.json({ success: true, publishableKey: 'fake_key', fakeMode: true });
};


exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { items, method, discountCode } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      if (!product.isUnlimited) {
        const available = await DigitalCode.countDocuments({
          product: product._id,
          isUsed: false
        });

        if (available < item.quantity) {
          return res.status(400).json({ success: false, message: `Out of stock: ${product.name}` });
        }
      }

      const effectivePrice = getEffectivePrice(product).price;
      totalAmount += effectivePrice * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: effectivePrice,
        quantity: item.quantity,
        codes: []
      });
    }

    let finalAmount = Math.round(totalAmount * 100) / 100;
    let appliedDiscount = null;

    
    if (discountCode) {
      const discount = await DiscountCode.findOne({ code: discountCode.toUpperCase(), isActive: true });
      if (discount) {
        const userUsageCount = discount.usedBy.filter(u => u.user.toString() === req.user.id).length;
        const notMaxed = discount.maxUses === 0 || discount.usedCount < discount.maxUses;
        const notExpired = !discount.expiresAt || new Date() < discount.expiresAt;
        const userNotMaxed = userUsageCount < discount.maxUsesPerUser;

        if (notMaxed && notExpired && userNotMaxed) {
          let discountAmount = 0;
          if (discount.type === 'percentage') {
            discountAmount = (finalAmount * discount.value) / 100;
          } else {
            discountAmount = Math.min(discount.value, finalAmount);
          }
          finalAmount = Math.max(0, Math.round((finalAmount - discountAmount) * 100) / 100);
          appliedDiscount = { id: discount._id, amount: discountAmount };
        }
      }
    }

    // Idempotency: avoid duplicate orders for same cart within a short window
    const signature = orderItems
      .map(i => `${i.product.toString()}:${i.quantity}:${i.price}`)
      .sort()
      .join('|');
    const checkoutHash = crypto
      .createHash('sha256')
      .update(`${req.user.id}|${finalAmount}|${signature}`)
      .digest('hex');

    const recentCutoff = new Date(Date.now() - 10 * 60 * 1000);
    const existing = await Order.findOne({
      user: req.user.id,
      checkoutHash,
      status: 'paid_unconfirmed',   // was pending
      createdAt: { $gte: recentCutoff }
    }).sort({ createdAt: -1 });

    if (existing) {
      return res.json({
        success: true,
        clientSecret: 'fake_' + existing._id,
        orderId: existing._id,
        totalAmount: existing.totalAmount,
        fakeMode: true,
        reused: true
      });
    }

    // Create new order
    const paymentMethod = method === 'paypal' ? 'paypal' : 'stripe';

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount: finalAmount,
      status: 'paid_unconfirmed',
      paymentMethod,
      checkoutHash
    });

    // Update discount code usage
    if (appliedDiscount) {
      await DiscountCode.findByIdAndUpdate(appliedDiscount.id, {
        $inc: { usedCount: 1 },
        $push: {
          usedBy: {
            user: req.user.id,
            order: order._id,
            usedAt: new Date(),
            discountAmount: appliedDiscount.amount,
          }
        }
      });
    }

    res.json({
      success: true,
      clientSecret: 'fake_' + order._id,
      orderId: order._id,
      totalAmount: finalAmount,
      fakeMode: true
    });

   
    emailService.sendAdminNewOrderAlert(order, req.user).catch(() => {});

  } catch (err) {
    next(err);
  }
};


exports.confirmPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    
    if (order.status === 'completed') {
       return res.json({ success: true, order, alreadyProcessed: true });
    }

   
    order.status = 'completed';
    await order.save();

    
    try {
      await Notification.create({
        user: req.user.id,
        type: 'codes_ready', 
        title: 'Order Confirmed! 🎉',
        message: `Your order #${order._id.toString().slice(-6)} has been completed successfully. Check your items now!`,
        actionUrl: `/orders/${order._id}`, 
        metadata: { orderId: order._id }
      });
    } catch (err) {
      console.error('❌ Failed to create notification:', err);
     
    }

    res.json({
      success: true,
      order
    });

  } catch (err) {
    next(err);
  }
};

exports.stripeWebhook = async (req, res) => {
  res.json({ received: true });
};
