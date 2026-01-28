/**
 * Currency utility functions for multi-currency support
 */

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
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
 * Format amount as currency (legacy function - uses Intl.NumberFormat)
 * Note: For consistent formatting, prefer formatCurrencyForCards or formatCurrencyForPDF
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
  const currencyCode = currency.toUpperCase();
  
  try {
    // JPY should have 0 decimal places, others have 2
    const decimalPlaces = currencyCode === 'JPY' ? 0 : 2;
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
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
 * Get display format for currency (symbol or code with spacing rules)
 * @param currency - Currency code
 * @returns Object with displayText and requiresSpace
 */
function getCurrencyDisplayFormat(currency: string): { displayText: string; requiresSpace: boolean } {
  const currencyCode = currency.toUpperCase();
  const currencyInfo = CURRENCIES.find(c => c.code === currencyCode);
  
  if (!currencyInfo) {
    return { displayText: currencyCode, requiresSpace: true };
  }
  
  // Unambiguous symbols: USD, EUR, GBP, JPY, INR - use symbol
  const unambiguousSymbols = ['USD', 'EUR', 'GBP', 'JPY', 'INR'];
  if (unambiguousSymbols.includes(currencyCode)) {
    return { displayText: currencyInfo.symbol, requiresSpace: true };
  }
  
  // Disambiguated symbols: CAD, AUD, NZD, SGD, HKD, MXN - use symbol
  const disambiguatedSymbols = ['CAD', 'AUD', 'NZD', 'SGD', 'HKD', 'MXN'];
  if (disambiguatedSymbols.includes(currencyCode)) {
    return { displayText: currencyInfo.symbol, requiresSpace: true };
  }
  
  // Ambiguous symbols: CHF, CNY, BRL, ZAR - use currency code
  return { displayText: currencyCode, requiresSpace: true };
}

/**
 * Format currency for cards and dashboard displays
 * Follows professional formatting rules:
 * - Unambiguous symbols (USD, EUR, GBP, JPY, INR): use symbol with space
 * - Disambiguated symbols (CAD, AUD, etc.): use symbol with space
 * - Ambiguous symbols (CHF, CNY, BRL, ZAR): use currency code with space
 * - JPY: no decimals, others: 2 decimals
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'USD')
 */
export function formatCurrencyForCards(
  amount: number,
  currency: string = 'USD'
): string {
  const validAmount = isNaN(amount) ? 0 : amount;
  const currencyCode = currency.toUpperCase();
  
  // Get display format (symbol or code)
  const { displayText, requiresSpace } = getCurrencyDisplayFormat(currencyCode);
  
  // Determine decimal places: JPY has 0, others have 2
  const decimalPlaces = currencyCode === 'JPY' ? 0 : 2;
  const formattedAmount = Math.abs(validAmount).toFixed(decimalPlaces);
  
  // Handle negative amounts
  const sign = validAmount < 0 ? '-' : '';
  
  // Format with thousands separators
  const parts = formattedAmount.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = decimalPlaces === 0 ? parts[0] : parts.join('.');
  
  // Return formatted string with proper spacing
  return `${sign}${displayText} ${formatted}`;
}

/**
 * Format currency for PDF generation (manual formatting to avoid Intl.NumberFormat issues)
 * Follows same formatting rules as formatCurrencyForCards for consistency
 * Uses PDF-safe symbols (e.g., "Rs." for INR instead of ₹)
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'USD')
 */
export function formatCurrencyForPDF(
  amount: number,
  currency: string = 'USD'
): string {
  const validAmount = isNaN(amount) ? 0 : amount;
  const currencyCode = currency.toUpperCase();
  
  // Get display format (symbol or code)
  let { displayText, requiresSpace } = getCurrencyDisplayFormat(currencyCode);
  
  // PDF-safe symbol replacements for fonts that don't support Unicode symbols
  // INR: Use "Rs." instead of ₹ for better PDF compatibility
  if (currencyCode === 'INR') {
    displayText = 'Rs.';
  }
  
  // Determine decimal places: JPY has 0, others have 2
  const decimalPlaces = currencyCode === 'JPY' ? 0 : 2;
  const formattedAmount = Math.abs(validAmount).toFixed(decimalPlaces);
  
  // Handle negative amounts
  const sign = validAmount < 0 ? '-' : '';
  
  // Format with thousands separators
  const parts = formattedAmount.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = decimalPlaces === 0 ? parts[0] : parts.join('.');
  
  // Return formatted string with proper spacing
  return `${sign}${displayText} ${formatted}`;
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

