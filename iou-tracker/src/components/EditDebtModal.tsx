import React, { useState, useEffect } from 'react';
import { Modal, Portal, TextInput, Button, Text } from 'react-native-paper';
import { View, ScrollView } from 'react-native';
import { Debt } from '../models/types';
import { useThemeColors } from '../theme/ThemeProvider';

interface EditDebtModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (debtId: string, updates: {
    description: string;
    amountOriginal: string;
    dueAt?: string | null;
  }) => void;
  debt: Debt | null;
}

export default function EditDebtModal({ visible, onDismiss, onSave, debt }: EditDebtModalProps) {
  const colors = useThemeColors();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && debt) {
      setDescription(debt.description || '');
      setAmount(debt.amountOriginal);
      setDueDate(debt.dueAt ? new Date(debt.dueAt).toISOString().split('T')[0] : '');
      setError('');
    }
  }, [visible, debt]);

  const handleSave = () => {
    if (!debt) return;
    
    if (!amount.trim() || isNaN(parseFloat(amount))) {
      setError('Please enter a valid amount');
      return;
    }
    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setError('');
    onSave(debt.id, {
      description: description.trim(),
      amountOriginal: parseFloat(amount).toFixed(2),
      dueAt: dueDate ? new Date(dueDate).toISOString() : null,
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

  if (!debt) return null;

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleCancel} contentContainerStyle={{
        backgroundColor: colors.surface,
        padding: 20,
        margin: 20,
        borderRadius: 8,
        maxHeight: '80%',
      }}>
        <ScrollView>
          <Text variant="headlineSmall" style={{ marginBottom: 16, color: colors.textPrimary }}>
            Edit {debt.type}
          </Text>

          <TextInput
            label="Amount *"
            value={amount}
            onChangeText={(text) => setAmount(formatAmount(text))}
            keyboardType="decimal-pad"
            style={{ marginBottom: 12 }}
            left={<TextInput.Affix text="$" />}
            error={!!error && error.includes('amount')}
          />

          <TextInput
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{ marginBottom: 12 }}
            placeholder="What is this for?"
          />

          <TextInput
            label="Due Date (optional)"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            style={{ marginBottom: 12 }}
          />

          {error ? <Text style={{ color: colors.error, marginBottom: 12 }}>{error}</Text> : null}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button mode="outlined" onPress={handleCancel}>Cancel</Button>
            <Button mode="contained" onPress={handleSave}>Save</Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}