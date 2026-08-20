const PaymentProvider = require('./paymentProvider');

// Provider selection is intentionally empty until the merchant subscribes to a gateway.
class PaymentService {
  constructor(provider = new PaymentProvider()) { this.provider = provider; }
  createPayment(...args) { return this.provider.createPayment(...args); }
  verifyPayment(...args) { return this.provider.verifyPayment(...args); }
  handleCallback(...args) { return this.provider.handleCallback(...args); }
  refundPayment(...args) { return this.provider.refundPayment(...args); }
}

module.exports = new PaymentService();
