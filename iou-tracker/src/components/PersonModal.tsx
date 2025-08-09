import React, { useState } from 'react';
import { Modal, Portal, TextInput, Button, Text } from 'react-native-paper';
import { View } from 'react-native';
import { Person } from '../models/types';

interface PersonModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (person: Omit<Person, 'id'> & Partial<Pick<Person, 'id'>>) => void;
  editPerson?: Person | null;
}

export default function PersonModal({ visible, onDismiss, onSave, editPerson }: PersonModalProps) {
  const [name, setName] = useState(editPerson?.name ?? '');
  const [contact, setContact] = useState(editPerson?.contact ?? '');
  const [notes, setNotes] = useState(editPerson?.notes ?? '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');
    onSave({
      id: editPerson?.id,
      name: name.trim(),
      contact: contact.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setName('');
    setContact('');
    setNotes('');
    onDismiss();
  };

  const handleCancel = () => {
    setName(editPerson?.name ?? '');
    setContact(editPerson?.contact ?? '');
    setNotes(editPerson?.notes ?? '');
    setError('');
    onDismiss();
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleCancel} contentContainerStyle={{
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
      }}>
        <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
          {editPerson ? 'Edit Person' : 'Add Person'}
        </Text>
        
        <TextInput
          label="Name *"
          value={name}
          onChangeText={setName}
          style={{ marginBottom: 12 }}
          error={!!error}
        />
        
        <TextInput
          label="Contact (phone/email)"
          value={contact}
          onChangeText={setContact}
          style={{ marginBottom: 12 }}
        />
        
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={{ marginBottom: 12 }}
        />
        
        {error ? <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text> : null}
        
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <Button mode="outlined" onPress={handleCancel}>Cancel</Button>
          <Button mode="contained" onPress={handleSave}>Save</Button>
        </View>
      </Modal>
    </Portal>
  );
}