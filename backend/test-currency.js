const assert = require('assert');
const { convertPrice, getUsdSarRate } = require('./utils/currency');

assert.equal(getUsdSarRate(), 3.75);
assert.equal(convertPrice(29.99, 'USD', 'USD'), 29.99);
assert.equal(Number(convertPrice(29.99, 'USD', 'SAR').toFixed(2)), 112.46);
assert.equal(Number(convertPrice(112.4625, 'SAR', 'USD').toFixed(2)), 29.99);
assert.equal(convertPrice('bad', 'USD', 'SAR'), null);
console.log('currency conversion tests passed');
