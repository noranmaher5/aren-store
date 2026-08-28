const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/orderController');
const { acceptPaymentProof } = require('../middleware/upload');

router.get('/my', protect, ctrl.getMyOrders);
router.post('/', protect, ctrl.createOrder);
router.get('/', protect, checkPermission('manage_orders'), ctrl.getAllOrders);
router.post('/payment-proof/:id', protect, acceptPaymentProof, ctrl.submitPaymentProof);
router.post('/:id/payment-proof', protect, acceptPaymentProof, ctrl.submitPaymentProof);
router.post('/:id/confirm-payment', protect, checkPermission('manage_orders'), ctrl.confirmManualPayment);
router.put('/:id/status', protect, checkPermission('manage_orders'), ctrl.updateOrderStatus);
router.post('/:id/confirm-and-send', protect, checkPermission('manage_orders'), ctrl.confirmAndSend);
router.get('/:id', protect, ctrl.getOrder); 

module.exports = router;
