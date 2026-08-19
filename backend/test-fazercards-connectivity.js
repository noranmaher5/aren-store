require('dotenv').config();

const { getSupplier } = require('./services/suppliers');

const classify = error => {
  if (error?.code === 'ETIMEDOUT') return 'NETWORK_ERROR';
  if (error?.category === 'TLS_ERROR') return 'TLS_ERROR';
  if (error?.status === 401 || error?.status === 403) return 'AUTH_ERROR';
  if (error?.category === 'INVALID_JSON') return 'INVALID_JSON';
  if (error?.category === 'HTTP_ERROR') return 'HTTP_ERROR';
  if (error?.category === 'NETWORK_ERROR') return 'NETWORK_ERROR';
  if (/not configured/i.test(error?.message || '')) return 'CONFIGURATION_ERROR';
  return 'FAIL';
};

(async () => {
  try {
    const service = getSupplier('fazercards');
    await service.getAccount();
    console.log(JSON.stringify({ status: 'PASS', endpoint: '/me', authentication: 'PASS', tls: 'NORMAL_VERIFICATION' }));
  } catch (error) {
    console.log(JSON.stringify({ status: classify(error), endpoint: '/me', message: error.message }));
    process.exitCode = 1;
  }
})();
