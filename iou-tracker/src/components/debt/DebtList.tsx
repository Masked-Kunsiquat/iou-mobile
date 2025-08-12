import React from 'react';
import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExpandablePersonCard from '../ExpandablePersonCard';
import { DebtType, PersonWithDebts } from '../../models/types';
import { useThemeColors } from '../../theme/ThemeProvider';

interface DebtListProps {
  peopleWithDebts: PersonWithDebts[];
  type: DebtType;
  personTotalKey: 'iouTotal' | 'uomTotal';
  onDebtPress: (debtId: string) => void;
  onAddDebt: (personId: string) => void;
}

export function DebtList({ 
  peopleWithDebts, 
  type, 
  personTotalKey, 
  onDebtPress, 
  onAddDebt 
}: DebtListProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={{ 
        padding: 16, 
        paddingTop: 8, 
        gap: 12, 
        paddingBottom: 16 + insets.bottom 
      }}
      style={{ backgroundColor: colors.background }}
    >
      {peopleWithDebts.map(({ person, debts }) => (
        <ExpandablePersonCard
          key={person.id}
          personName={person.name}
          total={person[personTotalKey] ?? '0.00'}
          debts={debts}
          type={type}
          onAddDebt={() => onAddDebt(person.id)}
          onDebtPress={onDebtPress}
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
  );
}