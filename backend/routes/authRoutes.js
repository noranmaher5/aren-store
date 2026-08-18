// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.put('/reset-password/:token', ctrl.resetPassword);
router.get('/me', auth.protect, ctrl.getMe);
router.get('/wishlist', auth.protect, ctrl.getWishlist);
router.post('/wishlist/:productId', auth.protect, ctrl.toggleWishlist);
router.put('/update-password', auth.protect, ctrl.updatePassword);
router.put('/update-profile', auth.protect, ctrl.updateProfile);

module.exports = router;
