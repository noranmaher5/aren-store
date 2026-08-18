const express = require('express');
const router = express.Router();
const { getPublicPromotionCampaign } = require('../controllers/adminController');

router.get('/promotion-campaign', getPublicPromotionCampaign);

module.exports = router;
