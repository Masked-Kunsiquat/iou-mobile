// src/models/types.ts
export type ID = string;

export type Person = {
  id: ID;
  name: string;
  contact?: string;
  notes?: string;
};

export type DebtType = 'IOU' | 'UOM';

export type Debt = {
  id: ID;
  type: DebtType;
  personId: ID;
  description?: string;
  amountOriginal: string;   // store money as string decimal
  createdAt: string;        // ISO
  dueAt?: string | null;
  status: 'open' | 'settled';
};

export type Payment = {
  id: ID;
  debtId: ID;
  amount: string;           // decimal string
  date: string;             // ISO
  note?: string;
};
