const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/productController');
const upload = require('../middleware/upload');

router.get('/admin/list', protect, checkPermission('manage_products'), (req, res, next) => {
  req.isAdminProductView = true;
  return ctrl.getProducts(req, res, next);
});
router.get('/', ctrl.getProducts);
router.get('/categories/stats', ctrl.getCategoryStats);
router.get('/:id', ctrl.getProduct);

// product creation with image upload
router.post('/', protect, checkPermission('manage_products'), upload.single('image'), ctrl.createProduct);

// update product with optional image upload
router.put('/:id', protect, checkPermission('manage_products'), upload.single('image'), ctrl.updateProduct);

// delete product
router.delete('/:id', protect, checkPermission('manage_products'), ctrl.deleteProduct);

// add review to product
router.post('/:id/reviews', protect, ctrl.addReview);

// delete review (admin only)
router.delete('/:productId/reviews/:reviewId', protect, checkPermission('manage_products'), ctrl.deleteReview);

module.exports = router;
