// ─── Order Routes ─────────────────────────────────────────────────────────────
const express = require('express');

const orderRouter = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const orderCtrl = require('../controllers/orderController');
const { acceptPaymentProof } = require('../middleware/upload');

orderRouter.get('/my', protect, orderCtrl.getMyOrders);
orderRouter.get('/', protect, checkPermission('manage_orders'), orderCtrl.getAllOrders);
orderRouter.post('/payment-proof/:id', protect, acceptPaymentProof, orderCtrl.submitPaymentProof);
orderRouter.post('/:id/payment-proof', protect, acceptPaymentProof, orderCtrl.submitPaymentProof);
orderRouter.post('/:id/confirm-payment', protect, checkPermission('manage_orders'), orderCtrl.confirmManualPayment);
orderRouter.get('/:id', protect, orderCtrl.getOrder);
orderRouter.put('/:id/status', protect, checkPermission('manage_orders'), orderCtrl.updateOrderStatus);

// ─── Code Routes ──────────────────────────────────────────────────────────────
const codeRouter = express.Router();
const codeCtrl = require('../controllers/codeController');

codeRouter.post('/bulk', protect, checkPermission('manage_products'), codeCtrl.addCodesBulk);
codeRouter.get('/stats', protect, checkPermission('manage_products'), codeCtrl.getCodeStats);
codeRouter.get('/product/:productId', protect, checkPermission('manage_products'), codeCtrl.getProductCodes);
codeRouter.delete('/:id', protect, checkPermission('manage_products'), codeCtrl.deleteCode);

// ─── Payment Routes ───────────────────────────────────────────────────────────
const paymentRouter = express.Router();
const paymentCtrl = require('../controllers/paymentController');

paymentRouter.get('/config', paymentCtrl.getConfig);
paymentRouter.post('/create-payment-intent', protect, paymentCtrl.createPaymentIntent);
paymentRouter.post('/confirm/:orderId', protect, paymentCtrl.confirmPayment);
paymentRouter.post('/webhook', paymentCtrl.stripeWebhook);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
const adminRouter = express.Router();
const adminCtrl = require('../controllers/adminController');

adminRouter.use(protect, authorize('admin'));
adminRouter.get('/dashboard', adminCtrl.getDashboardStats);
adminRouter.get('/users', checkPermission('manage_users'), adminCtrl.getUsers);
adminRouter.put('/users/:id/role', checkPermission('manage_users'), adminCtrl.updateUserRole);
adminRouter.put('/users/:id/toggle-status', checkPermission('manage_users'), adminCtrl.toggleUserStatus);

// ─── User Routes ──────────────────────────────────────────────────────────────
const userRouter = express.Router();
userRouter.use(protect);
userRouter.get('/me', require('../controllers/authController').getMe);

// ─── Notification Routes ──────────────────────────────────────────────────────
const notificationRouter = require('./notificationRoutes');

module.exports = { orderRouter, codeRouter, paymentRouter, adminRouter, userRouter, notificationRouter };
