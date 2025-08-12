import { Debt } from '../../models/types';

// Type for person with totals and debts (from useDebts hook)
export type PersonWithTotals = {
  id: string;
  name: string;
  iouTotal?: string;
  uomTotal?: string;
};

export type DebtWithBalance = Debt & { balance: string };

export type PersonWithDebts = {
  person: PersonWithTotals;
  debts: DebtWithBalance[];
};