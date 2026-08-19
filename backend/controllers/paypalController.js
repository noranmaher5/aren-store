const paypal = require('@paypal/checkout-server-sdk');
const Order = require('../models/Order');
const Product = require('../models/Product');
const DigitalCode = require('../models/DigitalCode');
const DiscountCode = require('../models/DiscountCode');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');
const supplierFulfillment = require('../services/supplierFulfillment.service');
const crypto = require('crypto');
const { getEffectivePrice } = require('../utils/promotion');
const { parseQuantity } = require('../utils/quantity');

const client = () => {
  const environment = new paypal.core.LiveEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
  return new paypal.core.PayPalHttpClient(environment);
};


exports.createPayPalOrder = async (req, res) => {
  try {
    const { items, discountCode } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    let totalAmount = 0;
    for (const item of items) {
      const quantity = parseQuantity(item.quantity);
      if (!quantity) {
        return res.status(400).json({ success: false, message: 'Each quantity must be a whole number between 1 and 100' });
      }
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: 'Product is unavailable' });
      }
      if (!product.isUnlimited) {
        const available = await DigitalCode.countDocuments({ product: product._id, isUsed: false });
        if (available < quantity) {
          return res.status(400).json({ success: false, message: `Out of stock: ${product.name}` });
        }
      }
      totalAmount += getEffectivePrice(product).price * quantity;
    }

    if (discountCode) {
      const discount = await DiscountCode.findOne({ code: discountCode.toUpperCase(), isActive: true });
      if (discount) {
        const userUsageCount = discount.usedBy.filter(u => u.user.toString() === req.user.id).length;
        const valid = (discount.maxUses === 0 || discount.usedCount < discount.maxUses) &&
          (!discount.expiresAt || new Date() < discount.expiresAt) &&
          userUsageCount < discount.maxUsesPerUser;
        if (valid) {
          const discountAmount = discount.type === 'percentage'
            ? (totalAmount * discount.value) / 100
            : Math.min(discount.value, totalAmount);
          totalAmount = Math.max(0, totalAmount - discountAmount);
        }
      }
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: (Math.round(totalAmount * 100) / 100).toFixed(2) },
      }]
    });

    const order = await client().execute(request);
    res.json({ success: true, paypalOrderId: order.result.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.capturePayPalOrder = async (req, res) => {
  try {
    const { paypalOrderId, items, discountCode } = req.body;

    
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    const capture = await client().execute(request);

    if (capture.result.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    
    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const quantity = parseQuantity(item.quantity);
      if (!quantity) {
        return res.status(400).json({ success: false, message: 'Each quantity must be a whole number between 1 and 100' });
      }
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      if (!product.isUnlimited) {
        const available = await DigitalCode.countDocuments({
          product: product._id,
          isUsed: false
        });
        if (available < quantity) {
          return res.status(400).json({ success: false, message: `Out of stock: ${product.name}` });
        }
      }

      const effectivePrice = getEffectivePrice(product).price;
      totalAmount += effectivePrice * quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: effectivePrice,
        quantity,
        codes: []
      });
    }

    let finalAmount = Math.round(totalAmount * 100) / 100;
    let appliedDiscount = null;

    
    if (discountCode) {
      const discount = await DiscountCode.findOne({
        code: discountCode.toUpperCase(),
        isActive: true
      });
      if (discount) {
        const userUsageCount = discount.usedBy.filter(
          u => u.user.toString() === req.user.id
        ).length;
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
      status: { $in: ['paid_unconfirmed', 'completed'] },
      createdAt: { $gte: recentCutoff }
    });

    if (existing) {
      return res.json({ success: true, orderId: existing._id, reused: true });
    }

   
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount: finalAmount,
      status: 'paid_unconfirmed',
      paymentMethod: 'paypal',
      paymentDetails: { provider: 'paypal', status: 'captured', paypalOrderId },
      checkoutHash,
      paypalOrderId: paypalOrderId, 
    });

    // Supplier/manual classification happens only after PayPal reports a
    // completed capture. Legacy manually stocked products remain in the
    // existing paid_unconfirmed flow.
    let preparedOrder;
    try {
      preparedOrder = await supplierFulfillment.preparePaidOrder(order._id);
    } catch (fulfillmentError) {
      // Payment and fulfillment are separate states. Never report a failed
      // supplier-preparation step as an untracked paid order.
      order.status = 'pending_fulfillment';
      order.fulfillmentMetadata = {
        reason: 'post_payment_fulfillment_preparation_failed',
        preparedAt: new Date()
      };
      await order.save();
      preparedOrder = order;
      console.error('Post-payment fulfillment preparation failed:', fulfillmentError.message);
    }

    
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

    
    try {
      const isPending = preparedOrder.status === 'pending_fulfillment';
      await Notification.create({
        user: req.user.id,
        type: isPending ? 'general' : 'codes_ready',
        title: isPending ? 'Order received' : 'Order Confirmed! 🎉',
        message: isPending
          ? `Your order #${order._id.toString().slice(-6)} is pending fulfillment.`
          : `Your order #${order._id.toString().slice(-6)} has been completed successfully.`,
        actionUrl: `/orders/${order._id}`,
        metadata: { orderId: order._id }
      });
    } catch (e) {
      console.error('❌ Notification failed:', e);
    }

   
    emailService.sendAdminNewOrderAlert(order, req.user).catch(() => {});

    res.json({ success: true, orderId: preparedOrder._id });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
