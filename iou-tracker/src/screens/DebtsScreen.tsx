import React, { useEffect, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { Appbar, Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import ExpandablePersonCard from '../components/ExpandablePersonCard';
import DebtDetailModal from '../components/DebtDetailModal';
import EditDebtModal from '../components/EditDebtModal';
import PaymentModal from '../components/PaymentModal';
import DebtModal from '../components/DebtModal';
import { Debt, DebtType, Person } from '../models/types';
import { useThemeColors } from '../theme/ThemeProvider';

type PersonWithTotals = Person & {
  iouTotal?: string;
  uomTotal?: string;
};

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
  const { dashboard, people, refresh } = useLedgerStore();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [peopleWithDebts, setPeopleWithDebts] = useState<
    Array<{ person: PersonWithTotals; debts: (Debt & { balance: string })[] }>
  >([]);
  const [loading, setLoading] = useState(true);

  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);

  const [newDebtModalVisible, setNewDebtModalVisible] = useState(false);
  const [newDebtPersonId, setNewDebtPersonId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const withBalance = await Promise.all(
        people
          .filter(
            (p) => parseFloat((p as PersonWithTotals)[personTotalKey] || '0') > 0
          )
          .map(async (person) => {
            const debts = await getDebtsByPersonAndType(person.id, type);
            const debtsWithBalanceRaw = await Promise.all(
              debts.map((debt) => getDebtWithBalance(debt.id))
            );
            const debtsWithBalance = debtsWithBalanceRaw.filter(
              (d): d is Debt & { balance: string } => !!d
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
  };

  useEffect(() => {
    refresh().then(loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (people.length) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people]);

  const handleDebtPress = (debt: Debt) => {
    setSelectedDebt(debt);
    setDetailModalVisible(true);
  };

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (
    debtId: string,
    updates: { description: string; amountOriginal: string; dueAt?: string | null }
  ) => {
    try {
      await updateDebt(debtId, updates);
      await refresh();
      await loadData();
      setEditModalVisible(false);
    } catch (e) {
      console.error('Failed to update debt:', e);
      Alert.alert('Error', 'Failed to update debt');
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      await deleteDebt(debtId);
      await refresh();
      await loadData();
      setDetailModalVisible(false);
    } catch (e) {
      console.error('Failed to delete debt:', e);
      Alert.alert('Error', 'Failed to delete debt');
    }
  };

  const handleMarkSettled = async (debtId: string) => {
    try {
      await markDebtSettled(debtId);
      await refresh();
      await loadData();
      setDetailModalVisible(false);
    } catch (e) {
      console.error('Failed to mark debt as settled:', e);
      Alert.alert('Error', 'Failed to mark debt as settled');
    }
  };

  const handleAddPayment = (debtId: string) => {
    const debt = peopleWithDebts.flatMap(({ debts }) => debts).find((d) => d.id === debtId);
    if (!debt) return;
    setPaymentDebt(debt);
    setPaymentModalVisible(true);
    setDetailModalVisible(false);
  };

  const handleSavePayment = async (payment: {
    debtId: string;
    amount: string;
    date: string;
    note?: string;
  }) => {
    try {
      await addPayment(payment);
      await refresh();
      await loadData();
      const updated = await getDebtWithBalance(payment.debtId);
      if (updated) {
        setSelectedDebt(updated);
        setDetailModalVisible(true);
      }
    } catch (e) {
      console.error('Failed to add payment:', e);
      Alert.alert('Error', 'Failed to add payment');
    }
  };

  const handleAddDebtForPerson = (personId: string) => {
    setNewDebtPersonId(personId);
    setNewDebtModalVisible(true);
  };

  const handleSaveNewDebt = async (debt: {
    type: DebtType;
    personId: string;
    description: string;
    amountOriginal: string;
  }) => {
    try {
      await createDebt(debt);
      await refresh();
      await loadData();
      setNewDebtModalVisible(false);
      setNewDebtPersonId(null);
    } catch (e) {
      console.error('Failed to create debt:', e);
      Alert.alert('Error', 'Failed to create debt');
    }
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

      <DebtDetailModal
        visible={detailModalVisible}
        onDismiss={() => setDetailModalVisible(false)}
        debt={selectedDebt}
        onEdit={handleEditDebt}
        onDelete={handleDeleteDebt}
        onAddPayment={handleAddPayment}
        onMarkSettled={handleMarkSettled}
      />

      <EditDebtModal
        visible={editModalVisible}
        onDismiss={() => setEditModalVisible(false)}
        onSave={handleSaveEdit}
        debt={editingDebt}
      />

      <PaymentModal
        visible={paymentModalVisible}
        onDismiss={() => setPaymentModalVisible(false)}
        onSave={handleSavePayment}
        debt={paymentDebt}
      />

      <DebtModal
        visible={newDebtModalVisible}
        onDismiss={() => {
          setNewDebtModalVisible(false);
          setNewDebtPersonId(null);
        }}
        onSave={handleSaveNewDebt}
        defaultType={type}
        fixedType={type}
        fixedPersonId={newDebtPersonId || undefined}
      />
    </>
  );
}
