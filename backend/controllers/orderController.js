const Order = require('../models/Order');
const Product = require('../models/Product');
const DigitalCode = require('../models/DigitalCode');
const User = require('../models/User');
const Log = require('../models/Log');
const emailService = require('../services/emailService');
const NotificationService = require('../controllers/notificationController');

// Helper: create an admin log entry (silent fail)
const createLog = async (admin, action, target, details = '') => {
  try {
    await Log.create({
      adminId: admin._id,
      adminName: admin.name,
      action,
      target,
      details
    });
  } catch (e) {
    console.error('Log write failed:', e.message);
  }
};


// @GET /api/orders/my
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product', 'name image category')
      .populate('items.codes', 'code')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};


// @GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name image category platform')
      .populate('items.codes', 'code');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (
      order.user.toString() !== req.user.id &&
      !req.user.hasPermission('admin')
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};



// CORE FUNCTION
exports.fulfillOrder = async (orderId) => {

  const order = await Order.findById(orderId)
    .populate('items.product', 'name image category platform')
    .populate('user', 'name email');

  if (!order || order.status === 'completed') {
    throw new Error('Order not ready for fulfillment');
  }

  const session = await Order.startSession();
  session.startTransaction();

  try {

    for (const item of order.items) {

      const allocatedCodes = [];

      for (let i = 0; i < item.quantity; i++) {

        const code = await DigitalCode.findOneAndUpdate(
          {
            product: item.product._id,
            isUsed: false
          },
          {
            isUsed: true,
            usedBy: order.user._id,
            usedAt: new Date(),
            order: order._id
          },
          {
            new: true,
            session
          }
        );

        if (!code) {
          throw new Error(`Out of stock: ${item.product.name}`);
        }

        allocatedCodes.push(code._id);

        await Product.findByIdAndUpdate(
          item.product._id,
          {
            $inc: { stock: -1, totalSold: 1 }
          },
          { session }
        );
      }

      item.codes = allocatedCodes;
      item.name = item.product.name;
      item.image = item.product.image;
    }

    order.status = 'completed';

    await order.save({ session });

    await User.findByIdAndUpdate(
      order.user._id,
      { $addToSet: { orders: order._id } },
      { session }
    );

    await session.commitTransaction();

    return order;

  } catch (err) {

    await session.abortTransaction();

    order.status = 'failed';
    await order.save();

    throw err;

  } finally {
    session.endSession();
  }
};



// @GET /api/orders (admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    } else {
      
      query.status = { $in: ['paid', 'paid_unconfirmed', 'pending_fulfillment', 'completed', 'processing'] };
    }

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      orders
    });

  } catch (err) {
    next(err);
  }
};



// @PUT /api/orders/:id/status (admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {

    const { status } = req.body;

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // If admin marks as completed, run full fulfillment to attach codes
    if (status === 'completed') {
      if (order.status === 'completed') {
        return res.json({ success: true, order });
      }
      if (['cancelled', 'refunded'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Order not ready for completion'
        });
      }

      const fulfilled = await exports.fulfillOrder(order._id);
      
      // Send email confirmation
      emailService
        .sendOrderConfirmation(fulfilled.user, fulfilled)
        .catch(console.error);

      // Create notification for the user that codes are ready
      try {
        const codesCount = fulfilled.items.reduce((sum, item) => sum + item.quantity, 0);
        console.log(`📢 Creating notification for user ID: ${fulfilled.user._id}`);
        console.log(`   Order: ${fulfilled.orderNumber}, Codes: ${codesCount}`);
        
        const notification = await NotificationService.createNotification(fulfilled.user._id, {
          type: 'codes_ready',
          title: '🎉 Your Codes Are Ready!',
          message: `Your order ${fulfilled.orderNumber} has been confirmed. ${codesCount} code(s) are now available for download.`,
          metadata: {
            orderId: fulfilled._id,
            orderNumber: fulfilled.orderNumber,
            codesCount: codesCount,
            amount: fulfilled.totalAmount
          },
          actionUrl: `/orders/${fulfilled._id}`
        });
        
      } catch (notifErr) {
       
      }

      return res.json({ success: true, order: fulfilled });
    }

    order.status = status;
    await order.save();

    res.json({ success: true, order });

  } catch (err) {
    next(err);
  }
};




