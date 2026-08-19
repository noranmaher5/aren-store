const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { getEffectivePrice } = require('../utils/promotion');
const { parseQuantity } = require('../utils/quantity');

const isSupplierProduct = product => ['foxreload', 'fazercards'].includes(product?.supplier);
const getAvailableQuantity = product => {
  if (!isSupplierProduct(product)) return Number(product?.stock || 0);
  const quantity = product?.supplierAvailability?.quantity;
  return quantity === null || quantity === undefined || quantity === '' ? null : Number(quantity);
};
const isUnavailable = product => {
  const available = getAvailableQuantity(product);
  if (isSupplierProduct(product)) return available === null || !Number.isFinite(available) || available <= 0;
  return available <= 0 || product.isOutOfStock;
};


const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

// @GET /api/cart
exports.getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    let changed = false;
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const price = getEffectivePrice(product).price;
        if (item.price !== price) { item.price = price; changed = true; }
      }
    }
    if (changed) await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

// @POST /api/cart/add
exports.addItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const parsedQuantity = parseQuantity(quantity);
    if (!parsedQuantity) {
      return res.status(400).json({ success: false, message: 'Quantity must be a whole number between 1 and 100' });
    }

    const product = await Product.findById(productId)
      .select('+supplierAvailability.quantity +supplierAvailability.status');
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const cart = await getOrCreateCart(req.user.id);
    const effectivePrice = getEffectivePrice(product).price;

    if (!product.isUnlimited) {
      const available = getAvailableQuantity(product);
      if (isUnavailable(product)) {
        return res.status(400).json({ success: false, message: 'Product is out of stock' });
      }

      const currentInCart = cart.items.find(i => i.product.toString() === productId)?.quantity || 0;
      if (currentInCart + parsedQuantity > available) {
        return res.status(400).json({
          success: false,
        message: `Only ${available - currentInCart} item(s) left in stock`
        });
      }
    }

    const existingIndex = cart.items.findIndex(
      i => i.product.toString() === productId
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += parsedQuantity;
    } else {
      cart.items.push({
        product:  product._id,
        name:     product.name,
        image:    product.image,
        price:    effectivePrice,
        category: product.category,
        quantity: parsedQuantity
      });
    }

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

// @PUT /api/cart/update
exports.updateItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const parsedQuantity = parseQuantity(quantity);
    if (!parsedQuantity) {
      return res.status(400).json({ success: false, message: 'Quantity must be a whole number between 1 and 100' });
    }

    const product = await Product.findById(productId)
      .select('+supplierAvailability.quantity +supplierAvailability.status');
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const cart = await getOrCreateCart(req.user.id);
    const item = cart.items.find(i => i.product.toString() === productId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    item.price = getEffectivePrice(product).price;

    if (!product.isUnlimited) {
      const available = getAvailableQuantity(product);
      if (isUnavailable(product)) {
        return res.status(400).json({ success: false, message: 'Product is out of stock' });
      }
      if (parsedQuantity > available) {
        return res.status(400).json({
          success: false,
          message: `Only ${available} item(s) available`
        });
      }
    }

    item.quantity = parsedQuantity;
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

// @DELETE /api/cart/remove/:productId
exports.removeItem = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    cart.items = cart.items.filter(
      i => i.product.toString() !== req.params.productId
    );
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

// @DELETE /api/cart/clear
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    cart.items = [];
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};
