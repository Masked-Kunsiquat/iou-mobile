import React from 'react';
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
import { useThemeColors } from '../theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChartCard from '../components/ChartCard';
import { useDashboard } from '../hooks/useDashboard';
import { usePersonModals } from '../hooks/usePersonModals';
import { useDebtModals } from '../hooks/useDebtModals';
import { formatMoney } from '../utils/money';

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
  const { people } = useLedgerStore();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  // Use extracted hooks
  const { data: dashboard, loading: dashboardLoading } = useDashboard();
  const {
    personModalVisible,
    editingPerson,
    openPersonModal,
    closePersonModal,
    handleSavePerson,
  } = usePersonModals();
  const {
    debtModalVisible,
    debtType,
    openDebtModal,
    closeDebtModal,
    handleSaveDebt,
  } = useDebtModals();

  const handleAddIOU = () => openDebtModal('IOU');
  const handleAddUOM = () => openDebtModal('UOM');
  const handleAddContact = () => openPersonModal();

  if (dashboardLoading || !dashboard) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 16,
          backgroundColor: colors.primary,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
          }}
        >
          <Text variant="headlineMedium" style={{ color: colors.onPrimary, fontWeight: 'bold' }}>
            Dashboard
          </Text>
          <IconButton
            icon="cog"
            iconColor={colors.onPrimary}
            onPress={onNavigateToSettings}
          />
        </View>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>
              Overview
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>Money I Owe (IOUs):</Text>
              <Text style={{ color: '#F44336', fontWeight: 'bold' }}>
                {dashboard.formattedIOU}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>Money Owed to Me (UOMs):</Text>
              <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                {dashboard.formattedUOM}
              </Text>
            </View>
            <Divider style={{ marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="titleMedium">Net Position:</Text>
              <Text
                variant="titleMedium"
                style={{ color: dashboard.netColor, fontWeight: 'bold' }}
              >
                {dashboard.formattedNet}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <ChartCard 
          totalIOU={dashboard.totalIOU}
          totalUOM={dashboard.totalUOM}
        />

        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 16 }}>
              Quick Actions
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <TouchableRipple
                onPress={onNavigateToIOUs}
                style={{
                  flex: 1,
                  padding: 16,
                  backgroundColor: colors.errorContainer,
                  borderRadius: 8,
                  marginRight: 8,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
                    View IOUs
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Money I Owe
                  </Text>
                </View>
              </TouchableRipple>
              <TouchableRipple
                onPress={onNavigateToUOMs}
                style={{
                  flex: 1,
                  padding: 16,
                  backgroundColor: colors.primaryContainer,
                  borderRadius: 8,
                  marginLeft: 8,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
                    View UOMs
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Money Owed to Me
                  </Text>
                </View>
              </TouchableRipple>
            </View>
          </Card.Content>
        </Card>

        <Card style={{ marginBottom: 100 }}>
          <Card.Content>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text variant="titleMedium">People ({people.length})</Text>
              <TouchableRipple onPress={onNavigateToContacts}>
                <Text style={{ color: colors.primary }}>View All</Text>
              </TouchableRipple>
            </View>
{people.slice(0, 3).map((person) => {
  const iou = person.iouTotal ?? '0';
  const uom = person.uomTotal ?? '0';
  return (
    <View
      key={person.id}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
      }}
    >
      <Text>{person.name}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: '#F44336', fontSize: 12 }}>
          IOU: {formatMoney(iou)}
        </Text>
        <Text style={{ color: '#4CAF50', fontSize: 12 }}>
          UOM: {formatMoney(uom)}
        </Text>
      </View>
    </View>
  );
})}

          </Card.Content>
        </Card>
      </ScrollView>

      <FABMenu
        onAddIOU={handleAddIOU}
        onAddUOM={handleAddUOM}
        onAddContact={handleAddContact}
      />

      <PersonModal
        visible={personModalVisible}
        editPerson={editingPerson}
        onDismiss={closePersonModal}
        onSave={handleSavePerson}
      />

      <DebtModal
        visible={debtModalVisible}
        defaultType={debtType}
        onDismiss={closeDebtModal}
        onSave={handleSaveDebt}
      />
    </View>
  );
}