import React, { useEffect, useState } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { Card, Text, Provider as PaperProvider, Appbar, FAB, IconButton } from 'react-native-paper';
import { upsertPerson, getPersonById, deletePerson, listAllPeople } from '../db/repo';
import PersonModal from '../components/PersonModal';
import { Person } from '../models/types';

interface ContactsScreenProps {
  onBack?: () => void;
}

export default function ContactsScreen({ onBack }: ContactsScreenProps) {
  const [contacts, setContacts] = useState<Person[]>([]);
  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshContacts = async () => {
    try {
      const contactsList = await listAllPeople();
      setContacts(contactsList);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    refreshContacts(); 
  }, []);

  const handleSavePerson = async (person: Omit<Person, 'id'> & Partial<Pick<Person, 'id'>>) => {
    try {
      await upsertPerson(person);
      await refreshContacts();
    } catch (error) {
      console.error('Failed to save person:', error);
      Alert.alert('Error', 'Failed to save contact');
    }
  };

  const handleEditPerson = async (person: Person) => {
    try {
      const fullPerson = await getPersonById(person.id);
      setEditingPerson(fullPerson);
      setPersonModalVisible(true);
    } catch (error) {
      console.error('Failed to load person:', error);
      Alert.alert('Error', 'Failed to load contact details');
    }
  };

  const handleDeletePerson = (person: Person) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${person.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePerson(person.id);
              await refreshContacts();
            } catch (error) {
              console.error('Failed to delete person:', error);
              Alert.alert('Cannot Delete', 'This person has existing debts. Please settle all debts before deleting.');
            }
          }
        }
      ]
    );
  };

  const handleAddPerson = () => {
    setEditingPerson(null);
    setPersonModalVisible(true);
  };

  if (loading) {
    return (
      <PaperProvider>
        <Appbar.Header>
          <Appbar.BackAction onPress={onBack} />
          <Appbar.Content title="Manage Contacts" />
        </Appbar.Header>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading contacts...</Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <Appbar.Header>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title="Manage Contacts" />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {contacts.map(person => (
          <Card key={person.id}>
            <Card.Content>
              <View style={{ 
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text variant="titleLarge" style={{ marginBottom: 4 }}>
                    {person.name}
                  </Text>
                  {person.contact && (
                    <Text variant="bodyMedium" style={{ color: '#666', marginBottom: 4 }}>
                      📞 {person.contact}
                    </Text>
                  )}
                  {person.notes && (
                    <Text variant="bodySmall" style={{ color: '#888' }}>
                      💬 {person.notes}
                    </Text>
                  )}
                  {!person.contact && !person.notes && (
                    <Text variant="bodySmall" style={{ color: '#ccc', fontStyle: 'italic' }}>
                      No additional info
                    </Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <IconButton
                    icon="pencil"
                    mode="contained-tonal"
                    size={20}
                    onPress={() => handleEditPerson(person)}
                  />
                  <IconButton
                    icon="delete"
                    mode="contained-tonal"
                    size={20}
                    iconColor="#d32f2f"
                    onPress={() => handleDeletePerson(person)}
                  />
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
        
        {contacts.length === 0 && (
          <Card>
            <Card.Content style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              paddingVertical: 40
            }}>
              <Text variant="titleMedium" style={{ color: '#666', marginBottom: 8 }}>
                No contacts yet
              </Text>
              <Text variant="bodyMedium" style={{ color: '#999', textAlign: 'center' }}>
                Tap the + button to add your first contact
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={{ position: 'absolute', margin: 16, right: 0, bottom: 0 }}
        onPress={handleAddPerson}
      />

      <PersonModal
        visible={personModalVisible}
        onDismiss={() => setPersonModalVisible(false)}
        onSave={handleSavePerson}
        editPerson={editingPerson}
      />
    </PaperProvider>
  );
}