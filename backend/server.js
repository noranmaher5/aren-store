const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const Settings = require('./models/Settings'); // استدعاء الموديل
const { getSitemap } = require('./utils/sitemap');
dotenv.config();

const app = express();
app.set('trust proxy', 1);

// ─── CORS Middleware (Updated & Fixed) ──────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3003',
  'http://localhost:3004',
  'https://zertexkey-2orq.vercel.app'
].map(url => url?.replace(/\/$/, "")); // كود إضافي بيمسح أي / في آخر الرابط أوتوماتيكياً

app.use(cors({
  origin: (origin, callback) => {
    // 1. السماح لو مفيش origin (زي الـ Health check)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, ""); // مسح السلاش من الرابط اللي جاي من المتصفح

    // 2. السماح لو الرابط في القائمة أو ينتهي بـ vercel.app
    const localDevelopmentOrigin = process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(cleanOrigin);
    if (allowedOrigins.includes(cleanOrigin) || cleanOrigin.endsWith('.vercel.app') || localDevelopmentOrigin) {
      callback(null, true);
    } else {
      // السطر ده مهم جداً: هيطبع لك في Railway Logs الرابط المرفوض بالظبط
      console.error(`❌ CORS Rejected: ${origin}`); 
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payment requests. Please try again later.' }
});
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/payments', paymentLimiter);
// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());


// Stripe webhook needs raw body
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
// Avatar images are often sent as base64 data URLs, so the default 10kb limit
// is too small for profile picture updates.
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Reuse one MongoDB connection across Vercel serverless invocations.
let dbConnectionPromise;
const connectDatabase = () => {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose.connect(process.env.MONGODB_URI)
      .then(() => console.log('MongoDB connected'))
      .catch((err) => {
        dbConnectionPromise = undefined;
        throw err;
      });
  }
  return dbConnectionPromise;
};

app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Static Files (Uploaded Images) ─────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/users',    require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders',   require('./routes/orderRoutes'));
app.use('/api/codes',    require('./routes/codeRoutes'));
app.use('/api/cart',     require('./routes/cartRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin',    require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/discounts', require('./routes/discountRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

app.get('/sitemap.xml', getSitemap);

// ─── Health Check المطوّر ─────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    // بنحاول نجيب الإعدادات، لو مش موجودة بننشئ واحدة افتراضية
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ maintenanceMode: false });
    }
    
    res.json({ 
      success: true, 
      maintenanceMode: settings.maintenanceMode, // دي القيمة اللي الجارد بيقرأها
      message: 'Aren Store API is running' 
    });
  } catch (err) {
    res.status(500).json({ success: false, maintenanceMode: false });
  }
});
// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'حجم الصورة أكبر من 5 ميجابايت' });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, message: `${field} already exists` });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    code: err.code,
    message: err.message || 'Internal server error'
  });
});

// ─── Database & Server Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

if (!process.env.VERCEL) connectDatabase()
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
