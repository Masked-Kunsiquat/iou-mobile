// src/services/DebtService.ts
import { Debt, DebtType, Payment } from '../models/types';
import {
  createDebt,
  addPayment,
  updateDebt,
  deleteDebt,
  markDebtSettled,
  getDebtWithBalance as repoGetDebtWithBalance, // aliased to avoid name clash
  getDebtsByPersonAndType,
  getPaymentsByDebt,
  getDebtBalance
} from '../db/repo';
import { PersonService } from './PersonService';
import { BusinessError } from './errors';
import { isZero, lt, lte } from '../utils/money';
import { AUTO_SETTLE_THRESHOLD } from '../constants/money';

export type CreateDebtRequest = {
  type: DebtType;
  personId: string;
  description: string;
  amountOriginal: string;
  dueAt?: string;
};

export type UpdateDebtRequest = {
  description?: string;
  amountOriginal?: string;
  dueAt?: string | null;
};

export type AddPaymentRequest = {
  debtId: string;
  amount: string;
  date: string;
  note?: string;
};

export class DebtService {
  /**
   * Create a new debt with validation
   */
  static async createDebt(data: CreateDebtRequest): Promise<string> {
    if (!data.description || data.description.trim().length === 0) {
      throw new BusinessError('Debt description is required');
    }

    if (!data.amountOriginal?.trim()) {
      throw new BusinessError('Debt amount is required');
    }
    if (isZero(data.amountOriginal)) {
      throw new BusinessError('Debt amount must be greater than zero');
    }
    if (lt(data.amountOriginal, '0')) {
      throw new BusinessError('Debt amount cannot be negative');
    }

    // Verify person exists
    const person = await PersonService.getPersonById(data.personId);
    if (!person) {
      throw new BusinessError('Person not found');
    }

    const normalizedData = {
      ...data,
      description: data.description.trim(),
    };

    const id = await createDebt(normalizedData);

    console.log(
      `Debt created: ${data.type} for ${person.name} - ${data.description} ($${data.amountOriginal})`
    );

    return id;
  }

  /**
   * Update debt with validation
   */
  static async updateDebt(debtId: string, updates: UpdateDebtRequest): Promise<void> {
    if (updates.description !== undefined) {
      if (!updates.description || updates.description.trim().length === 0) {
        throw new BusinessError('Debt description is required');
      }
      updates.description = updates.description.trim();
    }

    if (updates.amountOriginal !== undefined) {
      const amt = updates.amountOriginal;
      if (!amt?.trim()) {
        throw new BusinessError('Debt amount is required');
      }
      if (isZero(amt)) {
        throw new BusinessError('Debt amount must be greater than zero');
      }
      if (lt(amt, '0')) {
        throw new BusinessError('Debt amount cannot be negative');
      }
    }

    await updateDebt(debtId, updates);

    console.log(`Debt updated: ${debtId}`);
  }

  /**
   * Add payment with auto-settlement logic
   */
  static async addPaymentWithAutoSettle(payment: AddPaymentRequest): Promise<string> {
    if (!payment.amount?.trim()) {
      throw new BusinessError('Payment amount is required');
    }
    if (isZero(payment.amount)) {
      throw new BusinessError('Payment amount must be greater than zero');
    }
    if (lt(payment.amount, '0')) {
      throw new BusinessError('Payment amount cannot be negative');
    }

    const debt = await repoGetDebtWithBalance(payment.debtId);
    if (!debt) {
      throw new BusinessError('Debt not found');
    }
    if (debt.status === 'settled') {
      throw new BusinessError('Cannot add payment to settled debt');
    }
    if (lt(debt.balance, payment.amount)) {
      throw new BusinessError(
        `Payment amount ($${payment.amount}) cannot exceed remaining balance ($${debt.balance})`
      );
    }

    const paymentId = await addPayment(payment);

    // Repo handles auto-settle — we just log consistently using shared threshold
    const newBalance = await getDebtBalance(payment.debtId);
    if (lte(newBalance, AUTO_SETTLE_THRESHOLD)) {
      console.log(`Debt auto-settled: ${payment.debtId} (balance: $${newBalance})`);
    }

    console.log(`Payment added: $${payment.amount} to debt ${payment.debtId}`);

    return paymentId;
  }

  /**
   * Mark debt as settled with business rules
   */
  static async markDebtSettled(debtId: string): Promise<void> {
    const debt = await repoGetDebtWithBalance(debtId);
    if (!debt) {
      throw new BusinessError('Debt not found');
    }
    if (debt.status === 'settled') {
      throw new BusinessError('Debt is already settled');
    }

    await markDebtSettled(debtId);

    console.log(`Debt manually settled: ${debtId}`);
  }

  /**
   * Delete debt with validation
   */
  static async deleteDebt(debtId: string): Promise<void> {
    const debt = await repoGetDebtWithBalance(debtId);
    if (!debt) {
      throw new BusinessError('Debt not found');
    }

    const payments = await getPaymentsByDebt(debtId);
    if (payments.length > 0) {
      throw new BusinessError(
        'Cannot delete debt that has payments. Mark as settled instead.'
      );
    }

    await deleteDebt(debtId);

    console.log(`Debt deleted: ${debtId}`);
  }

  /**
   * Get debts for a person by type with business logic
   */
  static async getDebtsForPerson(personId: string, type: DebtType): Promise<Debt[]> {
    const person = await PersonService.getPersonById(personId);
    if (!person) {
      throw new BusinessError('Person not found');
    }

    return await getDebtsByPersonAndType(personId, type);
  }

  /**
   * Get a debt with balance and validation by id
   * (Renamed to avoid collision with repo.getDebtWithBalance)
   */
  static async getDebtWithBalanceById(debtId: string) {
    if (!debtId) {
      throw new BusinessError('Debt ID is required');
    }

    const debt = await repoGetDebtWithBalance(debtId);
    if (!debt) {
      throw new BusinessError('Debt not found');
    }

    return debt;
  }

  /**
   * Get payments for a debt
   */
  static async getPaymentsForDebt(debtId: string): Promise<Payment[]> {
    const debt = await repoGetDebtWithBalance(debtId);
    if (!debt) {
      throw new BusinessError('Debt not found');
    }

    return await getPaymentsByDebt(debtId);
  }
}
