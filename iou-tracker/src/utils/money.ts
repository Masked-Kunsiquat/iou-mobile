import Decimal from 'decimal.js-light';

/**
 * Create a Decimal instance from string/number
 */
export function d(value: string | number): Decimal {
  return new Decimal(value);
}

/**
 * Add two decimal amounts (as strings)
 */
export function add(a: string, b: string): string {
  return d(a).add(d(b)).toFixed(2);
}

/**
 * Subtract two decimal amounts (as strings)
 */
export function sub(a: string, b: string): string {
  return d(a).sub(d(b)).toFixed(2);
}

/**
 * Check if first amount is less than or equal to second
 */
export function lte(a: string, b: string): boolean {
  return d(a).lte(d(b));
}

/**
 * Convert decimal to cents string representation
 */
export function toCentsStr(amount: string): string {
  return d(amount).mul(100).toFixed(0);
}

/**
 * Format decimal amount for display (e.g., "1234.56" -> "$1,234.56")
 */
export function formatMoney(amount: string, currency = '$'): string {
  const num = parseFloat(amount);
  return `${currency}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Validate that a string represents a valid monetary amount
 */
export function isValidAmount(amount: string): boolean {
  try {
    const decimal = d(amount);
    return decimal.gte(0) && decimal.decimalPlaces() <= 2;
  } catch {
    return false;
  }
}