// src/hooks/useDebts.ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLedgerStore } from '../store/ledgerStore';
import { DebtService } from '../services/DebtService';
import { BusinessError } from '../services/errors';
import { getDebtWithBalance } from '../db/repo';
import { Debt, DebtType, Person } from '../models/types';

type PersonWithTotals = Person & {
  iouTotal?: string;
  uomTotal?: string;
};

type DebtWithBalance = Debt & { balance: string };

type UseDebtsProps = {
  type: DebtType;
  personTotalKey: 'iouTotal' | 'uomTotal';
};

export function useDebts({ type, personTotalKey }: UseDebtsProps) {
  const { people, refresh } = useLedgerStore();
  const [peopleWithDebts, setPeopleWithDebts] = useState<
    Array<{ person: PersonWithTotals; debts: DebtWithBalance[] }>
  >([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const withBalance = await Promise.all(
        people
          .filter((p) => parseFloat((p as PersonWithTotals)[personTotalKey] || '0') > 0)
          .map(async (person) => {
            try {
              const debts = await DebtService.getDebtsForPerson(person.id, type);
              const debtsWithBalanceRaw = await Promise.all(
                debts.map((debt) => getDebtWithBalance(debt.id))
              );
              const debtsWithBalance = debtsWithBalanceRaw.filter(
                (d): d is DebtWithBalance => !!d
              );
              return { person: person as PersonWithTotals, debts: debtsWithBalance };
            } catch (error) {
              console.error(`Failed to load debts for person ${person.name}:`, error);
              return { person: person as PersonWithTotals, debts: [] };
            }
          })
      );
      setPeopleWithDebts(withBalance);
    } catch (e) {
      console.error(`Failed to load ${type} data:`, e);
    } finally {
      setLoading(false);
    }
  }, [people, personTotalKey, type]);

  // Load data whenever people list changes
  useEffect(() => {
    if (people.length) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [people, loadData]);

  // Refresh store data on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  const refreshData = useCallback(async () => {
    await refresh();
    // Data will be reloaded via the people effect above
  }, [refresh]);

  // Business logic actions using service layer
  const handleEditDebt = useCallback(async (
    debtId: string,
    updates: { description: string; amountOriginal: string; dueAt?: string | null }
  ) => {
    try {
      await DebtService.updateDebt(debtId, updates);
      await refresh();
      await loadData();
      return true;
    } catch (error: unknown) {
      console.error('Failed to update debt:', error);
      
      if (error instanceof BusinessError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to update debt');
      }
      return false;
    }
  }, [refresh, loadData]);

  const handleDeleteDebt = useCallback(async (debtId: string) => {
    try {
      await DebtService.deleteDebt(debtId);
      await refresh();
      await loadData();
      return true;
    } catch (error: unknown) {
      console.error('Failed to delete debt:', error);
      
      if (error instanceof BusinessError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to delete debt');
      }
      return false;
    }
  }, [refresh, loadData]);

  const handleMarkSettled = useCallback(async (debtId: string) => {
    try {
      await DebtService.markDebtSettled(debtId);
      await refresh();
      await loadData();
      return true;
    } catch (error: unknown) {
      console.error('Failed to mark debt as settled:', error);
      
      if (error instanceof BusinessError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to mark debt as settled');
      }
      return false;
    }
  }, [refresh, loadData]);

const handleAddPayment = useCallback(async (payment: {
  debtId: string;
  amount: string;
  date: string;
  note?: string;
}) => {
  try {
    await DebtService.addPaymentWithAutoSettle(payment);
    await refresh();
    await loadData();

    // Return updated debt for detail modal
    const updated = await getDebtWithBalance(payment.debtId);
    if (!updated) {
      // Either throw or return sentinel
      throw new Error(`Updated debt not found for id: ${payment.debtId}`);
      // OR: return null; (if you want callers to handle gracefully)
    }

    return updated;
  } catch (error: unknown) {
    console.error('Failed to add payment:', error);

    if (error instanceof BusinessError) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Error', 'Failed to add payment');
    }
    return null;
  }
}, [refresh, loadData]);


  const handleCreateDebt = useCallback(async (debt: {
    type: DebtType;
    personId: string;
    description: string;
    amountOriginal: string;
  }) => {
    try {
      await DebtService.createDebt(debt);
      await refresh();
      await loadData();
      return true;
    } catch (error: unknown) {
      console.error('Failed to create debt:', error);
      
      if (error instanceof BusinessError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to create debt');
      }
      return false;
    }
  }, [refresh, loadData]);

  return {
    // Data
    peopleWithDebts,
    loading,
    
    // Actions
    refresh: refreshData,
    handleEditDebt,
    handleDeleteDebt,
    handleMarkSettled,
    handleAddPayment,
    handleCreateDebt,
  };
}