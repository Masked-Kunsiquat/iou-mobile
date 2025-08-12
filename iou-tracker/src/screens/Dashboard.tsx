import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Card,
  Text,
  Divider,
  TouchableRipple,
  IconButton,
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
  onNavigateToSettings?: () => void;
}

export default function Dashboard({
  onNavigateToIOUs,
  onNavigateToUOMs,
  onNavigateToContacts,
  onNavigateToSettings,
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
    dashboard && parseFloat(dashboard.net) >= 0
      ? colors.uomColor
      : colors.iouColor;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header with settings button */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 8,
          backgroundColor: colors.surface,
        }}
      >
        <Text variant="headlineMedium" style={{ color: colors.textPrimary }}>
          Dashboard
        </Text>
        <IconButton
          icon="cog"
          mode="contained-tonal"
          size={24}
          onPress={onNavigateToSettings}
          accessibilityLabel="Open settings"
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 16,
          paddingBottom: 16 + insets.bottom,
        }}
      >
        {/* Chart Card */}
        <ChartCard />

        {/* Totals Section */}
        <Card style={{ backgroundColor: colors.surface }}>
          <Card.Content style={{ gap: 16 }}>
            <Text variant="titleLarge" style={{ color: colors.textPrimary }}>
              Overview
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <Text variant="labelMedium" style={{ color: colors.textSecondary }}>
                  I OWE
                </Text>
                <Text
                  variant="headlineSmall"
                  style={{ color: colors.iouColor, fontWeight: 'bold' }}
                >
                  ${dashboard?.totalIOU ?? '0.00'}
                </Text>
              </View>

              <Divider orientation="vertical" style={{ height: 40 }} />

              <View style={{ alignItems: 'center' }}>
                <Text variant="labelMedium" style={{ color: colors.textSecondary }}>
                  OWED TO ME
                </Text>
                <Text
                  variant="headlineSmall"
                  style={{ color: colors.uomColor, fontWeight: 'bold' }}
                >
                  ${dashboard?.totalUOM ?? '0.00'}
                </Text>
              </View>

              <Divider orientation="vertical" style={{ height: 40 }} />

              <View style={{ alignItems: 'center' }}>
                <Text variant="labelMedium" style={{ color: colors.textSecondary }}>
                  NET BALANCE
                </Text>
                <Text
                  variant="headlineSmall"
                  style={{ color: netColor, fontWeight: 'bold' }}
                >
                  ${dashboard?.net ?? '0.00'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={{ backgroundColor: colors.surface }}>
          <Card.Content style={{ gap: 16 }}>
            <Text variant="titleLarge" style={{ color: colors.textPrimary }}>
              Quick Actions
            </Text>

            <View style={{ gap: 8 }}>
              <TouchableRipple
                onPress={onNavigateToIOUs}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: colors.iouContainer,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text variant="titleMedium" style={{ color: colors.textPrimary, flex: 1 }}>
                    View My IOUs
                  </Text>
                  <Text variant="headlineSmall" style={{ color: colors.iouColor }}>
                    ${dashboard?.totalIOU ?? '0.00'}
                  </Text>
                </View>
              </TouchableRipple>

              <TouchableRipple
                onPress={onNavigateToUOMs}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: colors.uomContainer,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text variant="titleMedium" style={{ color: colors.textPrimary, flex: 1 }}>
                    View Money Owed to Me
                  </Text>
                  <Text variant="headlineSmall" style={{ color: colors.uomColor }}>
                    ${dashboard?.totalUOM ?? '0.00'}
                  </Text>
                </View>
              </TouchableRipple>

              <TouchableRipple
                onPress={onNavigateToContacts}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: colors.surfaceVariant,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text variant="titleMedium" style={{ color: colors.textPrimary, flex: 1 }}>
                    Manage Contacts
                  </Text>
                  <IconButton icon="chevron-right" size={20} />
                </View>
              </TouchableRipple>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FABMenu
        onAddIOU={handleAddIOU}
        onAddUOM={handleAddUOM}
        onAddContact={handleAddContact}
      />

      {/* Modals */}
      <PersonModal
        visible={personModalVisible}
        onDismiss={() => {
          setPersonModalVisible(false);
          setEditingPerson(null);
        }}
        onSave={handleSavePerson}
        person={editingPerson}
      />

      <DebtModal
        visible={debtModalVisible}
        onDismiss={() => setDebtModalVisible(false)}
        onSave={handleSaveDebt}
        defaultType={debtType}
      />
    </View>
  );
}