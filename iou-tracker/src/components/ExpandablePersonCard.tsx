import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton, Divider } from 'react-native-paper';
import { Debt } from '../models/types';
import { useThemeColors } from '../theme/ThemeProvider';

interface ExpandablePersonCardProps {
  personName: string;
  total: string;
  debts: (Debt & { balance: string })[];
  type: 'IOU' | 'UOM';
  onAddDebt?: () => void;
  onDebtPress?: (debt: Debt) => void;
}

export default function ExpandablePersonCard({ 
  personName, 
  total, 
  debts, 
  type,
  onAddDebt,
  onDebtPress
}: ExpandablePersonCardProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  
  const totalColor = type === 'IOU' ? colors.iouColor : colors.uomColor;
  const hasDebts = debts.length > 0;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString();
  };

  const getStatusColor = (debt: Debt & { balance: string }) => {
    if (debt.status === 'settled') return colors.settledColor;
    if (parseFloat(debt.balance) <= 0.01) return colors.paidColor;
    return colors.textSecondary;
  };

  const getStatusText = (debt: Debt & { balance: string }) => {
    if (debt.status === 'settled') return 'Settled';
    if (parseFloat(debt.balance) <= 0.01) return 'Paid';
    return `$${debt.balance} remaining`;
  };

  return (
    <Card style={{ marginBottom: 12, backgroundColor: colors.surface }}>
      <Card.Content>
        <View style={{ 
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={{ marginBottom: 4, color: colors.textPrimary }}>
              {personName}
            </Text>
            <Text variant="titleMedium" style={{ color: totalColor }}>
              Total: ${total}
            </Text>
            {hasDebts && (
              <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 2 }}>
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
              <TouchableOpacity 
                key={debt.id}
                onPress={() => onDebtPress && onDebtPress(debt)}
                activeOpacity={0.7}
              >
                <View style={{ 
                  paddingVertical: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text variant="titleSmall" style={{ marginBottom: 2, color: colors.textPrimary }}>
                      ${debt.amountOriginal}
                      {debt.description && (
                        <Text style={{ fontWeight: 'normal', color: colors.textSecondary }}>
                          {' '}- {debt.description}
                        </Text>
                      )}
                    </Text>
                    <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
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
                  {onDebtPress && (
                    <IconButton
                      icon="chevron-right"
                      size={20}
                      style={{ margin: 0 }}
                    />
                  )}
                </View>
                {index < debts.length - 1 && (
                  <Divider style={{ marginVertical: 8 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!hasDebts && (
          <Text style={{ 
            textAlign: 'center', 
            color: colors.textDisabled, 
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