import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, Text, IconButton, Divider } from 'react-native-paper';
import { Debt } from '../models/types';

interface ExpandablePersonCardProps {
  personName: string;
  total: string;
  debts: (Debt & { balance: string })[];
  type: 'IOU' | 'UOM';
  onAddDebt?: () => void;
}

export default function ExpandablePersonCard({ 
  personName, 
  total, 
  debts, 
  type,
  onAddDebt 
}: ExpandablePersonCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const totalColor = type === 'IOU' ? '#d32f2f' : '#2e7d32';
  const hasDebts = debts.length > 0;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString();
  };

  const getStatusColor = (debt: Debt & { balance: string }) => {
    if (debt.status === 'settled') return '#4caf50';
    if (parseFloat(debt.balance) <= 0.01) return '#ff9800';
    return '#666';
  };

  const getStatusText = (debt: Debt & { balance: string }) => {
    if (debt.status === 'settled') return 'Settled';
    if (parseFloat(debt.balance) <= 0.01) return 'Paid';
    return `$${debt.balance} remaining`;
  };

  return (
    <Card style={{ marginBottom: 12 }}>
      <Card.Content>
        <View style={{ 
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={{ marginBottom: 4 }}>
              {personName}
            </Text>
            <Text variant="titleMedium" style={{ color: totalColor }}>
              Total: ${total}
            </Text>
            {hasDebts && (
              <Text variant="bodySmall" style={{ color: '#666', marginTop: 2 }}>
                {debts.length} transaction{debts.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {onAddDebt && (
              <IconButton
                icon="plus"
                mode="contained-tonal"
                size={20}
                onPress={onAddDebt}
              />
            )}
            {hasDebts && (
              <IconButton
                icon={expanded ? 'chevron-up' : 'chevron-down'}
                size={24}
                onPress={() => setExpanded(!expanded)}
              />
            )}
          </View>
        </View>

        {expanded && hasDebts && (
          <View style={{ marginTop: 16 }}>
            <Divider style={{ marginBottom: 12 }} />
            {debts.map((debt, index) => (
              <View key={debt.id}>
                <View style={{ 
                  paddingVertical: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text variant="titleSmall" style={{ marginBottom: 2 }}>
                      ${debt.amountOriginal}
                      {debt.description && (
                        <Text style={{ fontWeight: 'normal', color: '#666' }}>
                          {' '}- {debt.description}
                        </Text>
                      )}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#888' }}>
                      {formatDate(debt.createdAt)}
                    </Text>
                    <Text 
                      variant="bodySmall" 
                      style={{ 
                        color: getStatusColor(debt),
                        marginTop: 2,
                        fontWeight: '500'
                      }}
                    >
                      {getStatusText(debt)}
                    </Text>
                  </View>
                </View>
                {index < debts.length - 1 && (
                  <Divider style={{ marginVertical: 8 }} />
                )}
              </View>
            ))}
          </View>
        )}

        {!hasDebts && (
          <Text style={{ 
            textAlign: 'center', 
            color: '#999', 
            fontStyle: 'italic',
            marginTop: 8 
          }}>
            No {type.toLowerCase()} transactions yet
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}