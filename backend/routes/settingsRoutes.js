const express = require('express');
const router = express.Router();
const { getPublicPromotionCampaign, getPublicBankTransfer } = require('../controllers/adminController');

router.get('/promotion-campaign', getPublicPromotionCampaign);
router.get('/bank-transfer', getPublicBankTransfer);

module.exports = router;
