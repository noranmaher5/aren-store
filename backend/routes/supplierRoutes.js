const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const controller = require('../controllers/supplierController');

router.use(protect, checkPermission('manage_products'));
router.get('/:supplier/catalog/:catalogType/categories', controller.getCatalogCategories);
router.get('/:supplier/catalog/:catalogType', controller.getSpecialCatalog);
router.get('/:supplier/catalog/:catalogType/:categoryId/offers', controller.getCatalogOffers);
router.get('/:supplier/categories', controller.getCategories);
router.get('/:supplier/products/search', controller.searchProducts);
router.get('/:supplier/products/:productId', controller.getProduct);
router.post('/:supplier/products/:productId/import', controller.importProduct);
router.put('/:supplier/products/:productId/sync', controller.importProduct);
router.get('/:supplier/balance', controller.getBalance);

module.exports = router;
