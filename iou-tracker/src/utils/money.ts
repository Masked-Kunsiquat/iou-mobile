import Decimal from 'decimal.js-light';
Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

export const d = (v: string | number) => new Decimal(v || 0);
export const toCentsStr = (v: string | number) => d(v).toFixed(2);
export const add = (a: string, b: string) => d(a).plus(b).toFixed(2);
export const sub = (a: string, b: string) => d(a).minus(b).toFixed(2);
export const lte = (a: string, b: string) => d(a).lte(b);
