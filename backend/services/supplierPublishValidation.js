const SUPPLIERS = new Set(['foxreload', 'fazercards']);

const validateSupplierProductPublish = product => {
  if (!SUPPLIERS.has(String(product?.supplier || '').toLowerCase())) return { valid: true, errors: [] };

  const errors = [];
  if (!product.supplier) errors.push('MISSING_SUPPLIER');
  if (!String(product.supplierProductId || '').trim()) errors.push('MISSING_SUPPLIER_PRODUCT_ID');
  if (!String(product.category || '').trim()) errors.push('MISSING_CATEGORY');

  const price = Number(product.price);
  if (!Number.isFinite(price) || price <= 0) errors.push('INVALID_SELLING_PRICE');

  const status = String(product.supplierAvailability?.status || '').toUpperCase();
  const quantity = product.supplierAvailability?.quantity;
  if (status !== 'AVAILABLE' || quantity === null || quantity === undefined || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
    errors.push(status === 'UNKNOWN' || !status ? 'UNKNOWN_SUPPLIER_AVAILABILITY' : 'SUPPLIER_NOT_AVAILABLE');
  }

  return { valid: errors.length === 0, errors };
};

module.exports = { validateSupplierProductPublish };
