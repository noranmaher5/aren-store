import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CurrencyContext = createContext(null);
const DEFAULT_RATE = 3.99;
const supportedCurrencies = ['USD', 'SAR'];

const getRate = () => {
  const rate = Number(process.env.REACT_APP_USD_SAR_RATE || DEFAULT_RATE);
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_RATE;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    const saved = window.localStorage.getItem('aren_currency');
    return supportedCurrencies.includes(saved) ? saved : 'SAR';
  });

  useEffect(() => { window.localStorage.setItem('aren_currency', currency); }, [currency]);

  const value = useMemo(() => {
    const rate = getRate();
    const convert = amount => {
      const numeric = Number(amount);
      if (!Number.isFinite(numeric)) return null;
      return currency === 'SAR' ? numeric * rate : numeric;
    };
    const format = amount => {
      const converted = convert(amount);
      if (converted === null) return '—';
      return currency === 'SAR'
        ? `SAR ${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    return { currency, setCurrency, rate, convert, format, supportedCurrencies };
  }, [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
