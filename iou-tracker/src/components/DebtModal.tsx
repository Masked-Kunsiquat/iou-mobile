import React, { useState, useEffect } from 'react';
import { Modal, Portal, TextInput, Button, Text, RadioButton, Chip } from 'react-native-paper';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import ThemedPersonSelect from './ThemedPersonSelect';
import { useLedgerStore } from '../store/ledgerStore';
import { DebtType } from '../models/types';
import { useThemeColors } from '../theme/ThemeProvider';

interface DebtModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (debt: {
    type: DebtType;
    personId: string;
    description: string;
    amountOriginal: string;
  }) => Promise<void> | void;
  defaultType?: DebtType;

  /** NEW: lock fields when invoked from a person card or typed screen */
  fixedPersonId?: string;     // when set, person is locked
  fixedType?: DebtType;       // when set, type is locked (e.g., IOU on IOU screen)
}

export default function DebtModal({
  visible,
  onDismiss,
  onSave,
  defaultType,
  fixedPersonId,
  fixedType,
}: DebtModalProps) {
  const { people } = useLedgerStore();
  const colors = useThemeColors();
  const { height } = useWindowDimensions();

  const [type, setType] = useState<DebtType>(fixedType || defaultType || 'IOU');
  const [personId, setPersonId] = useState<string>(fixedPersonId || (people[0]?.id ?? ''));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setType(fixedType || defaultType || 'IOU');
      setPersonId(fixedPersonId || (people[0]?.id ?? ''));
      setDescription('');
      setAmount('');
      setError('');
    }
  }, [visible, defaultType, fixedPersonId, fixedType, people]);

  const handleSave = async () => {
    if (!personId) {
      setError('Please select a person');
      return;
    }
    if (!amount.trim() || isNaN(parseFloat(amount))) {
      setError('Please enter a valid amount');
      return;
    }
    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setError('');
    await onSave({
      type,
      personId,
      description: description.trim(),
      amountOriginal: parseFloat(amount).toFixed(2),
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
    if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('');
    if (parts[1] && parts[1].length > 2) return parts[0] + '.' + parts[1].substring(0, 2);
    return cleaned;
  };

  const lockedPersonName =
    fixedPersonId ? (people.find((p) => p.id === fixedPersonId)?.name ?? 'Selected person') : '';

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
          maxHeight: height * 0.8, // numeric value required by RN
        }}
      >
        <ScrollView>
          <Text variant="headlineSmall" style={{ marginBottom: 16, color: colors.textPrimary }}>
            Add New {fixedType || type}
          </Text>

          {/* Type */}
          <Text variant="titleMedium" style={{ marginBottom: 8, color: colors.textPrimary }}>
            Type
          </Text>
          {fixedType ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Chip mode="flat" selected style={{ backgroundColor: colors.surfaceVariant }}>
                {fixedType === 'IOU' ? 'IOU - I owe them' : 'UOM - They owe me'}
              </Chip>
            </View>
          ) : (
            <RadioButton.Group onValueChange={(v) => setType(v as DebtType)} value={type}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <RadioButton value="IOU" />
                <Text onPress={() => setType('IOU')} style={{ color: colors.textPrimary }}>
                  IOU - I owe them money
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <RadioButton value="UOM" />
                <Text onPress={() => setType('UOM')} style={{ color: colors.textPrimary }}>
                  UOM - They owe me money
                </Text>
              </View>
            </RadioButton.Group>
          )}

          {/* Person */}
          <Text variant="titleMedium" style={{ marginBottom: 8, color: colors.textPrimary }}>
            Person
          </Text>

          {fixedPersonId ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.outline,
                borderRadius: 4,
                marginBottom: 16,
                paddingVertical: 14,
                paddingHorizontal: 12,
                backgroundColor: colors.surfaceVariant,
              }}
            >
              <Text style={{ color: colors.textPrimary }}>
                {people.find(p => p.id === fixedPersonId)?.name ?? 'Selected person'}
              </Text>
            </View>
          ) : (
            <View style={{ marginBottom: 16 }}>
              <ThemedPersonSelect
                people={people}
                value={personId}
                onChange={setPersonId}
                label="Person"
              />
            </View>
          )}

          {/* Amount */}
          <TextInput
            label="Amount *"
            value={amount}
            onChangeText={(t) => setAmount(formatAmount(t))}
            keyboardType="decimal-pad"
            style={{ marginBottom: 12 }}
            left={<TextInput.Affix text="$" />}
            error={!!error && error.toLowerCase().includes('amount')}
            mode="outlined"
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            placeholderTextColor={colors.textSecondary}
          />

          {/* Description */}
          <TextInput
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{ marginBottom: 12 }}
            placeholder="What is this for?"
            mode="outlined"
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            placeholderTextColor={colors.textSecondary}
          />

          {error ? <Text style={{ color: colors.error, marginBottom: 12 }}>{error}</Text> : null}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button mode="outlined" onPress={handleCancel}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave}>
              Save
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
