import { useState, useCallback } from 'react';
import { DebtType, Debt } from '../models/types';
import { createDebt } from '../db/repo';
import { useLedgerStore } from '../store/ledgerStore';

export function useDebtModals() {
  const { refresh } = useLedgerStore();
  const [debtModalVisible, setDebtModalVisible] = useState(false);
  const [debtType, setDebtType] = useState<DebtType>('IOU');

  const openDebtModal = useCallback((type: DebtType) => {
    setDebtType(type);
    setDebtModalVisible(true);
  }, []);

  const closeDebtModal = useCallback(() => {
    setDebtModalVisible(false);
  }, []);

  const handleSaveDebt = useCallback(async (debt: {
    type: DebtType;
    personId: string;
    description: string;
    amountOriginal: string;
  }) => {
    await createDebt(debt);
    await refresh();
    closeDebtModal();
  }, [refresh, closeDebtModal]);

  return {
    debtModalVisible,
    debtType,
    openDebtModal,
    closeDebtModal,
    handleSaveDebt,
  };
}

// ADDITIONAL hook for complex debt screen modals
export function useDebtModal() {
  // Detail Modal State
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);

  // New Debt Modal State
  const [newDebtModalVisible, setNewDebtModalVisible] = useState(false);
  const [newDebtPersonId, setNewDebtPersonId] = useState<string | null>(null);

  // Detail Modal Actions
  const openDetailModal = useCallback((debt: Debt) => {
    setSelectedDebt(debt);
    setDetailModalVisible(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setDetailModalVisible(false);
    setSelectedDebt(null);
  }, []);

  // Edit Modal Actions
  const openEditModal = useCallback((debt: Debt) => {
    setEditingDebt(debt);
    setEditModalVisible(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalVisible(false);
    setEditingDebt(null);
  }, []);

  // Payment Modal Actions
  const openPaymentModal = useCallback((debt: Debt) => {
    setPaymentDebt(debt);
    setPaymentModalVisible(true);
    // Close detail modal when opening payment modal to avoid stacking
    setDetailModalVisible(false);
  }, []);

  const closePaymentModal = useCallback(() => {
    setPaymentModalVisible(false);
    setPaymentDebt(null);
  }, []);

  const reopenDetailAfterPayment = useCallback((updatedDebt: Debt) => {
    // Close payment modal first
    setPaymentModalVisible(false);
    setPaymentDebt(null);
    
    // Open detail modal with updated debt
    setSelectedDebt(updatedDebt);
    setDetailModalVisible(true);
  }, []);

  // New Debt Modal Actions
  const openNewDebtModal = useCallback((personId?: string) => {
    setNewDebtPersonId(personId || null);
    setNewDebtModalVisible(true);
  }, []);

  const closeNewDebtModal = useCallback(() => {
    setNewDebtModalVisible(false);
    setNewDebtPersonId(null);
  }, []);

  // Combined action for debt press (open detail)
  const handleDebtPress = useCallback((debt: Debt) => {
    openDetailModal(debt);
  }, [openDetailModal]);

  // Combined action for edit button (close detail, open edit)
  const handleEditDebt = useCallback((debt: Debt) => {
    closeDetailModal();
    openEditModal(debt);
  }, [closeDetailModal, openEditModal]);

  // Combined action for add payment (close detail, open payment)
  const handleAddPayment = useCallback((debtId: string, allDebts: Array<{ debts: Debt[] }>) => {
    const debt = allDebts.flatMap(({ debts }) => debts).find((d) => d.id === debtId);
    if (debt) {
      openPaymentModal(debt);
    }
  }, [openPaymentModal]);

  return {
    // State
    selectedDebt,
    detailModalVisible,
    editModalVisible,
    editingDebt,
    paymentModalVisible,
    paymentDebt,
    newDebtModalVisible,
    newDebtPersonId,

    // Actions
    openDetailModal,
    closeDetailModal,
    openEditModal,
    closeEditModal,
    openPaymentModal,
    closePaymentModal,
    reopenDetailAfterPayment,
    openNewDebtModal,
    closeNewDebtModal,

    // Combined handlers
    handleDebtPress,
    handleEditDebt,
    handleAddPayment,
  };
}