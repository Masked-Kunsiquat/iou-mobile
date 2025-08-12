import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLedgerStore } from '../store/ledgerStore';
import {
  getDebtsByPersonAndType,
  getDebtWithBalance,
  updateDebt,
  deleteDebt,
  markDebtSettled,
  addPayment,
  createDebt,
} from '../db/repo';
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
            const debts = await getDebtsByPersonAndType(person.id, type);
            const debtsWithBalanceRaw = await Promise.all(
              debts.map((debt) => getDebtWithBalance(debt.id))
            );
            const debtsWithBalance = debtsWithBalanceRaw.filter(
              (d): d is DebtWithBalance => !!d
            );
            return { person: person as PersonWithTotals, debts: debtsWithBalance };
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

  // Business logic actions
  const handleEditDebt = useCallback(async (
    debtId: string,
    updates: { description: string; amountOriginal: string; dueAt?: string | null }
  ) => {
    try {
      await updateDebt(debtId, updates);
      await refresh();
      await loadData();
      return true;
    } catch (e) {
      console.error('Failed to update debt:', e);
      Alert.alert('Error', 'Failed to update debt');
      return false;
    }
  }, [refresh, loadData]);

  const handleDeleteDebt = useCallback(async (debtId: string) => {
    try {
      await deleteDebt(debtId);
      await refresh();
      await loadData();
      return true;
    } catch (e) {
      console.error('Failed to delete debt:', e);
      Alert.alert('Error', 'Failed to delete debt');
      return false;
    }
  }, [refresh, loadData]);

  const handleMarkSettled = useCallback(async (debtId: string) => {
    try {
      await markDebtSettled(debtId);
      await refresh();
      await loadData();
      return true;
    } catch (e) {
      console.error('Failed to mark debt as settled:', e);
      Alert.alert('Error', 'Failed to mark debt as settled');
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
      await addPayment(payment);
      await refresh();
      await loadData();

      // Return updated debt for detail modal
      const updated = await getDebtWithBalance(payment.debtId);
      return updated;
    } catch (e) {
      console.error('Failed to add payment:', e);
      Alert.alert('Error', 'Failed to add payment');
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
      await createDebt(debt);
      await refresh();
      await loadData();
      return true;
    } catch (e) {
      console.error('Failed to create debt:', e);
      Alert.alert('Error', 'Failed to create debt');
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