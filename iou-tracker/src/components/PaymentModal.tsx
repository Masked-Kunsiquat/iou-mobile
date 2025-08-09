import React, { useState, useEffect } from 'react';
import { Modal, Portal, TextInput, Button, Text, HelperText, Chip } from 'react-native-paper';
import { View, ScrollView } from 'react-native';
import { Debt } from '../models/types';
import { getDebtBalance } from '../db/repo';
import { useThemeColors } from '../theme/ThemeProvider';

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
  const colors = useThemeColors();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  // Keep balance numeric to avoid NaN/string issues downstream
  const [balance, setBalance] = useState<number>(0);

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
      const raw = await getDebtBalance(debt.id);
      // Normalize to number immediately; handle string/number and comma decimals
      const n =
        typeof raw === 'number'
          ? raw
          : parseFloat(String(raw).replace(/,/g, '.'));
      setBalance(Number.isFinite(n) ? n : 0);
    } catch (error) {
      console.error('Failed to load balance:', error);
      setBalance(0);
    }
  };

  // Normalize user input: convert commas to dots, allow only digits and a single dot,
  // and clamp to 2 decimals for display.
  const normalizeAmountInput = (text: string) => {
    const withDot = text.replace(/,/g, '.');
    const cleaned = withDot.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    return cleaned;
  };

  const handleSave = () => {
    if (!debt) return;

    // Replace commas with dots BEFORE parsing to avoid partial parsing/truncation
    const normalized = amount.trim().replace(/,/g, '.');

    if (!normalized || isNaN(parseFloat(normalized))) {
      setError('Please enter a valid amount');
      return;
    }

    const paymentAmount = parseFloat(normalized);
    const currentBalance = balance;

    if (paymentAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (paymentAmount > currentBalance) {
      setError(`Payment cannot exceed balance of $${currentBalance.toFixed(2)}`);
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

  // Use the normalizer for all amount input changes
  const formatAmount = normalizeAmountInput;

  const handleQuickAmount = (percentage: number) => {
    const quickAmount = (balance * percentage).toFixed(2);
    setAmount(quickAmount);
  };

  if (!debt) return null;

  const parsedAmount = amount ? parseFloat(amount.replace(/,/g, '.')) : NaN;
  const remainingAfterPayment =
    amount && !isNaN(parsedAmount)
      ? Math.max(0, balance - parsedAmount).toFixed(2)
      : balance.toFixed(2);

  const isSettledAfter = parseFloat(remainingAfterPayment) <= 0.01;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleCancel}
        contentContainerStyle={{
          backgroundColor: colors.surface,
          padding: 20,
          margin: 20,
          borderRadius: 8,
          maxHeight: '80%',
        }}
      >
        <ScrollView>
          <Text variant="headlineSmall" style={{ marginBottom: 16, color: colors.textPrimary }}>
            Add Payment
          </Text>

          <View
            style={{
              backgroundColor: colors.surfaceVariant,
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.outline,
            }}
          >
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              Current Balance
            </Text>
            <Text
              variant="titleLarge"
              style={{
                color: debt.type === 'IOU' ? colors.iouColor : colors.uomColor,
              }}
            >
              ${balance.toFixed(2)}
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
            mode="outlined"
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            placeholderTextColor={colors.textSecondary}
          />

          {/* Quick amount buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <Chip mode="outlined" onPress={() => handleQuickAmount(0.25)} compact>
              25%
            </Chip>
            <Chip mode="outlined" onPress={() => handleQuickAmount(0.5)} compact>
              50%
            </Chip>
            <Chip mode="outlined" onPress={() => handleQuickAmount(0.75)} compact>
              75%
            </Chip>
            <Chip mode="outlined" onPress={() => setAmount(balance.toFixed(2))} compact>
              Full
            </Chip>
          </View>

          {amount && !isNaN(parsedAmount) && parsedAmount > 0 && (
            <View
              style={{
                backgroundColor: colors.surfaceVariant,
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isSettledAfter ? colors.settledColor : colors.paidColor,
              }}
            >
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                Remaining After Payment
              </Text>
              <Text
                variant="titleMedium"
                style={{
                  color: isSettledAfter ? colors.settledColor : colors.paidColor,
                }}
              >
                ${remainingAfterPayment}
                {isSettledAfter && ' (Will be marked as settled)'}
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
            mode="outlined"
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            placeholderTextColor={colors.textSecondary}
          />

          <TextInput
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={2}
            style={{ marginBottom: 12 }}
            placeholder="e.g., Venmo, cash, check #1234"
            mode="outlined"
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            placeholderTextColor={colors.textSecondary}
          />

          {error ? (
            <HelperText type="error" visible={true} style={{ marginBottom: 12 }}>
              {error}
            </HelperText>
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button mode="outlined" onPress={handleCancel}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave}>
              Save Payment
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
