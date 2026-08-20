const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/orderController');

router.get('/my', protect, ctrl.getMyOrders);
router.post('/', protect, ctrl.createOrder);
router.get('/', protect, checkPermission('manage_orders'), ctrl.getAllOrders);
router.get('/:id', protect, ctrl.getOrder);
router.put('/:id/status', protect, checkPermission('manage_orders'), ctrl.updateOrderStatus);
router.post('/:id/confirm-and-send', protect, checkPermission('manage_orders'), ctrl.confirmAndSend); 

module.exports = router;
