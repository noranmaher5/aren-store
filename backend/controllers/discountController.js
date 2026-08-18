const DiscountCode = require('../models/DiscountCode');

// ── Admin:  create code ───────────────────────────────────────────────────────
exports.createCode = async (req, res, next) => {
  try {
    const { code, description, type, value, maxUses, maxUsesPerUser, expiresAt } = req.body;

    if (!code || !value) {
      return res.status(400).json({ success: false, message: 'Code and value are required' });
    }

    const existing = await DiscountCode.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Code already exists' });
    }

    const discount = await DiscountCode.create({
      code: code.toUpperCase(),
      description,
      type: type || 'percentage',
      value,
      maxUses: maxUses || 0,
      maxUsesPerUser: maxUsesPerUser || 1,
      expiresAt: expiresAt || null,
      createdBy: req.user._id,
    });

    res.json({ success: true, discount });
  } catch (err) {
    next(err);
  }
};

// ── Admin: find all codes ────────────────────────────────────────────────────────────────
exports.getAllCodes = async (req, res, next) => {
  try {
    const codes = await DiscountCode.find()
      .populate('createdBy', 'name')
      .populate('usedBy.user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, codes });
  } catch (err) {
    next(err);
  }
};

// ── Admin: activate/deactivate code ─────────────────────────────────────────────────────────────────
exports.toggleCode = async (req, res, next) => {
  try {
    const code = await DiscountCode.findById(req.params.id);
    if (!code) return res.status(404).json({ success: false, message: 'Code not found' });

    code.isActive = !code.isActive;
    await code.save();

    res.json({ success: true, code });
  } catch (err) {
    next(err);
  }
};

// ── Admin: remove code ─────────────────────────────────────────────────────────────────
exports.deleteCode = async (req, res, next) => {
  try {
    await DiscountCode.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ── User: check code ──────────────────────────────────────────────────────────
exports.validateCode = async (req, res, next) => {
  try {
    const { code, totalAmount } = req.body;

    const discount = await DiscountCode.findOne({ code: code.toUpperCase() });

    if (!discount || !discount.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive discount code' });
    }

    
    if (discount.expiresAt && new Date() > discount.expiresAt) {
      return res.status(400).json({ success: false, message: 'Discount code has expired' });
    }

   
    if (discount.maxUses > 0 && discount.usedCount >= discount.maxUses) {
      return res.status(400).json({ success: false, message: 'Discount code has reached its usage limit' });
    }

   
    const userUsageCount = discount.usedBy.filter(
      u => u.user.toString() === req.user.id
    ).length;

    if (userUsageCount >= discount.maxUsesPerUser) {
      return res.status(400).json({ success: false, message: 'You have already used this discount code' });
    }

    
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (totalAmount * discount.value) / 100;
    } else {
      discountAmount = Math.min(discount.value, totalAmount);
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    res.json({
      success: true,
      discount: {
        _id: discount._id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        description: discount.description,
      },
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
    });
  } catch (err) {
    next(err);
  }
};