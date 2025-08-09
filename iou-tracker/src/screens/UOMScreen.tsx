import React, { useEffect, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { Card, Text, Provider as PaperProvider, Appbar } from 'react-native-paper';
import { useLedgerStore } from '../store/ledgerStore';
import { getDebtsByPersonAndType, getDebtWithBalance, updateDebt, deleteDebt, markDebtSettled } from '../db/repo';
import ExpandablePersonCard from '../components/ExpandablePersonCard';
import DebtDetailModal from '../components/DebtDetailModal';
import EditDebtModal from '../components/EditDebtModal';
import { Debt } from '../models/types';

interface UOMScreenProps {
  onBack?: () => void;
  onAddUOMForPerson?: (personId: string) => void;
}

export default function UOMScreen({ onBack, onAddUOMForPerson }: UOMScreenProps) {
  const { dashboard, people, refresh } = useLedgerStore();
  const [peopleWithDebts, setPeopleWithDebts] = useState<Array<{
    person: any;
    debts: (Debt & { balance: string })[];
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const loadUOMData = async () => {
    try {
      const peopleWithUOMs = people.filter(p => parseFloat(p.uomTotal) > 0);
      
      const peopleData = await Promise.all(
        peopleWithUOMs.map(async (person) => {
          const debts = await getDebtsByPersonAndType(person.id, 'UOM');
          const debtsWithBalance = await Promise.all(
            debts.map(async (debt) => {
              const debtWithBalance = await getDebtWithBalance(debt.id);
              return debtWithBalance!;
            })
          );
          return {
            person,
            debts: debtsWithBalance
          };
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
    if (people.length > 0) {
      loadUOMData();
    }
  }, [people]);

  const handleDebtPress = (debt: Debt) => {
    setSelectedDebt(debt);
    setDetailModalVisible(true);
  };

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (debtId: string, updates: {
    description: string;
    amountOriginal: string;
    dueAt?: string | null;
  }) => {
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
    // This will be implemented in the next commit
    Alert.alert('Coming Soon', 'Payment functionality will be added in the next update');
  };

  if (loading) {
    return (
      <PaperProvider>
        <Appbar.Header>
          <Appbar.BackAction onPress={onBack} />
          <Appbar.Content title="Owed to Me (UOMs)" />
        </Appbar.Header>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text>Loading...</Text>
        </ScrollView>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <Appbar.Header>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title="Owed to Me (UOMs)" />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card>
          <Card.Content>
            <Text variant="headlineSmall" style={{ color: '#2e7d32', textAlign: 'center' }}>
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
            onAddDebt={() => onAddUOMForPerson?.(person.id)}
            onDebtPress={handleDebtPress}
          />
        ))}

        {peopleWithDebts.length === 0 && (
          <Card>
            <Card.Content style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              paddingVertical: 40
            }}>
              <Text variant="titleMedium" style={{ color: '#666', marginBottom: 8 }}>
                No one owes you money right now
              </Text>
              <Text variant="bodyMedium" style={{ color: '#999', textAlign: 'center' }}>
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
    </PaperProvider>
  );
}