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

