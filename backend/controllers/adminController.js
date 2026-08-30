const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const DigitalCode = require('../models/DigitalCode');
const Settings = require('../models/Settings');
const Log = require('../models/Log');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { publicBankTransfer, sanitizeAccounts } = require('../utils/bankTransfer');

const STAFF_ROLES = ['editor', 'admin', 'manager', 'co-owner', 'owner', 'hidden'];
const makeReferralCode = () => `EMP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

const DEFAULT_PROMOTION_CAMPAIGN = {
  enabled: true,
  eyebrow: 'Limited time offers',
  titleLine1: 'Big deals.',
  titleLine2: 'Small prices.',
  description: 'Discover real promotions on selected Aren Store subscriptions and digital products.',
  stripTitle: 'Special prices are live right now',
  stripText: 'Grab your favorites while these verified promotions are active.',
  showCountdown: false,
  countdownEndsAt: null,
};

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

// 1. dashboard stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalProducts, totalOrders,
      revenueData, recentOrders, lowStockProducts,
      ordersByStatus, monthlySales, siteSettings
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ status: { $in: ['paid', 'completed', 'paid_unconfirmed'] } }),
      Order.aggregate([
        { $match: { status: { $in: ['paid', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(8),
      Product.find({
        isActive: true,
        isUnlimited: { $ne: true },
        $or: [
          { supplier: { $in: ['foxreload', 'fazercards'] }, 'supplierAvailability.quantity': { $lte: 5 } },
          { supplier: { $nin: ['foxreload', 'fazercards'] }, stock: { $lte: 5 } }
        ]
      })
        .sort({ stock: 1 })
        .limit(10)
        .select('name stock category supplier +supplierAvailability.quantity'),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        {
          $match: {
            status: { $in: ['paid', 'completed'] },
            createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Settings.findOne()
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: revenueData[0]?.total || 0,
        recentOrders,
        lowStockProducts: lowStockProducts.map(product => {
          const supplierQuantity = ['foxreload', 'fazercards'].includes(product.supplier)
            ? product.supplierAvailability?.quantity
            : null;
          return {
            _id: product._id,
            name: product.name,
            category: product.category,
            supplier: product.supplier,
            stock: supplierQuantity === null || supplierQuantity === undefined
              ? product.stock
              : supplierQuantity
          };
        }),
        ordersByStatus: Object.fromEntries(ordersByStatus.map(s => [s._id, s.count])),
        monthlySales,
        maintenanceMode: siteSettings?.maintenanceMode ?? false,
        deliveryMessage: siteSettings?.deliveryMessage || 'مرحبًا،\nتم تنفيذ طلبك بنجاح. رقم الطلب: {orderNumber}\n\nالأكواد الرقمية:\n{codes}\n\nشكرًا لاختياركم.',
        emailNotifications: {
          orderConfirmation: siteSettings?.emailNotifications?.orderConfirmation ?? true,
          welcomeEmail:      siteSettings?.emailNotifications?.welcomeEmail      ?? true,
          lowStockAlert:     siteSettings?.emailNotifications?.lowStockAlert     ?? true,
          adminNewOrder:     siteSettings?.emailNotifications?.adminNewOrder     ?? false,
        },
        promotionCampaign: {
          ...DEFAULT_PROMOTION_CAMPAIGN,
          ...((siteSettings?.promotionCampaign || {}).toObject?.() || siteSettings?.promotionCampaign || {}),
        },
        bankTransfer: siteSettings?.bankTransfer || { enabled: true, whatsapp: '', instructions: '', accounts: [] },
      }
    });
  } catch (err) {
    next(err);
  }
};

// 2. update system settings
exports.updateSettings = async (req, res, next) => {
  try {
    const { maintenanceMode, emailNotifications, promotionCampaign, bankTransfer, deliveryMessage } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    if (typeof maintenanceMode === 'boolean') {
      settings.maintenanceMode = maintenanceMode;
      await createLog(req.user, maintenanceMode ? 'MAINTENANCE_ON' : 'MAINTENANCE_OFF', 'System Settings', `Maintenance mode set to ${maintenanceMode}`);
    }

    if (typeof deliveryMessage === 'string') {
      settings.deliveryMessage = deliveryMessage.trim().slice(0, 2000);
      await createLog(req.user, 'UPDATE_DELIVERY_MESSAGE', 'Order Delivery Message', 'Updated WhatsApp/email message template');
    }

    if (emailNotifications && typeof emailNotifications === 'object') {
      settings.emailNotifications = {
        ...((settings.emailNotifications || {}).toObject?.() || settings.emailNotifications || {}),
        ...emailNotifications
      };
      settings.markModified('emailNotifications');
      await createLog(req.user, 'UPDATE_EMAIL_SETTINGS', 'Email Notifications', `Updated: ${Object.entries(emailNotifications).map(([k,v]) => `${k}=${v}`).join(', ')}`);
    }

    if (promotionCampaign && typeof promotionCampaign === 'object') {
      const allowed = ['enabled', 'eyebrow', 'titleLine1', 'titleLine2', 'description', 'stripTitle', 'stripText', 'showCountdown', 'countdownEndsAt'];
      const nextCampaign = {};
      allowed.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(promotionCampaign, key)) nextCampaign[key] = promotionCampaign[key];
      });
      if (nextCampaign.countdownEndsAt === '') nextCampaign.countdownEndsAt = null;
      if (nextCampaign.countdownEndsAt && Number.isNaN(new Date(nextCampaign.countdownEndsAt).getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid campaign end date' });
      }
      const currentCampaign = (settings.promotionCampaign || {}).toObject?.() || settings.promotionCampaign || {};
      settings.set('promotionCampaign', { ...DEFAULT_PROMOTION_CAMPAIGN, ...currentCampaign, ...nextCampaign });
      await createLog(req.user, 'UPDATE_PROMOTION_CAMPAIGN', 'Offers Page', 'Updated promotion campaign content');
    }

    if (bankTransfer && typeof bankTransfer === 'object') {
      const current = (settings.bankTransfer || {}).toObject?.() || settings.bankTransfer || {};
      settings.set('bankTransfer', {
        enabled: typeof bankTransfer.enabled === 'boolean' ? bankTransfer.enabled : current.enabled !== false,
        whatsapp: Object.prototype.hasOwnProperty.call(bankTransfer, 'whatsapp')
          ? String(bankTransfer.whatsapp || '').trim().slice(0, 32)
          : String(current.whatsapp || ''),
        instructions: Object.prototype.hasOwnProperty.call(bankTransfer, 'instructions')
          ? String(bankTransfer.instructions || '').trim().slice(0, 500)
          : String(current.instructions || ''),
        accounts: Array.isArray(bankTransfer.accounts) ? sanitizeAccounts(bankTransfer.accounts) : (current.accounts || [])
      });
      await createLog(req.user, 'UPDATE_BANK_TRANSFER', 'Payment Accounts', `Updated ${settings.bankTransfer.accounts.length} transfer accounts`);
    }

    await settings.save();

    res.json({
      success: true,
      message: 'SYSTEM_SETTINGS_UPDATED',
      maintenanceMode: settings.maintenanceMode,
      deliveryMessage: settings.deliveryMessage,
      emailNotifications: settings.emailNotifications,
      promotionCampaign: settings.promotionCampaign,
      bankTransfer: settings.bankTransfer
    });
  } catch (err) {
    next(err);
  }
};

// 3. financial reports
exports.getFinancialReports = async (req, res, next) => {
  try {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const buildLast7Days = (docs) => {
      const byDay = new Map(docs.map(item => [item._id, item.revenue]));
      const days = [];
      const formatKey = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const key = formatKey(d);
        days.push({ name: key, revenue: byDay.get(key) || 0 });
      }
      return days;
    };

    const totalRevenueStats = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const transactions = await Order.find()
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const chartData = await Order.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalAmount" } } },
      { $sort: { "_id": 1 } },
    ]);

    res.json({
      success: true,
      totalRevenue: totalRevenueStats[0]?.total || 0,
      netProfit: (totalRevenueStats[0]?.total || 0) * 0.90,
      avgOrderValue: (totalRevenueStats[0]?.total || 0) / (transactions.length || 1),
      transactions,
      chartData: buildLast7Days(chartData)
    });
  } catch (err) {
    next(err);
  }
};

// 4.manage users
exports.getUsers = async (req, res, next) => {
  try {
    const staffWithoutCodes = await User.find({ role: { $in: STAFF_ROLES }, $or: [{ referralCode: { $exists: false } }, { referralCode: '' }] }).select('_id');
    for (const staff of staffWithoutCodes) {
      let code = makeReferralCode();
      while (await User.exists({ referralCode: code })) code = makeReferralCode();
      await User.findByIdAndUpdate(staff._id, { referralCode: code });
    }
    const users = await User.aggregate([
      { $match: { role: { $ne: 'hidden' } } },
      { $lookup: { from: 'orders', localField: '_id', foreignField: 'user', as: 'orderHistory' } },
      { $lookup: { from: 'orders', let: { employeeId: '$_id' }, pipeline: [
        { $match: { $expr: { $and: [
          { $eq: ['$referralEmployee', '$$employeeId'] },
          { $in: ['$status', ['paid', 'completed', 'paid_unconfirmed']] }
        ] } } }
      ], as: 'referralOrders' } },
      { $lookup: { from: 'orders', let: { employeeId: '$_id' }, pipeline: [
        { $match: { $expr: { $and: [
          { $eq: ['$deliveryEmployee', '$$employeeId'] },
          { $in: ['$status', ['completed', 'FULFILLED']] }
        ] } } }
        , { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'deliveryProducts' } }
      ], as: 'deliveryOrders' } },
      {
        $project: {
          name: 1, email: 1, phone: 1, role: 1, isActive: 1, permissions: 1, referralCode: 1,
          referralOrderCount: { $size: '$referralOrders' },
          referralCustomerCount: { $size: { $setUnion: ['$referralOrders.user', []] } },
          referralRevenue: { $sum: '$referralOrders.totalAmount' },
          referralProfit: { $sum: { $map: { input: '$referralOrders', as: 'refOrder', in: {
            $subtract: [
              '$$refOrder.totalAmount',
              { $sum: { $map: { input: '$$refOrder.items', as: 'refItem', in: { $multiply: [
                { $ifNull: ['$$refItem.cost', 0] }, '$$refItem.quantity'
              ] } } } }
            ]
          } } } },
          deliveryOrderCount: { $size: '$deliveryOrders' },
          deliveryRevenue: { $sum: '$deliveryOrders.totalAmount' },
          deliveryProfit: { $sum: { $map: { input: '$deliveryOrders', as: 'deliveryOrder', in: {
            $subtract: [
              '$$deliveryOrder.totalAmount',
              { $sum: { $map: { input: '$$deliveryOrder.items', as: 'deliveryItem', in: { $multiply: [
                { $ifNull: [
                  { $cond: [
                    { $gt: [{ $ifNull: ['$$deliveryItem.cost', 0] }, 0] },
                    '$$deliveryItem.cost',
                    { $let: { vars: { product: { $arrayElemAt: [
                      { $filter: { input: '$$deliveryOrder.deliveryProducts', as: 'product', cond: { $eq: ['$$product._id', '$$deliveryItem.product'] } } }, 0
                    ] } }, in: '$$product.supplierCost' } }
                  ] },
                  0
                ] }, '$$deliveryItem.quantity'
              ] } } } }
            ]
          } } } },
          orderHistory: {
            $map: {
              input: '$orderHistory',
              as: 'order',
              in: { _id: '$$order._id', totalAmount: '$$order.totalAmount', createdAt: '$$order.createdAt', items: '$$order.items', paymentMethod: '$$order.paymentMethod' }
            }
          },
          totalSpent: { $sum: '$orderHistory.totalAmount' },
          orderCount: { $size: '$orderHistory' }
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

// 5. update user role & permissions
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role, permissions } = req.body;
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) return res.status(404).json({ success: false, message: 'User not found' });

    const isSuper = req.user.role === 'owner' || req.user.role === 'hidden';
    if ((userToUpdate.role === 'owner' || userToUpdate.role === 'hidden') && !isSuper) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const oldRole = userToUpdate.role;
    if (role) userToUpdate.role = role;
    if (permissions && Array.isArray(permissions)) userToUpdate.permissions = permissions;

    await userToUpdate.save();
    await createLog(req.user, 'UPDATE_ROLE', `${userToUpdate.name} (${userToUpdate.email})`, role ? `Role changed: ${oldRole} → ${role}` : 'Permissions updated');

    res.json({ success: true, user: userToUpdate });
  } catch (err) {
    next(err);
  }
};

// 6. activate/deactivate
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'owner') return res.status(403).json({ success: false, message: 'Cannot deactivate owner' });

    user.isActive = !user.isActive;
    await user.save();
    await createLog(req.user, 'TOGGLE_STATUS', `${user.name} (${user.email})`, `Account ${user.isActive ? 'activated' : 'deactivated'}`);

    res.json({ success: true, user, message: `STATUS_CHANGED_TO_${user.isActive}` });
  } catch (err) {
    next(err);
  }
};

// 7. maintenance mode
exports.toggleMaintenanceMode = async (req, res, next) => {
  try {
    const canManage = req.user.role === 'owner' || req.user.role === 'hidden' || req.user.permissions.includes('manage_maintenance');
    if (!canManage) return res.status(403).json({ success: false, message: 'FORBIDDEN' });

    const { status } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    settings.maintenanceMode = status;
    await settings.save();
    await createLog(req.user, status ? 'MAINTENANCE_ON' : 'MAINTENANCE_OFF', 'System Settings', 'Maintenance mode toggled via system endpoint');

    res.json({ success: true, maintenanceMode: settings.maintenanceMode });
  } catch (err) {
    next(err);
  }
};

// 8. change user password
exports.changeUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const userToUpdate = await User.findById(req.params.id).select('+password');
    if (!userToUpdate)
      return res.status(404).json({ success: false, message: 'User not found' });

    const isSuper = req.user.role === 'owner' || req.user.role === 'hidden';
    if (userToUpdate.role === 'owner' && !isSuper)
      return res.status(403).json({ success: false, message: 'Unauthorized' });

   
    userToUpdate.password = newPassword;
    await userToUpdate.save();

    await createLog(req.user, 'CHANGE_PASSWORD', `${userToUpdate.name} (${userToUpdate.email})`, 'Password changed by admin');

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

// 9. fetch system logs
exports.getSystemLogs = async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// 10.delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const userToDelete = await User.findById(req.params.id);

    if (!userToDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    
    const isSuper = req.user.role === 'owner' || req.user.role === 'hidden';
    if ((userToDelete.role === 'owner' || userToDelete.role === 'hidden') && !isSuper) {
      return res.status(403).json({ success: false, message: 'Cannot delete this user' });
    }

    
    if (userToDelete._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    await createLog(req.user, 'DELETE_USER', `${userToDelete.name} (${userToDelete.email})`, 'User permanently deleted');

    res.json({ success: true, message: 'User permanently deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getDeliveryEmployees = async (req, res, next) => {
  try {
    const employees = await User.find({
      isActive: true,
      role: { $in: STAFF_ROLES }
    }).select('name email role').sort({ name: 1 });
    res.json({ success: true, users: employees });
  } catch (err) {
    next(err);
  }
};

// 4b. create an employee account and send its initial credentials
exports.createEmployee = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const requestedRole = String(req.body.role || 'editor').trim();
    const allowedRoles = ['editor', 'admin', 'manager'];
    const allowedPermissions = ['manage_products', 'manage_orders', 'manage_maintenance', 'view_analytics', 'manage_users', 'manage_settings', 'view_ledger'];
    const roleLevels = { user: 0, editor: 1, admin: 2, manager: 3, 'co-owner': 4, owner: 5, hidden: 6 };

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email is required' });
    }
    if (!allowedRoles.includes(requestedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid employee role' });
    }
    if ((roleLevels[req.user.role] ?? -1) < (roleLevels[requestedRole] ?? 99)) {
      return res.status(403).json({ success: false, message: 'You cannot create an account with this role' });
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const name = String(req.body.name || email.split('@')[0]).trim().slice(0, 50) || 'Employee';
    const permissions = Array.isArray(req.body.permissions)
      ? req.body.permissions.filter(permission => allowedPermissions.includes(permission))
      : [];
    const password = `${crypto.randomBytes(9).toString('base64url')}A1!`;
    let referralCode = makeReferralCode();
    while (await User.exists({ referralCode })) referralCode = makeReferralCode();
    const employee = await User.create({ name, email, password, role: requestedRole, permissions, referralCode });

    try {
      await emailService.sendEmployeeInvitation(employee, password);
    } catch (emailError) {
      console.error('[CREATE_EMPLOYEE] Invitation email failed:', {
        message: emailError.message,
        code: emailError.code,
        responseCode: emailError.responseCode
      });
      await User.findByIdAndDelete(employee._id);
      return res.status(502).json({
        success: false,
        message: 'Account was not created because the invitation email could not be sent',
        ...(process.env.NODE_ENV !== 'production' && {
          emailError: emailError.code || emailError.responseCode || emailError.message
        })
      });
    }

    await createLog(req.user, 'CREATE_EMPLOYEE', `${employee.name} (${employee.email})`, `Role: ${requestedRole}`);
    res.status(201).json({ success: true, message: 'Employee account created and invitation sent' });
  } catch (err) {
    next(err);
  }
};

// Public, read-only campaign presentation settings used by the Offers page.
exports.getPublicPromotionCampaign = async (req, res, next) => {
  try {
    const settings = await Settings.findOne().select('promotionCampaign');
    res.json({
      success: true,
      promotionCampaign: {
        ...DEFAULT_PROMOTION_CAMPAIGN,
        ...((settings?.promotionCampaign || {}).toObject?.() || settings?.promotionCampaign || {}),
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getPublicBankTransfer = async (req, res, next) => {
  try {
    const settings = await Settings.findOne().select('bankTransfer');
    res.json({ success: true, bankTransfer: publicBankTransfer(settings) });
  } catch (err) {
    next(err);
  }
};
