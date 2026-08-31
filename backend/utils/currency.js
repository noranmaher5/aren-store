const SUPPORTED_CURRENCIES = {
  USD: { code: 'USD', symbol: '$' },
  SAR: { code: 'SAR', symbol: 'ر.س' }
};

const getUsdSarRate = () => {
  const rate = Number(process.env.USD_SAR_RATE || 3.99);
  return Number.isFinite(rate) && rate > 0 ? rate : 3.99;
};

const convertPrice = (amount, fromCurrency = 'USD', toCurrency = 'USD') => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return null;
  const from = String(fromCurrency).toUpperCase();
  const to = String(toCurrency).toUpperCase();
  if (!SUPPORTED_CURRENCIES[from] || !SUPPORTED_CURRENCIES[to]) return null;
  const usd = from === 'USD' ? value : value / getUsdSarRate();
  return to === 'USD' ? usd : usd * getUsdSarRate();
};

module.exports = { SUPPORTED_CURRENCIES, getUsdSarRate, convertPrice };
