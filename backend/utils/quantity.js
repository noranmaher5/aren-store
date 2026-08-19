const MAX_ITEM_QUANTITY = 100;

const parseQuantity = (value) => {
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_ITEM_QUANTITY
    ? quantity
    : null;
};

module.exports = { MAX_ITEM_QUANTITY, parseQuantity };
