import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Text, Provider as PaperProvider, Appbar, FAB } from 'react-native-paper';
import { useLedgerStore } from '../store/ledgerStore';
import PersonModal from '../components/PersonModal';
import { upsertPerson, getPersonById } from '../db/repo';
import { Person } from '../models/types';

interface ContactsScreenProps {
  onBack?: () => void;
}

export default function ContactsScreen({ onBack }: ContactsScreenProps) {
  const { people, refresh } = useLedgerStore();
  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  useEffect(() => { refresh(); }, []);

  const handleSavePerson = async (person: Omit<Person, 'id'> & Partial<Pick<Person, 'id'>>) => {
    await upsertPerson(person);
    await refresh();
  };

  const handleEditPerson = async (personSummary: any) => {
    const fullPerson = await getPersonById(personSummary.id);
    setEditingPerson(fullPerson);
    setPersonModalVisible(true);
  };

  const handleAddPerson = () => {
    setEditingPerson(null);
    setPersonModalVisible(true);
  };

  return (
    <PaperProvider>
      <Appbar.Header>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title="Manage Contacts" />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card>
          <Card.Title title="All Contacts" />
          <Card.Content style={{ gap: 8 }}>
            {people.map(p => (
              <View 
                key={p.id} 
                style={{ 
                  paddingVertical: 8, 
                  borderBottomWidth: 1, 
                  borderColor: '#eee',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium">{p.name}</Text>
                  <Text>IOU: ${p.iouTotal}   UOM: ${p.uomTotal}   Net: ${p.net}</Text>
                </View>
                <Text 
                  style={{ color: 'blue', paddingHorizontal: 8 }}
                  onPress={() => handleEditPerson(p)}
                >
                  Edit
                </Text>
              </View>
            ))}
            {people.length === 0 && <Text>No contacts yet. Tap + to add someone.</Text>}
          </Card.Content>
        </Card>
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