import React, { useEffect, useState } from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { Card, Text, Provider as PaperProvider, useTheme } from 'react-native-paper';
import { useLedgerStore } from '../store/ledgerStore';
import PersonModal from '../components/PersonModal';
import DebtModal from '../components/DebtModal';
import FABMenu from '../components/FABMenu';
import { upsertPerson, getPersonById, createDebt } from '../db/repo';
import { Person, DebtType } from '../models/types';
import { useThemeColors } from '../theme/ThemeProvider';

interface DashboardProps {
  onNavigateToIOUs?: () => void;
  onNavigateToUOMs?: () => void;
  onNavigateToContacts?: () => void;
}

export default function Dashboard({ onNavigateToIOUs, onNavigateToUOMs, onNavigateToContacts }: DashboardProps) {
  const { dashboard, refresh } = useLedgerStore();
  const colors = useThemeColors();
  const theme = useTheme();
  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [debtModalVisible, setDebtModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [debtType, setDebtType] = useState<DebtType>('IOU');

  useEffect(() => { refresh(); }, []);

  const handleSavePerson = async (person: Omit<Person, 'id'> & Partial<Pick<Person, 'id'>>) => {
    await upsertPerson(person);
    await refresh();
  };

  const handleSaveDebt = async (debt: {
    type: DebtType;
    personId: string;
    description: string;
    amountOriginal: string;
  }) => {
    await createDebt(debt);
    await refresh();
  };

  const handleAddIOU = () => {
    setDebtType('IOU');
    setDebtModalVisible(true);
  };

  const handleAddUOM = () => {
    setDebtType('UOM');
    setDebtModalVisible(true);
  };

  const handleAddContact = () => {
    setEditingPerson(null);
    setPersonModalVisible(true);
  };

  return (
    <ScrollView 
      contentContainerStyle={{ padding: 16, gap: 12 }}
      style={{ backgroundColor: colors.background }}
    >
      {/* Total Cards - IOU, Net, UOM */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onNavigateToIOUs}>
          <Card style={{ backgroundColor: colors.surface }}>
            <Card.Content>
              <Text variant="titleSmall" style={{ color: colors.textSecondary }}>
                I Owe (IOU)
              </Text>
              <Text variant="headlineSmall" style={{ color: colors.iouColor }}>
                ${dashboard?.totalIOU ?? '0.00'}
              </Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>
        
        <Card style={{ flex: 1, backgroundColor: colors.surface }}>
          <Card.Content>
            <Text variant="titleSmall" style={{ color: colors.textSecondary }}>
              Net Balance
            </Text>
            <Text 
              variant="headlineSmall" 
              style={{ 
                color: dashboard && parseFloat(dashboard.net) >= 0 ? colors.uomColor : colors.iouColor 
              }}
            >
              ${dashboard?.net ?? '0.00'}
            </Text>
          </Card.Content>
        </Card>
        
        <TouchableOpacity style={{ flex: 1 }} onPress={onNavigateToUOMs}>
          <Card style={{ backgroundColor: colors.surface }}>
            <Card.Content>
              <Text variant="titleSmall" style={{ color: colors.textSecondary }}>
                Owed to Me (UOM)
              </Text>
              <Text variant="headlineSmall" style={{ color: colors.uomColor }}>
                ${dashboard?.totalUOM ?? '0.00'}
              </Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Contacts Navigation */}
      <TouchableOpacity onPress={onNavigateToContacts}>
        <Card style={{ height: 60, backgroundColor: colors.surface }}>
          <Card.Content style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%'
          }}>
            <Text variant="titleMedium" style={{ color: colors.textPrimary }}>
              Manage Contacts
            </Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {/* Placeholder for future graph */}
      <Card style={{ height: 200, backgroundColor: colors.surface }}>
        <Card.Content style={{ 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%'
        }}>
          <Text variant="titleMedium" style={{ color: colors.textSecondary }}>
            📈 IOU vs UOM Graph
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 8 }}>
            Coming soon
          </Text>
        </Card.Content>
      </Card>

      <FABMenu
        onAddIOU={handleAddIOU}
        onAddUOM={handleAddUOM}
        onAddContact={handleAddContact}
      />

      <PersonModal
        visible={personModalVisible}
        onDismiss={() => setPersonModalVisible(false)}
        onSave={handleSavePerson}
        editPerson={editingPerson}
      />

      <DebtModal
        visible={debtModalVisible}
        onDismiss={() => setDebtModalVisible(false)}
        onSave={handleSaveDebt}
        defaultType={debtType}
      />
    </ScrollView>
  );
}