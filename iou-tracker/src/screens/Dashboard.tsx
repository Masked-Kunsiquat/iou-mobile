import React, { useEffect, useState } from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { Card, Text, Provider as PaperProvider, FAB } from 'react-native-paper';
import { useLedgerStore } from '../store/ledgerStore';
import PersonModal from '../components/PersonModal';
import { upsertPerson, getPersonById } from '../db/repo';
import { Person } from '../models/types';

interface DashboardProps {
  onNavigateToIOUs?: () => void;
  onNavigateToUOMs?: () => void;
  onNavigateToContacts?: () => void;
}

export default function Dashboard({ onNavigateToIOUs, onNavigateToUOMs, onNavigateToContacts }: DashboardProps) {
  const { dashboard, refresh } = useLedgerStore();
  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  useEffect(() => { refresh(); }, []);

  const handleSavePerson = async (person: Omit<Person, 'id'> & Partial<Pick<Person, 'id'>>) => {
    await upsertPerson(person);
    await refresh();
  };

  const handleAddPerson = () => {
    setEditingPerson(null);
    setPersonModalVisible(true);
  };

  return (
    <PaperProvider>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Total Cards - IOU, Net, UOM */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={onNavigateToIOUs}>
            <Card>
              <Card.Content>
                <Text variant="titleSmall">I Owe (IOU)</Text>
                <Text variant="headlineSmall" style={{ color: '#d32f2f' }}>
                  ${dashboard?.totalIOU ?? '0.00'}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
          
          <Card style={{ flex: 1 }}>
            <Card.Content>
              <Text variant="titleSmall">Net Balance</Text>
              <Text 
                variant="headlineSmall" 
                style={{ 
                  color: dashboard && parseFloat(dashboard.net) >= 0 ? '#2e7d32' : '#d32f2f' 
                }}
              >
                ${dashboard?.net ?? '0.00'}
              </Text>
            </Card.Content>
          </Card>
          
          <TouchableOpacity style={{ flex: 1 }} onPress={onNavigateToUOMs}>
            <Card>
              <Card.Content>
                <Text variant="titleSmall">Owed to Me (UOM)</Text>
                <Text variant="headlineSmall" style={{ color: '#2e7d32' }}>
                  ${dashboard?.totalUOM ?? '0.00'}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Contacts Navigation */}
        <TouchableOpacity onPress={onNavigateToContacts}>
          <Card style={{ height: 60 }}>
            <Card.Content style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%'
            }}>
              <Text variant="titleMedium">Manage Contacts</Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>

        {/* Placeholder for future graph */}
        <Card style={{ height: 200 }}>
          <Card.Content style={{ 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%'
          }}>
            <Text variant="titleMedium" style={{ color: '#666' }}>
              📈 IOU vs UOM Graph
            </Text>
            <Text variant="bodyMedium" style={{ color: '#999', marginTop: 8 }}>
              Coming soon
            </Text>
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