const jwt = require('jsonwebtoken');
const User = require('../models/User');


exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'must be logged in' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'user not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'account is disabled' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};


exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'must be logged in' });
    }

  
    if (req.user.role === 'owner' || req.user.role === 'hidden') {
      return next();
    }

    
    if (req.user.permissions && req.user.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `disallowed: insufficient permissions`
    });
  };
};


exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'غير مصرح.' });

    
    const roleHierarchy = { 
        user: 0, 
        editor: 1, 
        admin: 2, 
        manager: 3, 
        'co-owner': 4, 
        owner: 5, 
        hidden: 6 
    };

    const userLevel = roleHierarchy[req.user.role] ?? -1;
    const requiredLevel = Math.min(...roles.map(r => roleHierarchy[r] ?? 99));

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: 'disallowed: insufficient role'
      });
    }

    next();
  };
};