exports.confirmAndSend = async (req, res, next) => {
  try {
    const { deliveryMode = 'database', deliveredCode, manualCodesPerItem } = req.body;

    let order = await Order.findById(req.params.id)
      .populate('items.product', 'name image category platform')
      .populate('items.codes', 'code')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const hasCodesAlready = Array.isArray(order.items) && order.items.every(item => (item.codes || []).length > 0);
    if (order.status === 'completed' && hasCodesAlready) {
      return res.json({
        success: true,
        message: 'Order already confirmed',
        order
      });
    }

    
    if (deliveryMode === 'database') {
      if (hasCodesAlready) {
        order.status = 'completed';
        await order.save();
      } else {
        order = await exports.fulfillOrder(order._id);
        
        order = await Order.findById(order._id)
          .populate('user', 'name email')
          .populate('items.product', 'name image')
          .populate('items.codes', 'code');
      }
    } else if (deliveryMode === 'manual') {
      if (hasCodesAlready) {
        return res.json({
          success: true,
          message: 'Order already delivered manually',
          order
        });
      }

      
      const rawCodes = Array.isArray(manualCodesPerItem) && manualCodesPerItem.length > 0
        ? manualCodesPerItem
        : order.items.map(() => [deliveredCode]);

      
      const codesArray = rawCodes.map((entry, i) => {
        if (Array.isArray(entry)) return entry;
        return Array(order.items[i]?.quantity || 1).fill(String(entry));
      });

      
      const missingCode = codesArray.some((codes, i) => {
        const qty = order.items[i]?.quantity || 1;
        return codes.length < qty || codes.some(c => !c || !String(c).trim());
      });
      if (missingCode) {
        return res.status(400).json({
          success: false,
          message: 'Code is required for every item quantity'
        });
      }

      const session = await Order.startSession();
      session.startTransaction();

      try {
        for (let i = 0; i < order.items.length; i++) {
          const item = order.items[i];
          const itemCodes = codesArray[i]; 
          const allocatedCodeIds = [];

          
          for (let q = 0; q < item.quantity; q++) {
            const codeStr = String(itemCodes[q]).trim();

            const newCode = new DigitalCode({
              product: item.product._id || item.product,
              code: codeStr,
              isUsed: true,
              usedBy: order.user._id || order.user,
              usedAt: new Date(),
              order: order._id,
              addedBy: req.user._id,
              notes: 'Manual delivery via Admin Dashboard'
            });

            await newCode.save({ session });
            allocatedCodeIds.push(newCode._id);
          }

          
          order.items[i].set('codes', allocatedCodeIds);
          order.items[i].set('name', item.product.name);
          order.items[i].set('image', item.product.image);
        }

        order.status = 'completed';
        await order.save({ session });

        await User.findByIdAndUpdate(
          order.user._id,
          { $addToSet: { orders: order._id } },
          { session }
        );

        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }

      //  Repopulate order to guarantee emailService gets the actual string {code: '...'} instead of ObjectId
      order = await Order.findById(order._id)
        .populate('user', 'name email')
        .populate('items.product', 'name image')
        .populate('items.codes', 'code');
    }

   
    emailService
      .sendOrderConfirmation(order.user, order)
      .catch(console.error);

   
    try {
      const codesCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
      await NotificationService.createNotification(order.user._id, {
        type: 'codes_ready',
        title: '🎉 Your Codes Are Ready!',
        message: `Order #${order.orderNumber} confirmed. ${codesCount} code(s) available now.`,
        metadata: { orderId: order._id, orderNumber: order.orderNumber, codesCount, amount: order.totalAmount },
        actionUrl: `/orders/${order._id}`
      });
    } catch (notifErr) {
      console.error('Notification failed:', notifErr.message);
    }

    
    await createLog(
      req.user,
      'CONFIRM_ORDER',
      `Order #${order.orderNumber} — ${order.user?.name || 'Unknown'}`,
      `Delivered via ${deliveryMode} — $${order.totalAmount?.toFixed(2)}`
    );

    res.json({
      success: true,
      message: 'Codes sent to customer successfully!',
      order,
      deliveryMode
    });

  } catch (err) {
    next(err);
  }
};
