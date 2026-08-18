const { fulfillmentError, ERROR_CODES } = require('./fulfillmentErrors');

const STATUS_MAP = Object.freeze({
  active: 'WAITING_SUPPLIER',
  paid: 'WAITING_SUPPLIER',
  processing: 'PROCESSING',
  completed: 'COMPLETED',
  failed: 'FAILED'
});

const normalizeFoxReloadOrderFields = (requiredFields, providedFields = {}) => {
  if (requiredFields === undefined || requiredFields === null) return {};
  if (!Array.isArray(requiredFields)) {
    throw fulfillmentError(ERROR_CODES.MANUAL_REVIEW_REQUIRED, 'FoxReload required fields schema is unknown');
  }

  return requiredFields.reduce((result, field) => {
    const name = typeof field === 'string' ? field : field?.name;
    if (!name || !Object.prototype.hasOwnProperty.call(providedFields, name)) {
      throw fulfillmentError(ERROR_CODES.FOXRELOAD_CUSTOMER_DATA_REQUIRED, 'Required FoxReload customer data is missing');
    }
    const value = providedFields[name];
    if (value === undefined || value === null || String(value).trim() === '') {
      throw fulfillmentError(ERROR_CODES.FOXRELOAD_CUSTOMER_DATA_REQUIRED, 'Required FoxReload customer data is empty');
    }
    result[name] = value;
    return result;
  }, {});
};

const buildFoxReloadOrderPayload = ({ items, requiredFieldsByProductId = {}, customerFieldsByProductId = {} } = {}) => {
  if (!Array.isArray(items) || items.length < 1 || items.length > 10) {
    throw fulfillmentError(ERROR_CODES.MANUAL_REVIEW_REQUIRED, 'FoxReload orders must contain 1 to 10 items');
  }

  return {
    items: items.map(item => {
      const itemId = String(item?.supplierProductId || item?.itemId || '');
      const quantity = Number(item?.quantity);
      if (!itemId || !Number.isInteger(quantity) || quantity <= 0) {
        throw fulfillmentError(ERROR_CODES.MANUAL_REVIEW_REQUIRED, 'FoxReload item ID and quantity are invalid');
      }
      return {
        itemId,
        quantity,
        ...normalizeFoxReloadOrderFields(
          requiredFieldsByProductId[itemId],
          customerFieldsByProductId[itemId]
        )
      };
    })
  };
};

const normalizeStatus = status => {
  const normalized = String(status || '').toLowerCase();
  if (!STATUS_MAP[normalized]) {
    throw fulfillmentError(ERROR_CODES.FOXRELOAD_UNKNOWN_STATUS, 'FoxReload returned an unknown order status');
  }
  return STATUS_MAP[normalized];
};

const mapSupplierOrderToJob = order => {
  const supplierOrderId = String(order?.id || '');
  if (!supplierOrderId) {
    throw fulfillmentError(ERROR_CODES.MANUAL_REVIEW_REQUIRED, 'FoxReload order ID is missing');
  }
  return {
    supplierOrderId,
    supplierStatus: normalizeStatus(order.status)
  };
};

const normalizeDelivery = response => {
  if (normalizeStatus(response?.status) !== 'COMPLETED') {
    throw fulfillmentError(ERROR_CODES.FOXRELOAD_DELIVERY_UNKNOWN, 'FoxReload delivery is not completed');
  }

  const item = Array.isArray(response.items) ? response.items[0] : null;
  if (!item || item.error || !Array.isArray(item.externalData) || item.externalData.length === 0) {
    throw fulfillmentError(ERROR_CODES.FOXRELOAD_DELIVERY_UNKNOWN, 'FoxReload delivery data is unavailable');
  }

  return {
    type: 'code',
    values: item.externalData.map(value => String(value)),
    ...(item.userGuide ? { userGuide: String(item.userGuide) } : {}),
    testOnly: false
  };
};

const normalizeError = error => {
  if (error?.code && String(error.code).startsWith('FOXRELOAD_')) return error;
  if (error?.name === 'AbortError' || /timed out/i.test(error?.message || '')) {
    return fulfillmentError(ERROR_CODES.FOXRELOAD_TIMEOUT, 'FoxReload request timed out');
  }
  if (error?.status === 401 || error?.status === 403) {
    return fulfillmentError(ERROR_CODES.FOXRELOAD_AUTH_FAILED, 'FoxReload authentication failed');
  }
  if (error?.status === 429) {
    return fulfillmentError(ERROR_CODES.FOXRELOAD_RATE_LIMITED, 'FoxReload rate limit reached');
  }
  return fulfillmentError(ERROR_CODES.FOXRELOAD_REQUEST_FAILED, 'FoxReload request failed');
};

const pollOrder = async ({ getOrder, orderId, maxAttempts = 5, sleep = async () => {} }) => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let response;
    try {
      response = await getOrder(orderId);
    } catch (error) {
      throw normalizeError(error);
    }
    const status = normalizeStatus(response?.status);
    if (status === 'COMPLETED') return response;
    if (status === 'FAILED') throw fulfillmentError(ERROR_CODES.FOXRELOAD_REQUEST_FAILED, 'FoxReload order failed');
    if (attempt < maxAttempts - 1) await sleep();
  }
  throw fulfillmentError(ERROR_CODES.FOXRELOAD_UNKNOWN_STATUS, 'FoxReload order did not complete within the polling limit');
};

module.exports = {
  normalizeStatus,
  mapSupplierOrderToJob,
  normalizeDelivery,
  normalizeError,
  normalizeFoxReloadOrderFields,
  buildFoxReloadOrderPayload,
  pollOrder
};
