import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Text, Provider as PaperProvider, FAB } from 'react-native-paper';
import { useLedgerStore } from '../store/ledgerStore';
import PersonModal from '../components/PersonModal';
import { upsertPerson, getPersonById } from '../db/repo';
import { Person } from '../models/types';

export default function Dashboard() {
  const { dashboard, people, refresh } = useLedgerStore();
  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  useEffect(() => { refresh(); }, []);

  const handleSavePerson = async (person: Omit<Person, 'id'> & Partial<Pick<Person, 'id'>>) => {
    await upsertPerson(person);
    await refresh();
  };

  const handleEditPerson = async (personSummary: any) => {
    // Fetch full person data including contact and notes
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
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card style={{ flex: 1 }}><Card.Content>
            <Text variant="titleSmall">Total I Owe (IOU)</Text>
            <Text variant="headlineSmall">${dashboard?.totalIOU ?? '0.00'}</Text>
          </Card.Content></Card>
          <Card style={{ flex: 1 }}><Card.Content>
            <Text variant="titleSmall">Total Owed to Me (UOM)</Text>
            <Text variant="headlineSmall">${dashboard?.totalUOM ?? '0.00'}</Text>
          </Card.Content></Card>
          <Card style={{ flex: 1 }}><Card.Content>
            <Text variant="titleSmall">Net (UOM − IOU)</Text>
            <Text variant="headlineSmall">${dashboard?.net ?? '0.00'}</Text>
          </Card.Content></Card>
        </View>

        <Card>
          <Card.Title title="People" />
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
            {people.length === 0 && <Text>No people yet. Tap + to add someone.</Text>}
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