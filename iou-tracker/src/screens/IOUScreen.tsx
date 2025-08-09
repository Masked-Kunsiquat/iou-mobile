import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Card, Text, Provider as PaperProvider, Appbar } from 'react-native-paper';
import { useLedgerStore } from '../store/ledgerStore';
import { getDebtsByPersonAndType, getDebtWithBalance } from '../db/repo';
import ExpandablePersonCard from '../components/ExpandablePersonCard';
import { Debt } from '../models/types';

interface IOUScreenProps {
  onBack?: () => void;
  onAddIOUForPerson?: (personId: string) => void;
}

export default function IOUScreen({ onBack, onAddIOUForPerson }: IOUScreenProps) {
  const { dashboard, people, refresh } = useLedgerStore();
  const [peopleWithDebts, setPeopleWithDebts] = useState<Array<{
    person: any;
    debts: (Debt & { balance: string })[];
  }>>([]);
  const [loading, setLoading] = useState(true);

  const loadIOUData = async () => {
    try {
      const peopleWithIOUs = people.filter(p => parseFloat(p.iouTotal) > 0);
      
      const peopleData = await Promise.all(
        peopleWithIOUs.map(async (person) => {
          const debts = await getDebtsByPersonAndType(person.id, 'IOU');
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
      console.error('Failed to load IOU data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    refresh().then(() => loadIOUData()); 
  }, []);

  useEffect(() => {
    if (people.length > 0) {
      loadIOUData();
    }
  }, [people]);

  if (loading) {
    return (
      <PaperProvider>
        <Appbar.Header>
          <Appbar.BackAction onPress={onBack} />
          <Appbar.Content title="What I Owe (IOUs)" />
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
        <Appbar.Content title="What I Owe (IOUs)" />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card>
          <Card.Content>
            <Text variant="headlineSmall" style={{ color: '#d32f2f', textAlign: 'center' }}>
              Total: ${dashboard?.totalIOU ?? '0.00'}
            </Text>
          </Card.Content>
        </Card>

        {peopleWithDebts.map(({ person, debts }) => (
          <ExpandablePersonCard
            key={person.id}
            personName={person.name}
            total={person.iouTotal}
            debts={debts}
            type="IOU"
            onAddDebt={() => onAddIOUForPerson?.(person.id)}
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
                You don't owe anyone money! 🎉
              </Text>
              <Text variant="bodyMedium" style={{ color: '#999', textAlign: 'center' }}>
                When you borrow money, it will appear here
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </PaperProvider>
  );
}