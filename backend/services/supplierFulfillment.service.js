const Order = require('../models/Order');
const { createPendingJob } = require('./fulfillment/fulfillment.service');

const isManualDelivery = (product) =>
  product.deliveryType === 'manual' ||
  product.availabilityType === 'on_demand' ||
  product.availabilityType === 'scheduled' ||
  product.manualRequest?.enabled === true;

const isSupplierProduct = (product) =>
  ['foxreload', 'fazercards'].includes(product.supplier);

/**
 * Classifies a paid order without calling a supplier using an undocumented
 * order contract. Supplier ordering is deliberately isolated here so the
 * confirmed payload/response contract can be added without touching payment
 * or legacy DigitalCode fulfillment.
 */
exports.preparePaidOrder = async (orderId) => {
  const order = await Order.findById(orderId).populate('items.product');
  if (!order) throw new Error('Order not found');

  const products = order.items.map(item => item.product).filter(Boolean);
  const hasManual = products.some(isManualDelivery);
  const suppliers = [...new Set(products.filter(isSupplierProduct).map(product => product.supplier))];

  if (suppliers.length > 1) {
    order.status = 'pending_fulfillment';
    order.fulfillmentType = 'manual_request';
    order.fulfillmentMetadata = {
      reason: 'mixed_supplier_order_requires_review',
      suppliers,
      preparedAt: new Date()
    };
    await order.save();
    return order;
  }

  if (hasManual) {
    order.status = 'pending_fulfillment';
    order.fulfillmentType = 'manual_request';
    order.supplier = suppliers[0];
    order.fulfillmentMetadata = {
      reason: 'manual_or_on_demand_product',
      preparedAt: new Date()
    };
    await order.save();
    return order;
  }

  if (suppliers.length === 1) {
    order.status = 'pending_fulfillment';
    order.fulfillmentType = 'supplier';
    order.supplier = suppliers[0];
    order.supplierDeliveryStatus = 'awaiting_supplier_contract';
    order.fulfillmentMetadata = {
      reason: 'supplier_order_contract_required',
      preparedAt: new Date()
    };
    await order.save();

    for (const item of order.items) {
      if (item.product?.supplier !== suppliers[0]) continue;
      await createPendingJob(order._id, item._id);
    }
  }

  return order;
};

exports.isManualDelivery = isManualDelivery;
exports.isSupplierProduct = isSupplierProduct;
