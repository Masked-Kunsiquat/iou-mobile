import React from 'react';
import DebtDetailModal from '../DebtDetailModal';
import EditDebtModal from '../EditDebtModal';
import PaymentModal from '../PaymentModal';
import DebtModal from '../DebtModal';
import { Debt, DebtType } from '../../models/types';
import { PersonWithDebts } from './types';

interface DebtModalsProps {
  // Detail Modal
  detailModalVisible: boolean;
  selectedDebt: Debt | null;
  onCloseDetailModal: () => void;
  onEditFromDetail: (debt: Debt) => void;
  onDeleteDebt: (debtId: string) => Promise<void>;
  onAddPaymentFromDetail: (debtId: string, peopleWithDebts: PersonWithDebts[]) => void;
  onMarkSettled: (debtId: string) => Promise<void>;

  // Edit Modal
  editModalVisible: boolean;
  editingDebt: Debt | null;
  onCloseEditModal: () => void;
  onSaveEdit: (debtId: string, updates: {
    description: string;
    amountOriginal: string;
    dueAt?: string | null;
  }) => Promise<void>;

  // Payment Modal
  paymentModalVisible: boolean;
  paymentDebt: Debt | null;
  onClosePaymentModal: () => void;
  onSavePayment: (payment: {
    debtId: string;
    amount: string;
    date: string;
    note?: string;
  }) => Promise<void>;

  // New Debt Modal
  newDebtModalVisible: boolean;
  newDebtPersonId: string | null;
  defaultType: DebtType;
  onCloseNewDebtModal: () => void;
  onSaveNewDebt: (debt: {
    type: DebtType;
    personId: string;
    description: string;
    amountOriginal: string;
  }) => Promise<void>;

  // Data for callbacks
  peopleWithDebts: PersonWithDebts[];
}

export function DebtModals({
  detailModalVisible,
  selectedDebt,
  onCloseDetailModal,
  onEditFromDetail,
  onDeleteDebt,
  onAddPaymentFromDetail,
  onMarkSettled,
  editModalVisible,
  editingDebt,
  onCloseEditModal,
  onSaveEdit,
  paymentModalVisible,
  paymentDebt,
  onClosePaymentModal,
  onSavePayment,
  newDebtModalVisible,
  newDebtPersonId,
  defaultType,
  onCloseNewDebtModal,
  onSaveNewDebt,
  peopleWithDebts,
}: DebtModalsProps) {
  return (
    <>
      <DebtDetailModal
        visible={detailModalVisible}
        onDismiss={onCloseDetailModal}
        debt={selectedDebt}
        onEdit={onEditFromDetail}
        onDelete={onDeleteDebt}
        onAddPayment={(debtId) => onAddPaymentFromDetail(debtId, peopleWithDebts)}
        onMarkSettled={onMarkSettled}
      />

      <EditDebtModal
        visible={editModalVisible}
        onDismiss={onCloseEditModal}
        onSave={onSaveEdit}
        debt={editingDebt}
      />

      <PaymentModal
        visible={paymentModalVisible}
        onDismiss={onClosePaymentModal}
        onSave={onSavePayment}
        debt={paymentDebt}
      />

      <DebtModal
        visible={newDebtModalVisible}
        onDismiss={onCloseNewDebtModal}
        onSave={onSaveNewDebt}
        defaultType={defaultType}
        fixedType={defaultType}
        fixedPersonId={newDebtPersonId || undefined}
      />
    </>
  );
}