import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Card, Text, Provider as PaperProvider, Appbar } from 'react-native-paper';
import { useLedgerStore } from '../store/ledgerStore';
import { getDebtsByPersonAndType, getDebtWithBalance } from '../db/repo';
import ExpandablePersonCard from '../components/ExpandablePersonCard';
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
    </PaperProvider>
  );
}