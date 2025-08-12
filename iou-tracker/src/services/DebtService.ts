// src/services/DebtService.ts
import { Debt, DebtType, Payment } from '../models/types';
import { 
  createDebt, 
  addPayment, 
  updateDebt, 
  deleteDebt, 
  markDebtSettled,
  getDebtWithBalance,
  getDebtsByPersonAndType,
  getPaymentsByDebt,
  getDebtBalance
} from '../db/repo';
import { PersonService } from './PersonService';
import { BusinessError } from './errors';
import { lte, gt } from '../utils/money';

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
    // Validation
    if (!data.description || data.description.trim().length === 0) {
      throw new BusinessError('Debt description is required');
    }

    if (!data.amountOriginal || data.amountOriginal === '0' || data.amountOriginal === '0.00') {
      throw new BusinessError('Debt amount must be greater than zero');
    }

    if (gt('0', data.amountOriginal)) {
      throw new BusinessError('Debt amount cannot be negative');
    }

    // Business rule: Verify person exists
    const person = await PersonService.getPersonById(data.personId);
    if (!person) {
      throw new BusinessError('Person not found');
    }

    // Business logic: normalize data
    const normalizedData = {
      ...data,
      description: data.description.trim(),
    };

    const id = await createDebt(normalizedData);
    
    console.log(`Debt created: ${data.type} for ${person.name} - ${data.description} ($${data.amountOriginal})`);
    
    return id;
  }

  /**
   * Update debt with validation
   */
  static async updateDebt(debtId: string, updates: UpdateDebtRequest): Promise<void> {
    // Validation
    if (updates.description !== undefined) {
      if (!updates.description || updates.description.trim().length === 0) {
        throw new BusinessError('Debt description is required');
      }
      updates.description = updates.description.trim();
    }

    if (updates.amountOriginal !== undefined) {
      if (!updates.amountOriginal || updates.amountOriginal === '0' || updates.amountOriginal === '0.00') {
        throw new BusinessError('Debt amount must be greater than zero');
      }
      if (gt('0', updates.amountOriginal)) {
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
    // Validation
    if (!payment.amount || payment.amount === '0' || payment.amount === '0.00') {
      throw new BusinessError('Payment amount must be greater than zero');
    }

    if (gt('0', payment.amount)) {
      throw new BusinessError('Payment amount cannot be negative');
    }

    // Business rule: Check if debt exists and is still open
    const debt = await getDebtWithBalance(payment.debtId);
    if (!debt) {
      throw new BusinessError('Debt not found');
    }

    if (debt.status === 'settled') {
      throw new BusinessError('Cannot add payment to settled debt');
    }

    // Business rule: Prevent overpayment
    if (gt(payment.amount, debt.balance)) {
      throw new BusinessError(`Payment amount ($${payment.amount}) cannot exceed remaining balance ($${debt.balance})`);
    }

    const paymentId = await addPayment(payment);
    
    // Business logic: Auto-settle logic is handled in repo.addPayment
    // but we could add additional business rules here like notifications
    
    const newBalance = await getDebtBalance(payment.debtId);
    if (lte(newBalance, '0.01')) {
      console.log(`Debt auto-settled: ${payment.debtId} (balance: $${newBalance})`);
    }
    
    console.log(`Payment added: $${payment.amount} to debt ${payment.debtId}`);
    
    return paymentId;
  }

  /**
   * Mark debt as settled with business rules
   */
  static async markDebtSettled(debtId: string): Promise<void> {
    // Business rule: Check if debt exists
    const debt = await getDebtWithBalance(debtId);
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
    // Business rule: Check if debt exists
    const debt = await getDebtWithBalance(debtId);
    if (!debt) {
      throw new BusinessError('Debt not found');
    }

    // Business rule: Only allow deletion of open debts with no payments
    const payments = await getPaymentsByDebt(debtId);
    if (payments.length > 0) {
      throw new BusinessError('Cannot delete debt that has payments. Mark as settled instead.');
    }

    await deleteDebt(debtId);
    
    console.log(`Debt deleted: ${debtId}`);
  }

  /**
   * Get debts for a person by type with business logic
   */
  static async getDebtsForPerson(personId: string, type: DebtType): Promise<Debt[]> {
    // Validate person exists
    const person = await PersonService.getPersonById(personId);
    if (!person) {
      throw new BusinessError('Person not found');
    }

    return await getDebtsByPersonAndType(personId, type);
  }

  /**
   * Get debt with balance and validation
   */
  static async getDebtWithBalance(debtId: string) {
    if (!debtId) {
      throw new BusinessError('Debt ID is required');
    }

    const debt = await getDebtWithBalance(debtId);
    if (!debt) {
      throw new BusinessError('Debt not found');
    }

    return debt;
  }

  /**
   * Get payments for a debt
   */
  static async getPaymentsForDebt(debtId: string): Promise<Payment[]> {
    // Validate debt exists
    const debt = await getDebtWithBalance(debtId);
    if (!debt) {
      throw new BusinessError('Debt not found');
    }

    return await getPaymentsByDebt(debtId);
  }
}