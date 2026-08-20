class PaymentProvider {
  async createPayment() { throw new Error('Payment provider is not configured'); }
  async verifyPayment() { throw new Error('Payment provider is not configured'); }
  async handleCallback() { throw new Error('Payment provider is not configured'); }
  async refundPayment() { throw new Error('Payment provider is not configured'); }
}

module.exports = PaymentProvider;
