// src/utils/money.ts
import Decimal from 'decimal.js-light';

// Configure decimal.js for money (2 decimal places)
Decimal.set({ precision: 28, rounding: 4 });

export function d(value: string | number): Decimal {
  return new Decimal(value);
}

export function add(a: string, b: string): string {
  return d(a).add(d(b)).toFixed(2);
}

export function sub(a: string, b: string): string {
  return d(a).sub(d(b)).toFixed(2);
}

export function mul(a: string, b: string): string {
  return d(a).mul(d(b)).toFixed(2);
}

export function div(a: string, b: string): string {
  return d(a).div(d(b)).toFixed(2);
}

export function lte(a: string, b: string): boolean {
  return d(a).lte(d(b));
}

export function gte(a: string, b: string): boolean {
  return d(a).gte(d(b));
}

export function lt(a: string, b: string): boolean {
  return d(a).lt(d(b));
}

export function gt(a: string, b: string): boolean {
  return d(a).gt(d(b));
}

export function eq(a: string, b: string): boolean {
  return d(a).eq(d(b));
}

export function abs(a: string): string {
  return d(a).abs().toFixed(2);
}

export function toCentsStr(value: string): string {
  return d(value).toFixed(2);
}

export function formatMoney(value: string, showSign: boolean = false): string {
  const decimal = d(value);
  const formatted = decimal.abs().toFixed(2);
  
  if (showSign) {
    if (decimal.isPositive()) {
      return `+$${formatted}`;
    } else if (decimal.isNegative()) {
      return `-$${formatted}`;
    }
  }
  
  return `$${formatted}`;
}