const express = require('express');
const router = express.Router();
const paymentUnavailable = (req, res) => res.status(501).json({
  success: false,
  code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
  message: 'Payment gateway integration is pending'
});

router.get('/config', (req, res) => res.json({ success: true, enabled: false, provider: null }));
router.post('/paypal/create', paymentUnavailable);
router.post('/paypal/capture', paymentUnavailable);
router.post('/create-payment-intent', paymentUnavailable);
router.post('/confirm/:orderId', paymentUnavailable);
router.post('/webhook', paymentUnavailable);

module.exports = router;
