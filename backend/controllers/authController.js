const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;
  res.status(statusCode).json({ success: true, token, user });
};

// @POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // First user becomes owner
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'owner' : 'user';

    const user = await User.create({ name, email, password, role, phone: phone || null });

    // Welcome email (non-blocking)
    emailService.sendWelcomeEmail(user).catch(console.error);

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'orders',
      select: 'orderNumber totalAmount status createdAt paymentMethod currency items',
      populate: {
        path: 'items.product',
        select: 'name image category'
      }
    }).populate('wishlist', 'name image price category slug isActive');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/auth/update-password
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @PUT /api/auth/update-profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;

    // Only admin and higher can update avatar
    const roleLevel = { user:0, editor:1, admin:2, manager:3, 'co-owner':4, owner:5, hidden:6 };
    if (avatar !== undefined && (roleLevel[req.user.role] ?? 0) >= 1) {
      updates.avatar = avatar;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id, updates, { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// @GET /api/auth/wishlist
exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist', 'name image price category slug isActive');
    res.json({ success: true, wishlist: user?.wishlist || [] });
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/wishlist/:productId
exports.toggleWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const productId = req.params.productId;
    const exists = user.wishlist.some(id => id.toString() === productId);

    if (exists) {
      user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    } else {
      user.wishlist.push(productId);
    }

    await user.save();
    await user.populate('wishlist', 'name image price category slug isActive');

    res.json({
      success: true,
      inWishlist: !exists,
      wishlist: user.wishlist
    });
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email address.' });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
      res.status(200).json({ success: true, message: 'Token sent to email!' });
    } catch (err) {
      console.error('Email send error:', err);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'There was an error sending the email. Try again later!' });
    }
  } catch (err) {
    next(err);
  }
};

// @PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token is invalid or has expired' });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};
