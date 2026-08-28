const crypto = require('crypto');

const publicAccount = account => ({
  id: account.id,
  label: account.label || account.bankName || 'تحويل بنكي',
  bankName: account.bankName || '',
  accountName: account.accountName || '',
  accountNumber: account.accountNumber || '',
  iban: account.iban || '',
  currency: account.currency || '',
  notes: account.notes || ''
});

const sanitizeAccounts = (accounts = []) => {
  if (!Array.isArray(accounts)) return [];
  return accounts.slice(0, 12).map(account => ({
    id: String(account.id || crypto.randomUUID()).trim(),
    label: String(account.label || '').trim().slice(0, 80),
    bankName: String(account.bankName || '').trim().slice(0, 80),
    accountName: String(account.accountName || '').trim().slice(0, 120),
    accountNumber: String(account.accountNumber || '').trim().slice(0, 80),
    iban: String(account.iban || '').trim().slice(0, 80),
    currency: String(account.currency || '').trim().toUpperCase().slice(0, 8),
    notes: String(account.notes || '').trim().slice(0, 240),
    enabled: account.enabled !== false
  })).filter(account => account.accountNumber || account.iban || account.accountName);
};

const publicBankTransfer = settings => {
  const bankTransfer = settings?.bankTransfer || {};
  return {
    enabled: bankTransfer.enabled !== false,
    whatsapp: String(bankTransfer.whatsapp || '').trim(),
    instructions: String(bankTransfer.instructions || '').trim(),
    accounts: (bankTransfer.accounts || []).filter(account => account.enabled !== false).map(publicAccount)
  };
};

module.exports = { publicAccount, sanitizeAccounts, publicBankTransfer };
