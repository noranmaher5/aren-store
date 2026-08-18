const FoxReloadService = require('./foxReload.service');
const FazerCardsService = require('./fazerCards.service');

const suppliers = {
  foxreload: new FoxReloadService(),
  fazercards: new FazerCardsService()
};

const getSupplier = (name) => {
  const supplier = suppliers[name];
  if (!supplier) throw new Error(`Unsupported supplier: ${name}`);
  return supplier;
};

module.exports = { suppliers, getSupplier };
