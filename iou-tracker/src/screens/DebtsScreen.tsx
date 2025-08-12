import React from 'react';
import { ScrollView } from 'react-native';
import { Appbar, Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLedgerStore } from '../store/ledgerStore';
import { useDebts } from '../hooks/useDebts';
import { useDebtModal } from '../hooks/useDebtModal';
import ExpandablePersonCard from '../components/ExpandablePersonCard';
import DebtDetailModal from '../components/DebtDetailModal';
import EditDebtModal from '../components/EditDebtModal';
import PaymentModal from '../components/PaymentModal';
import DebtModal from '../components/DebtModal';
import { DebtType } from '../models/types';
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
  const insets = useSafeAreaInsets();

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
    openNewDebtModal(personId, type);
  };

  if (loading) {
    return (
      <>
        <Appbar.Header statusBarHeight={insets.top}>
          <Appbar.BackAction onPress={onBack} />
          <Appbar.Content title={title} />
        </Appbar.Header>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 16 + insets.bottom }}
          style={{ backgroundColor: colors.background }}
        >
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </ScrollView>
      </>
    );
  }

  const total = totalValue(dashboard ?? {}) ?? '0.00';

  return (
    <>
      <Appbar.Header statusBarHeight={insets.top}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title={title} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 16 + insets.bottom }}
        style={{ backgroundColor: colors.background }}
      >
        <Card style={{ backgroundColor: colors.surface }}>
          <Card.Content>
            <Text
              variant="headlineSmall"
              style={{ color: totalColor(colors), textAlign: 'center' }}
            >
              {totalLabel}: ${total}
            </Text>
          </Card.Content>
        </Card>

        {peopleWithDebts.map(({ person, debts }) => (
          <ExpandablePersonCard
            key={person.id}
            personName={person.name}
            total={person[personTotalKey] ?? '0.00'}
            debts={debts}
            type={type}
            onAddDebt={() => handleAddDebtForPerson(person.id)}
            onDebtPress={handleDebtPress}
          />
        ))}

        {peopleWithDebts.length === 0 && (
          <Card style={{ backgroundColor: colors.surface }}>
            <Card.Content
              style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}
            >
              <Text variant="titleMedium" style={{ color: colors.textSecondary, marginBottom: 8 }}>
                {type === 'IOU'
                  ? "You don't owe anyone money! 🎉"
                  : 'No one owes you money right now'}
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.textDisabled, textAlign: 'center' }}>
                {type === 'IOU'
                  ? 'When you borrow money, it will appear here'
                  : 'When you lend money, it will appear here'}
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Modals */}
      <DebtDetailModal
        visible={detailModalVisible}
        onDismiss={closeDetailModal}
        debt={selectedDebt}
        onEdit={openEditFromDetail}
        onDelete={handleDeleteDebtFromModal}
        onAddPayment={(debtId) => openPaymentFromDetail(debtId, peopleWithDebts)}
        onMarkSettled={handleMarkSettledFromModal}
      />

      <EditDebtModal
        visible={editModalVisible}
        onDismiss={closeEditModal}
        onSave={handleSaveEdit}
        debt={editingDebt}
      />

      <PaymentModal
        visible={paymentModalVisible}
        onDismiss={closePaymentModal}
        onSave={handleSavePayment}
        debt={paymentDebt}
      />

      <DebtModal
        visible={newDebtModalVisible}
        onDismiss={closeNewDebtModal}
        onSave={handleSaveNewDebt}
        defaultType={type}
        fixedType={type}
        fixedPersonId={newDebtPersonId || undefined}
      />
    </>
  );
}