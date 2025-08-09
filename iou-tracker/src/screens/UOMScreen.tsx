import React, { useEffect, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { Card, Text, Appbar } from 'react-native-paper';
import { useLedgerStore } from '../store/ledgerStore';
import {
  getDebtsByPersonAndType,
  getDebtWithBalance,
  updateDebt,
  deleteDebt,
  markDebtSettled,
  addPayment,
  createDebt, // NEW
} from '../db/repo';
import ExpandablePersonCard from '../components/ExpandablePersonCard';
import DebtDetailModal from '../components/DebtDetailModal';
import EditDebtModal from '../components/EditDebtModal';
import PaymentModal from '../components/PaymentModal';
import DebtModal from '../components/DebtModal'; // NEW
import { Debt, DebtType } from '../models/types';
import { useThemeColors } from '../theme/ThemeProvider';

interface UOMScreenProps {
  onBack?: () => void;
  onAddUOMForPerson?: (personId: string) => void;
}

export default function UOMScreen({ onBack, onAddUOMForPerson }: UOMScreenProps) {
  const { dashboard, people, refresh } = useLedgerStore();
  const colors = useThemeColors();

  const [peopleWithDebts, setPeopleWithDebts] = useState<
    Array<{ person: any; debts: (Debt & { balance: string })[] }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);

  // NEW: state for creating a new UOM for a specific person
  const [newDebtModalVisible, setNewDebtModalVisible] = useState(false);
  const [newDebtPersonId, setNewDebtPersonId] = useState<string | null>(null);

  const loadUOMData = async () => {
    try {
      const peopleWithUOMs = people.filter((p) => parseFloat(p.uomTotal) > 0);
      const peopleData = await Promise.all(
        peopleWithUOMs.map(async (person) => {
          const debts = await getDebtsByPersonAndType(person.id, 'UOM');
          const debtsWithBalance = await Promise.all(
            debts.map(async (debt) => {
              const debtWithBalance = await getDebtWithBalance(debt.id);
              return debtWithBalance!;
            })
          );
          return { person, debts: debtsWithBalance };
        })
      );
      setPeopleWithDebts(peopleData);
    } catch (error) {
      console.error('Failed to load UOM data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().then(() => loadUOMData());
  }, []);

  useEffect(() => {
    if (people.length > 0) loadUOMData();
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
      await loadUOMData();
      setEditModalVisible(false);
    } catch (error) {
      console.error('Failed to update debt:', error);
      Alert.alert('Error', 'Failed to update debt');
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      await deleteDebt(debtId);
      await refresh();
      await loadUOMData();
      setDetailModalVisible(false);
    } catch (error) {
      console.error('Failed to delete debt:', error);
      Alert.alert('Error', 'Failed to delete debt');
    }
  };

  const handleMarkSettled = async (debtId: string) => {
    try {
      await markDebtSettled(debtId);
      await refresh();
      await loadUOMData();
      setDetailModalVisible(false);
    } catch (error) {
      console.error('Failed to mark debt as settled:', error);
      Alert.alert('Error', 'Failed to mark debt as settled');
    }
  };

  const handleAddPayment = (debtId: string) => {
    const debt = peopleWithDebts.flatMap(({ debts }) => debts).find((d) => d.id === debtId);
    if (debt) {
      setPaymentDebt(debt);
      setPaymentModalVisible(true);
      setDetailModalVisible(false);
    }
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
      await loadUOMData();
      const updatedDebt = await getDebtWithBalance(payment.debtId);
      if (updatedDebt) {
        setSelectedDebt(updatedDebt);
        setDetailModalVisible(true);
      }
    } catch (error) {
      console.error('Failed to add payment:', error);
      Alert.alert('Error', 'Failed to add payment');
    }
  };

  // NEW: open modal for adding a UOM for a specific person
  const handleAddDebtForPerson = (personId: string) => {
    setNewDebtPersonId(personId);
    setNewDebtModalVisible(true);
  };

  // NEW: save new debt (UOM) from modal
  const handleSaveNewDebt = async (debt: {
    type: DebtType;
    personId: string;
    description: string;
    amountOriginal: string;
  }) => {
    try {
      await createDebt(debt);
      await refresh();
      await loadUOMData();
      setNewDebtModalVisible(false);
      setNewDebtPersonId(null);
    } catch (error) {
      console.error('Failed to create debt:', error);
      Alert.alert('Error', 'Failed to create debt');
    }
  };

  if (loading) {
    return (
      <>
        <Appbar.Header>
          <Appbar.BackAction onPress={onBack} />
          <Appbar.Content title="Owed to Me (UOMs)" />
        </Appbar.Header>
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          style={{ backgroundColor: colors.background }}
        >
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title="Owed to Me (UOMs)" />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12 }}
        style={{ backgroundColor: colors.background }}
      >
        <Card style={{ backgroundColor: colors.surface }}>
          <Card.Content>
            <Text variant="headlineSmall" style={{ color: colors.uomColor, textAlign: 'center' }}>
              Total: ${dashboard?.totalUOM ?? '0.00'}
            </Text>
          </Card.Content>
        </Card>

        {peopleWithDebts.map(({ person, debts }) => (
          <ExpandablePersonCard
            key={person.id}
            personName={person.name}
            total={person.uomTotal}
            debts={debts}
            type="UOM"
            onAddDebt={() =>
              handleAddDebtForPerson(person.id) ?? onAddUOMForPerson?.(person.id)
            }
            onDebtPress={handleDebtPress}
          />
        ))}

        {peopleWithDebts.length === 0 && (
          <Card style={{ backgroundColor: colors.surface }}>
            <Card.Content
              style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}
            >
              <Text variant="titleMedium" style={{ color: colors.textSecondary, marginBottom: 8 }}>
                No one owes you money right now
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.textDisabled, textAlign: 'center' }}>
                When you lend money, it will appear here
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

      {/* NEW: Add UOM for a specific person (person + type locked) */}
      <DebtModal
        visible={newDebtModalVisible}
        onDismiss={() => {
          setNewDebtModalVisible(false);
          setNewDebtPersonId(null);
        }}
        onSave={handleSaveNewDebt}
        defaultType="UOM"
        fixedType="UOM"
        fixedPersonId={newDebtPersonId || undefined}
      />
    </>
  );
}
