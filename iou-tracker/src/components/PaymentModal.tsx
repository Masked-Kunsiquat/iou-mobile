import React, { useState, useEffect } from 'react';
import { Modal, Portal, TextInput, Button, Text, HelperText, Chip } from 'react-native-paper';
import { View, ScrollView } from 'react-native';
import { Debt } from '../models/types';
import { getDebtBalance } from '../db/repo';

interface PaymentModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (payment: {
    debtId: string;
    amount: string;
    date: string;
    note?: string;
  }) => void;
  debt: Debt | null;
}

export default function PaymentModal({ visible, onDismiss, onSave, debt }: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [balance, setBalance] = useState('0.00');

  useEffect(() => {
    if (visible && debt) {
      // Reset form
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setError('');
      
      // Load current balance
      loadBalance();
    }
  }, [visible, debt]);

  const loadBalance = async () => {
    if (!debt) return;
    try {
      const currentBalance = await getDebtBalance(debt.id);
      setBalance(currentBalance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleSave = () => {
    if (!debt) return;
    
    if (!amount.trim() || isNaN(parseFloat(amount))) {
      setError('Please enter a valid amount');
      return;
    }
    
    const paymentAmount = parseFloat(amount);
    const currentBalance = parseFloat(balance);
    
    if (paymentAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    
    if (paymentAmount > currentBalance) {
      setError(`Payment cannot exceed balance of $${balance}`);
      return;
    }

    if (!date) {
      setError('Please enter a date');
      return;
    }

    setError('');
    onSave({
      debtId: debt.id,
      amount: paymentAmount.toFixed(2),
      date: new Date(date).toISOString(),
      note: note.trim() || undefined,
    });
    onDismiss();
  };

  const handleCancel = () => {
    setError('');
    onDismiss();
  };

  const formatAmount = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    return cleaned;
  };

  const handleQuickAmount = (percentage: number) => {
    const quickAmount = (parseFloat(balance) * percentage).toFixed(2);
    setAmount(quickAmount);
  };

  if (!debt) return null;

  const remainingAfterPayment = amount && !isNaN(parseFloat(amount)) 
    ? Math.max(0, parseFloat(balance) - parseFloat(amount)).toFixed(2)
    : balance;

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleCancel} contentContainerStyle={{
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
        maxHeight: '80%',
      }}>
        <ScrollView>
          <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
            Add Payment
          </Text>

          <View style={{ 
            backgroundColor: '#f5f5f5', 
            padding: 12, 
            borderRadius: 8,
            marginBottom: 16 
          }}>
            <Text variant="bodySmall" style={{ color: '#666' }}>
              Current Balance
            </Text>
            <Text variant="titleLarge" style={{ color: debt.type === 'IOU' ? '#d32f2f' : '#2e7d32' }}>
              ${balance}
            </Text>
          </View>

          <TextInput
            label="Payment Amount *"
            value={amount}
            onChangeText={(text) => setAmount(formatAmount(text))}
            keyboardType="decimal-pad"
            style={{ marginBottom: 8 }}
            left={<TextInput.Affix text="$" />}
            error={!!error && error.includes('amount')}
          />

          {/* Quick amount buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <Chip 
              mode="outlined" 
              onPress={() => handleQuickAmount(0.25)}
              compact
            >
              25%
            </Chip>
            <Chip 
              mode="outlined" 
              onPress={() => handleQuickAmount(0.5)}
              compact
            >
              50%
            </Chip>
            <Chip 
              mode="outlined" 
              onPress={() => handleQuickAmount(0.75)}
              compact
            >
              75%
            </Chip>
            <Chip 
              mode="outlined" 
              onPress={() => setAmount(balance)}
              compact
            >
              Full
            </Chip>
          </View>

          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
            <View style={{ 
              backgroundColor: parseFloat(remainingAfterPayment) <= 0.01 ? '#e8f5e9' : '#fff3e0', 
              padding: 12, 
              borderRadius: 8,
              marginBottom: 16 
            }}>
              <Text variant="bodySmall" style={{ color: '#666' }}>
                Remaining After Payment
              </Text>
              <Text variant="titleMedium" style={{ 
                color: parseFloat(remainingAfterPayment) <= 0.01 ? '#2e7d32' : '#f57c00' 
              }}>
                ${remainingAfterPayment}
                {parseFloat(remainingAfterPayment) <= 0.01 && ' (Will be marked as settled)'}
              </Text>
            </View>
          )}

          <TextInput
            label="Payment Date *"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            style={{ marginBottom: 12 }}
            error={!!error && error.includes('date')}
          />

          <TextInput
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={2}
            style={{ marginBottom: 12 }}
            placeholder="e.g., Venmo, cash, check #1234"
          />

          {error ? (
            <HelperText type="error" visible={true} style={{ marginBottom: 12 }}>
              {error}
            </HelperText>
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button mode="outlined" onPress={handleCancel}>Cancel</Button>
            <Button mode="contained" onPress={handleSave}>Save Payment</Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}