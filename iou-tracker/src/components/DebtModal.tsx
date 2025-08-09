import React, { useState, useEffect } from 'react';
import { Modal, Portal, TextInput, Button, Text, RadioButton } from 'react-native-paper';
import { View, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLedgerStore } from '../store/ledgerStore';
import { DebtType } from '../models/types';

interface DebtModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (debt: {
    type: DebtType;
    personId: string;
    description: string;
    amountOriginal: string;
  }) => void;
  defaultType?: DebtType;
}

export default function DebtModal({ visible, onDismiss, onSave, defaultType }: DebtModalProps) {
  const { people } = useLedgerStore();
  const [type, setType] = useState<DebtType>(defaultType || 'IOU');
  const [personId, setPersonId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setType(defaultType || 'IOU');
      setPersonId(people.length > 0 ? people[0].id : '');
      setDescription('');
      setAmount('');
      setError('');
    }
  }, [visible, defaultType, people]);

  const handleSave = () => {
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
    onSave({
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
    // Remove non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    return cleaned;
  };

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
            Add New {type}
          </Text>

          <Text variant="titleMedium" style={{ marginBottom: 8 }}>Type</Text>
          <RadioButton.Group onValueChange={value => setType(value as DebtType)} value={type}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <RadioButton value="IOU" />
              <Text onPress={() => setType('IOU')}>IOU - I owe them money</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <RadioButton value="UOM" />
              <Text onPress={() => setType('UOM')}>UOM - They owe me money</Text>
            </View>
          </RadioButton.Group>

          <Text variant="titleMedium" style={{ marginBottom: 8 }}>Person</Text>
          <View style={{ 
            borderWidth: 1, 
            borderColor: '#ccc', 
            borderRadius: 4, 
            marginBottom: 16,
            backgroundColor: '#f5f5f5'
          }}>
            <Picker
              selectedValue={personId}
              onValueChange={setPersonId}
              style={{ height: 50 }}
            >
              {people.map(person => (
                <Picker.Item 
                  key={person.id} 
                  label={person.name} 
                  value={person.id} 
                />
              ))}
            </Picker>
          </View>

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

          {error ? <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text> : null}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button mode="outlined" onPress={handleCancel}>Cancel</Button>
            <Button mode="contained" onPress={handleSave}>Save</Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}