import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Card,
  Text,
  Divider,
  TouchableRipple,
} from 'react-native-paper';
import { useLedgerStore } from '../store/ledgerStore';
import PersonModal from '../components/PersonModal';
import DebtModal from '../components/DebtModal';
import FABMenu from '../components/FABMenu';
import { upsertPerson, createDebt } from '../db/repo';
import { Person, DebtType } from '../models/types';
import { useThemeColors } from '../theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChartCard from '../components/ChartCard';

interface DashboardProps {
  onNavigateToIOUs?: () => void;
  onNavigateToUOMs?: () => void;
  onNavigateToContacts?: () => void;
}

export default function Dashboard({
  onNavigateToIOUs,
  onNavigateToUOMs,
  onNavigateToContacts,
}: DashboardProps) {
  const { dashboard, refresh } = useLedgerStore();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [debtModalVisible, setDebtModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [debtType, setDebtType] = useState<DebtType>('IOU');

  useEffect(() => {
    refresh();
  }, []);

  const handleSavePerson = async (
    person: Omit<Person, 'id'> & Partial<Pick<Person, 'id'>>
  ) => {
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

  const netColor =
    dashboard && parseFloat(dashboard.net) >= 0 ? colors.uomColor : colors.iouColor;

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 8,           // safe area + breathing room
        paddingBottom: 16 + insets.bottom,    // keep content/FAB off bottom edges
        paddingHorizontal: 16,
        gap: 12,
      }}
      style={{ backgroundColor: colors.background }}
    >
      {/* Totals card with 3 rows */}
      <Card style={{ backgroundColor: colors.surface }}>
        <Card.Content style={{ paddingVertical: 0 }}>
          {/* IOU row */}
          <TouchableRipple onPress={onNavigateToIOUs}>
            <View
              style={{
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text variant="titleMedium" style={{ color: colors.textPrimary }}>
                I Owe (IOU)
              </Text>
              <Text variant="titleLarge" style={{ color: colors.iouColor }}>
                ${dashboard?.totalIOU ?? '0.00'}
              </Text>
            </View>
          </TouchableRipple>

          <Divider />

          {/* Net row */}
          <View
            style={{
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text variant="titleMedium" style={{ color: colors.textPrimary }}>
              Net Balance
            </Text>
            <Text variant="titleLarge" style={{ color: netColor }}>
              ${dashboard?.net ?? '0.00'}
            </Text>
          </View>

          <Divider />

          {/* UOM row */}
          <TouchableRipple onPress={onNavigateToUOMs}>
            <View
              style={{
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text variant="titleMedium" style={{ color: colors.textPrimary }}>
                Owed to Me (UOM)
              </Text>
              <Text variant="titleLarge" style={{ color: colors.uomColor }}>
                ${dashboard?.totalUOM ?? '0.00'}
              </Text>
            </View>
          </TouchableRipple>
        </Card.Content>
      </Card>

      {/* Stacked totals bar (no external chart deps) */}
      <ChartCard
        title=''
        totalIOU={dashboard?.totalIOU ?? '0.00'}
        totalUOM={dashboard?.totalUOM ?? '0.00'}
      />

      {/* Contacts Navigation */}
      <TouchableRipple onPress={onNavigateToContacts} borderless={false}>
        <Card style={{ backgroundColor: colors.surface }}>
          <Card.Content
            style={{
              height: 60,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="titleMedium" style={{ color: colors.textPrimary }}>
              Manage Contacts
            </Text>
          </Card.Content>
        </Card>
      </TouchableRipple>

      <FABMenu onAddIOU={handleAddIOU} onAddUOM={handleAddUOM} onAddContact={handleAddContact} />

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
