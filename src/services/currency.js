/**
 * Currency & Exchange Rate Service
 * Provides international currency formatting via Intl.NumberFormat and
 * optional live conversion using open exchange rate feeds.
 */

// Major supported travel currencies (India regional default first)
export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India' },
  { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' },
  { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union' },
  { code: 'GBP', symbol: '£', name: 'British Pound', country: 'United Kingdom' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'Japan' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', country: 'Canada' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', country: 'Switzerland' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', country: 'Singapore' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', country: 'United Arab Emirates' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', country: 'Thailand' },
];

// In-memory cache for live exchange rates
let exchangeRatesCache = {
  base: 'USD',
  rates: null,
  fetchedAt: null,
};

/**
 * Fetch live exchange rates from Open Exchange API
 * If unavailable, returns null (never invent rates).
 */
export async function getLiveExchangeRates() {
  const oneHour = 60 * 60 * 1000;
  if (
    exchangeRatesCache.rates &&
    exchangeRatesCache.fetchedAt &&
    Date.now() - exchangeRatesCache.fetchedAt < oneHour
  ) {
    return exchangeRatesCache.rates;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.result === 'success' && data.rates) {
      exchangeRatesCache = {
        base: 'USD',
        rates: data.rates,
        fetchedAt: Date.now(),
      };
      return data.rates;
    }
    return null;
  } catch (err) {
    console.warn('Live exchange rate service unavailable:', err.message);
    return null;
  }
}

/**
 * Format currency amount using Intl.NumberFormat
 * @param {number} amount
 * @param {string} currencyCode
 * @param {string} [locale]
 */
export function formatCurrency(amount, currencyCode = 'INR', locale = undefined) {
  const num = Number(amount) || 0;
  const curr = (currencyCode || 'INR').toUpperCase();
  const userLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-IN');

  try {
    const formatter = new Intl.NumberFormat(userLocale, {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: curr === 'JPY' ? 0 : 2,
      minimumFractionDigits: curr === 'JPY' ? 0 : 2,
    });
    return formatter.format(num);
  } catch {
    // Fallback if browser does not support specific currency
    const sym = SUPPORTED_CURRENCIES.find((c) => c.code === curr)?.symbol || curr;
    return `${sym} ${num.toLocaleString(userLocale, { minimumFractionDigits: 2 })}`;
  }
}

/**
 * Convert an amount from one currency to another using verified exchange rates.
 * Returns null if rates cannot be found (never invent conversion rates).
 */
export async function convertCurrency(amount, fromCode, toCode) {
  const num = Number(amount) || 0;
  const from = (fromCode || 'USD').toUpperCase();
  const to = (toCode || 'USD').toUpperCase();

  if (from === to) {
    return {
      convertedAmount: num,
      rate: 1,
      isApproximate: false,
      timestamp: Date.now(),
    };
  }

  const rates = await getLiveExchangeRates();
  if (!rates || !rates[from] || !rates[to]) {
    return null; // Data unavailable, caller must show original currency
  }

  // Convert via USD base: amount / rates[from] * rates[to]
  const inUSD = num / rates[from];
  const targetAmount = inUSD * rates[to];
  const rate = rates[to] / rates[from];

  return {
    convertedAmount: parseFloat(targetAmount.toFixed(2)),
    rate: parseFloat(rate.toFixed(4)),
    isApproximate: true,
    timestamp: exchangeRatesCache.fetchedAt || Date.now(),
  };
}
