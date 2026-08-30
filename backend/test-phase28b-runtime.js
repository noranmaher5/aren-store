require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Order = require('./models/Order');
const Product = require('./models/Product');
const User = require('./models/User');
const Cart = require('./models/Cart');
const Settings = require('./models/Settings');
const orderController = require('./controllers/orderController');
const paymentService = require('./services/payments/paymentService');
const fulfillmentConfig = require('./config/fulfillment');
const { getEffectivePrice } = require('./utils/promotion');

const marker = `phase28b-runtime-${Date.now()}`;
let temporaryUserIds = [];
let createdOrderIds = [];
let httpServer;
let runtimePaymentAccountId = '';
let runtimeReferralCode = '';

const invoke = (handler, req) => new Promise((resolve, reject) => {
  const response = {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; resolve(this); return this; }
  };
  handler(req, response, reject);
});

const request = (user, items, key) => ({
  user,
  body: { items, deliveryMethod: 'email', deliveryContact: user.email, paymentAccountId: runtimePaymentAccountId, referralCode: runtimeReferralCode },
  get(name) { return name.toLowerCase() === 'idempotency-key' ? key : undefined; }
});

const expectRejected = async (user, items, key, code) => {
  try {
    await invoke(orderController.createOrder, request(user, items, key));
    assert.fail(`expected ${code} rejection`);
  } catch (error) {
    assert.equal(error.code, code);
  }
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  assert.equal(fulfillmentConfig.supplierFulfillmentEnabled, false);

  const product = await Product.findOne({ isActive: true, price: { $gt: 0 }, isUnlimited: false, stock: { $gte: 2 }, supplier: { $in: ['manual', 'none'] } })
    .select('+supplierAvailability.quantity +supplierAvailability.status');
  assert(product, 'No finite-stock product with at least two units is available for runtime verification');
  const paymentSettings = await Settings.findOne().select('bankTransfer').lean();
  runtimePaymentAccountId = paymentSettings?.bankTransfer?.accounts?.[0]?.id || '';

  const customerA = await User.create({ name: marker + '-A', email: `${marker}-a@example.invalid`, password: 'Phase28B-runtime-password' });
  const customerB = await User.create({ name: marker + '-B', email: `${marker}-b@example.invalid`, password: 'Phase28B-runtime-password' });
  runtimeReferralCode = marker.replace(/[^a-z0-9]/gi, '').slice(-12).toUpperCase();
  const admin = await User.create({ name: marker + '-admin', email: `${marker}-admin@example.invalid`, password: 'Phase28B-runtime-password', role: 'admin', referralCode: runtimeReferralCode });
  temporaryUserIds = [customerA._id, customerB._id, admin._id];
  const item = { productId: product._id.toString(), quantity: 1, price: 0.01, totalPrice: 0.01 };

  process.env.VERCEL = '1';
  const app = require('./server');
  httpServer = await new Promise(resolve => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
  const address = httpServer.address();
  const httpResponse = await fetch(`http://127.0.0.1:${address.port}/api/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt.sign({ id: customerA._id }, process.env.JWT_SECRET)}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `${marker}-http`
    },
    body: JSON.stringify({ items: [item], deliveryMethod: 'email', deliveryContact: customerA.email, paymentAccountId: runtimePaymentAccountId, referralCode: runtimeReferralCode })
  });
  const httpBody = await httpResponse.json();
  assert.equal(httpResponse.status, 201);
  assert(httpBody.order.orderNumber);

  const first = await invoke(orderController.createOrder, request(customerA, [item], `${marker}-same`));
  assert.equal(first.statusCode, 201);
  const order = await Order.findById(first.body.order._id);
  assert(order && order.user.equals(customerA._id));
  assert(order.orderNumber && order.orderNumber.startsWith('DGV-'));
  assert.equal(order.items[0].quantity, 1);
  assert.equal(order.items[0].unitPrice, getEffectivePrice(product).price);
  assert.equal(order.totalAmount, getEffectivePrice(product).price);
  assert.equal(order.paymentStatus, 'PENDING');
  assert.equal(order.fulfillmentStatus, 'NOT_STARTED');
  assert.equal(String(order.referralEmployee), String(admin._id));
  assert.equal(order.referralCode, runtimeReferralCode);
  assert.equal(first.body.order.supplierOrderId, undefined);
  assert.equal(first.body.order.paymentDetails, undefined);

  const repeated = await invoke(orderController.createOrder, request(customerA, [item], `${marker}-same`));
  assert.equal(repeated.statusCode, 200);
  assert.equal(String(repeated.body.order._id), String(order._id));
  assert.equal(await Order.countDocuments({ user: customerA._id, idempotencyKey: `${marker}-same` }), 1);

  const independent = await invoke(orderController.createOrder, request(customerA, [item], `${marker}-different`));
  assert.equal(independent.statusCode, 201);
  assert.notEqual(String(independent.body.order._id), String(order._id));

  await expectRejected(customerA, [{ productId: product._id, quantity: 0 }], `${marker}-zero`, 'INVALID_QUANTITY');
  await expectRejected(customerA, [{ productId: product._id, quantity: -1 }], `${marker}-negative`, 'INVALID_QUANTITY');
  await expectRejected(customerA, [{ productId: product._id, quantity: product.stock + 1 }], `${marker}-excess`, 'PRODUCT_UNAVAILABLE');

  const own = await invoke(orderController.getOrder, { user: customerA, params: { id: order._id.toString() } });
  assert.equal(own.statusCode, 200);
  const cross = await invoke(orderController.getOrder, { user: customerB, params: { id: order._id.toString() } });
  assert.equal(cross.statusCode, 403);
  const adminOrders = await invoke(orderController.getAllOrders, { user: admin, query: { search: order.orderNumber, paymentStatus: 'PENDING' } });
  assert.equal(adminOrders.statusCode, 200);
  assert(adminOrders.body.orders.some(found => String(found._id) === String(order._id)));

  await assert.rejects(() => orderController.fulfillOrder(order._id), error => error.code === 'FULFILLMENT_DISABLED');
  await assert.rejects(() => paymentService.createPayment(), /not configured/i);

  createdOrderIds = await Order.find({ user: { $in: temporaryUserIds }, orderNumber: { $regex: '^DGV-' } }).distinct('_id');
  await Order.deleteMany({ _id: { $in: createdOrderIds } });
  await Cart.deleteMany({ user: { $in: [customerA._id, customerB._id, admin._id] } });
  await User.deleteMany({ _id: { $in: [customerA._id, customerB._id, admin._id] } });
  console.log(JSON.stringify({ passed: true, marker, productModified: false, supplierOrders: 0, supplierPayments: 0, testOrdersCreated: createdOrderIds.length }));
})().catch(error => {
  console.error(JSON.stringify({ passed: false, name: error.name, message: error.message, code: error.code }));
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState === 1 && temporaryUserIds.length) {
    await Order.deleteMany({ user: { $in: temporaryUserIds }, orderNumber: { $regex: '^DGV-' } });
    await Cart.deleteMany({ user: { $in: temporaryUserIds } });
    await User.deleteMany({ _id: { $in: temporaryUserIds } });
  }
  if (httpServer) await new Promise(resolve => httpServer.close(resolve));
  await mongoose.disconnect();
});
