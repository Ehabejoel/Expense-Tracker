// Define supported currencies
type SupportedCurrency = 'FCFA' | 'USD' | 'EUR' | 'GBP' | 'NGN';

// Exchange rates relative to FCFA
const exchangeRates: Record<SupportedCurrency, number> = {
  FCFA: 1,
  USD: 0.00166, // 1 FCFA = 0.00166 USD
};

const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  FCFA: 'FCFA'
} as const;

export const getCurrencySymbol = (currency: keyof typeof currencySymbols): string => {
  return currencySymbols[currency] || currency;
};

export const convertToFCFA = (amount: number, fromCurrency: string): number => {
  if (fromCurrency === 'FCFA') return amount;
  return amount / (exchangeRates[fromCurrency] || 1);
};

export const convertFromFCFA = (amount: number, toCurrency: string): number => {
  if (toCurrency === 'FCFA') return amount;
  return amount * (exchangeRates[toCurrency] || 1);
};

export const convertToUSD = (amount: number, fromCurrency: string): number => {
  // First convert to FCFA
  const amountInFCFA = convertToFCFA(amount, fromCurrency);
  // Then convert from FCFA to USD
  return convertFromFCFA(amountInFCFA, 'USD');
};

export const formatCurrency = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency === 'FCFA' ? 'XOF' : currency,
    currencyDisplay: 'symbol',
  });
  
  if (currency === 'FCFA') {
    return amount.toLocaleString() + ' FCFA';
  }
  
  return formatter.format(amount);
};

export const groupReservesByCurrency = (reserves: any[]) => {
  return reserves.reduce((acc, reserve) => {
    const currency = reserve.currency;
    if (!acc[currency]) {
      acc[currency] = 0;
    }
    acc[currency] += reserve.balance;
    return acc;
  }, {});
};
