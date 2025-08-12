import React from 'react';
import { useLedgerStore } from '../store/ledgerStore';
import { useDebts } from '../hooks/useDebts';
import { useDebtModal } from '../hooks/useDebtModal';
import { DebtHeader } from '../components/debt/DebtHeader';
import { DebtList } from '../components/debt/DebtList';
import { DebtModals } from '../components/debt/DebtModals';
import { DebtLoading } from '../components/debt/DebtLoading';
import { DebtType, Debt } from '../models/types';
import { useThemeColors } from '../theme/ThemeProvider';

type DebtsScreenProps = {
  type: DebtType;
  title: string;
  totalLabel: string;
  totalValue: (d: { totalIOU?: string; totalUOM?: string }) => string | undefined;
  personTotalKey: 'iouTotal' | 'uomTotal';
  totalColor: (colors: ReturnType<typeof useThemeColors>) => string;
  onBack?: () => void;
};

export default function DebtsScreen({
  type,
  title,
  totalLabel,
  totalValue,
  personTotalKey,
  totalColor,
  onBack,
}: DebtsScreenProps) {
  const { dashboard } = useLedgerStore();
  const colors = useThemeColors();

  // Business logic hooks
  const {
    peopleWithDebts,
    loading,
    handleEditDebt,
    handleDeleteDebt,
    handleMarkSettled,
    handleAddPayment,
    handleCreateDebt,
  } = useDebts({ type, personTotalKey });

  // Modal state management hook
  const {
    selectedDebt,
    detailModalVisible,
    editModalVisible,
    editingDebt,
    paymentModalVisible,
    paymentDebt,
    newDebtModalVisible,
    newDebtPersonId,
    handleDebtPress,
    handleEditDebt: openEditFromDetail,
    handleAddPayment: openPaymentFromDetail,
    closeDetailModal,
    closeEditModal,
    closePaymentModal,
    closeNewDebtModal,
    openNewDebtModal,
    reopenDetailAfterPayment,
  } = useDebtModal();

  // Event handlers that combine hooks
  const handleSaveEdit = async (
    debtId: string,
    updates: { description: string; amountOriginal: string; dueAt?: string | null }
  ) => {
    const success = await handleEditDebt(debtId, updates);
    if (success) {
      closeEditModal();
    }
  };

  const handleDeleteDebtFromModal = async (debtId: string) => {
    const success = await handleDeleteDebt(debtId);
    if (success) {
      closeDetailModal();
    }
  };

  const handleMarkSettledFromModal = async (debtId: string) => {
    const success = await handleMarkSettled(debtId);
    if (success) {
      closeDetailModal();
    }
  };

  const handleSavePayment = async (payment: {
    debtId: string;
    amount: string;
    date: string;
    note?: string;
  }) => {
    const updatedDebt = await handleAddPayment(payment);
    if (updatedDebt) {
      reopenDetailAfterPayment(updatedDebt);
    }
  };

  const handleSaveNewDebt = async (debt: {
    type: DebtType;
    personId: string;
    description: string;
    amountOriginal: string;
  }) => {
    const success = await handleCreateDebt(debt);
    if (success) {
      closeNewDebtModal();
    }
  };

  const handleAddDebtForPerson = (personId: string) => {
    openNewDebtModal(personId);
  };

  const handleDebtPressWrapper = (debt: Debt) => {
    handleDebtPress(debt.id);
  };

  // Show loading state
  if (loading) {
    return <DebtLoading title={title} onBack={onBack} />;
  }

  const total = totalValue(dashboard ?? {}) ?? '0.00';

  return (
    <>
      <DebtHeader 
        title={title}
        total={total}
        totalLabel={totalLabel}
        totalColor={totalColor(colors)}
        onBack={onBack}
      />

      <DebtList
        peopleWithDebts={peopleWithDebts}
        type={type}
        personTotalKey={personTotalKey}
        onDebtPress={handleDebtPressWrapper}
        onAddDebt={handleAddDebtForPerson}
      />

      <DebtModals
        detailModalVisible={detailModalVisible}
        selectedDebt={selectedDebt}
        onCloseDetailModal={closeDetailModal}
        onEditFromDetail={openEditFromDetail}
        onDeleteDebt={handleDeleteDebtFromModal}
        onAddPaymentFromDetail={openPaymentFromDetail}
        onMarkSettled={handleMarkSettledFromModal}
        editModalVisible={editModalVisible}
        editingDebt={editingDebt}
        onCloseEditModal={closeEditModal}
        onSaveEdit={handleSaveEdit}
        paymentModalVisible={paymentModalVisible}
        paymentDebt={paymentDebt}
        onClosePaymentModal={closePaymentModal}
        onSavePayment={handleSavePayment}
        newDebtModalVisible={newDebtModalVisible}
        newDebtPersonId={newDebtPersonId}
        defaultType={type}
        onCloseNewDebtModal={closeNewDebtModal}
        onSaveNewDebt={handleSaveNewDebt}
        peopleWithDebts={peopleWithDebts}
      />
    </>
  );
}