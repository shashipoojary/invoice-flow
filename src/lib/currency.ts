/**
 * Currency utility functions for multi-currency support
 */

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];

/**
 * Format amount as currency
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const validAmount = isNaN(amount) ? 0 : amount;
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validAmount);
  } catch (error) {
    // Fallback to USD if currency is invalid
    console.warn(`Invalid currency code: ${currency}, falling back to USD`);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validAmount);
  }
}

/**
 * Get currency symbol
 * @param currency - Currency code
 */
export function getCurrencySymbol(currency: string = 'USD'): string {
  const currencyInfo = CURRENCIES.find(c => c.code === currency.toUpperCase());
  return currencyInfo?.symbol || '$';
}

/**
 * Get currency name
 * @param currency - Currency code
 */
export function getCurrencyName(currency: string = 'USD'): string {
  const currencyInfo = CURRENCIES.find(c => c.code === currency.toUpperCase());
  return currencyInfo?.name || 'US Dollar';
}

/**
 * Convert amount from one currency to another using exchange rate
 * @param amount - Amount to convert
 * @param exchangeRate - Exchange rate (from invoice currency to base currency)
 */
export function convertToBaseCurrency(
  amount: number,
  exchangeRate: number = 1.0
): number {
  return Math.round((amount * exchangeRate) * 100) / 100;
}

/**
 * Check if currency code is valid
 * @param currency - Currency code to validate
 */
export function isValidCurrency(currency: string): boolean {
  return CURRENCIES.some(c => c.code === currency.toUpperCase());
}

/**
 * Format currency for PDF generation (manual formatting to avoid Intl.NumberFormat issues)
 * Uses text fallbacks for Unicode symbols that may not render in PDFs
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'USD')
 */
export function formatCurrencyForPDF(
  amount: number,
  currency: string = 'USD'
): string {
  const validAmount = isNaN(amount) ? 0 : amount;
  const currencyInfo = CURRENCIES.find(c => c.code === currency.toUpperCase());
  
  // Use PDF-safe symbol (fallback to text for Unicode symbols that don't render in PDFs)
  // Standard fonts in pdf-lib don't support Unicode characters like ₹, €, £, ¥
  // So we use text alternatives for PDF generation
  let symbol: string;
  const currencyCode = currency.toUpperCase();
  
  switch (currencyCode) {
    case 'INR':
      symbol = 'Rs.'; // Use "Rs." instead of ₹ for PDF compatibility
      break;
    case 'EUR':
      symbol = 'EUR'; // Use "EUR" instead of € for PDF compatibility
      break;
    case 'GBP':
      symbol = 'GBP'; // Use "GBP" instead of £ for PDF compatibility
      break;
    case 'JPY':
      symbol = 'JPY'; // Use "JPY" instead of ¥ for PDF compatibility
      break;
    case 'CNY':
      symbol = 'CNY'; // Use "CNY" instead of ¥ for PDF compatibility
      break;
    default:
      // For currencies with ASCII symbols (USD, CAD, AUD, etc.), use the symbol
      symbol = currencyInfo?.symbol || '$';
      break;
  }
  
  const formattedAmount = Math.abs(validAmount).toFixed(2);
  
  // Handle negative amounts
  const sign = validAmount < 0 ? '-' : '';
  
  // Format with thousands separators
  const parts = formattedAmount.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = parts.join('.');
  
  // Return formatted string with symbol
  // For currencies like USD, EUR, GBP, symbol goes before
  // For currencies like INR, symbol goes before too
  return `${sign}${symbol} ${formatted}`;
}

/**
 * Fetch exchange rate from free API (exchangerate.host)
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Exchange rate or null if fetch fails
 */
export async function fetchExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  // If same currency, return 1.0
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return 1.0;
  }

  try {
    // Using exchangerate.host - completely free, no API key required
    // Format: 1 unit of fromCurrency = X units of toCurrency
    const response = await fetch(
      `https://api.exchangerate.host/latest?base=${fromCurrency.toUpperCase()}&symbols=${toCurrency.toUpperCase()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn(`Failed to fetch exchange rate: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.rates && data.rates[toCurrency.toUpperCase()]) {
      return parseFloat(data.rates[toCurrency.toUpperCase()].toFixed(4));
    }
    
    return null;
  } catch (error) {
    console.warn('Error fetching exchange rate:', error);
    return null;
  }
}

