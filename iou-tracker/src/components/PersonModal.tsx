import React, { useState, useEffect } from 'react';
import { Modal, Portal, TextInput, Button, Text, IconButton } from 'react-native-paper';
import { View, Alert } from 'react-native';
import * as Contacts from 'expo-contacts';
import { Person } from '../models/types';

interface PersonModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (person: Omit<Person, 'id'> & Partial<Pick<Person, 'id'>>) => void;
  editPerson?: Person | null;
}

export default function PersonModal({ visible, onDismiss, onSave, editPerson }: PersonModalProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Sync form state when modal opens or editPerson changes
  useEffect(() => {
    if (visible) {
      setName(editPerson?.name ?? '');
      setContact(editPerson?.contact ?? '');
      setNotes(editPerson?.notes ?? '');
      setError('');
    }
  }, [visible, editPerson]);

const handleSave = async () => {
  if (!name.trim()) {
    setError('Name is required');
    return;
  }
  setError('');
  try {
    await onSave({
      id: editPerson?.id,
      name: name.trim(),
      contact: contact.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onDismiss(); // Only dismiss if save succeeded
  } catch (err: any) {
    console.error('Failed to save person:', err);
    setError(
      err?.message || 'Failed to save person. Please try again.'
    );
  }
};


  const handleCancel = () => {
    setError('');
    onDismiss();
  };

  const handleImportContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant contacts permission to import from your contacts.');
        return;
      }

      const selectedContact = await Contacts.presentContactPickerAsync();
      
      if (!selectedContact) {
        return; // User cancelled or no contact selected
      }
      
      // Use contact name if current name is empty
      if (!name.trim() && selectedContact.name) {
        setName(selectedContact.name);
      }

      // Get primary phone or email
      let contactInfo = '';
      if (selectedContact.phoneNumbers && selectedContact.phoneNumbers.length > 0) {
        contactInfo = selectedContact.phoneNumbers[0].number || '';
      } else if (selectedContact.emails && selectedContact.emails.length > 0) {
        contactInfo = selectedContact.emails[0].email || '';
      }

      if (contactInfo) {
        setContact(contactInfo);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to import contact. Please try again.');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleCancel} contentContainerStyle={{
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text variant="headlineSmall" style={{ flex: 1 }}>
            {editPerson ? 'Edit Person' : 'Add Person'}
          </Text>
          <IconButton
            icon="contacts"
            mode="contained-tonal"
            onPress={handleImportContact}
            size={20}
          />
        </View>
        
        <TextInput
          label="Name *"
          value={name}
          onChangeText={setName}
          style={{ marginBottom: 12 }}
          error={!!error}
        />
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TextInput
            label="Contact (phone/email)"
            value={contact}
            onChangeText={setContact}
            style={{ flex: 1 }}
          />
        </View>
        
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