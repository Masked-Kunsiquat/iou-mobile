import React, { useState, useEffect } from 'react';
import { Modal, Portal, Text, Card, Button, IconButton, Divider, Menu, Dialog } from 'react-native-paper';
import { View, ScrollView, Alert } from 'react-native';
import { Debt, Payment } from '../models/types';
import { getPaymentsByDebt, getDebtBalance, getPersonById } from '../db/repo';
import { useThemeColors } from '../theme/ThemeProvider';

interface DebtDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  debt: Debt | null;
  onEdit?: (debt: Debt) => void;
  onDelete?: (debtId: string) => void;
  onAddPayment?: (debtId: string) => void;
  onMarkSettled?: (debtId: string) => void;
}

export default function DebtDetailModal({
  visible,
  onDismiss,
  debt,
  onEdit,
  onDelete,
  onAddPayment,
  onMarkSettled
}: DebtDetailModalProps) {
  const colors = useThemeColors();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState('0.00');
  const [personName, setPersonName] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    if (visible && debt) {
      loadDebtDetails();
    }
  }, [visible, debt]);

  const loadDebtDetails = async () => {
    if (!debt) return;
    
    try {
      const [paymentList, debtBalance, person] = await Promise.all([
        getPaymentsByDebt(debt.id),
        getDebtBalance(debt.id),
        getPersonById(debt.personId)
      ]);
      
      setPayments(paymentList);
      setBalance(debtBalance);
      setPersonName(person?.name || 'Unknown');
    } catch (error) {
      console.error('Failed to load debt details:', error);
    }
  };

  const handleDelete = () => {
    setMenuVisible(false);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = () => {
    if (debt && onDelete) {
      onDelete(debt.id);
      setDeleteDialogVisible(false);
      onDismiss();
    }
  };

  if (!debt) return null;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString();
  };

  const isSettled = debt.status === 'settled';
  const isPaid = !isSettled && parseFloat(balance) <= 0.01;
  const canSettle = !isSettled && parseFloat(balance) > 0;

  return (
    <>
      <Portal>
        <Modal 
          visible={visible} 
          onDismiss={onDismiss} 
          contentContainerStyle={{
            backgroundColor: colors.surface,
            margin: 20,
            borderRadius: 8,
            maxHeight: '80%',
          }}
        >
          <ScrollView>
            {/* Header */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: 20,
              paddingBottom: 0
            }}>
              <Text variant="headlineSmall" style={{ color: colors.textPrimary }}>
                Debt Details
              </Text>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    onPress={() => setMenuVisible(true)}
                  />
                }
              >
                {onEdit && !isSettled && (
                  <Menu.Item 
                    onPress={() => {
                      setMenuVisible(false);
                      onEdit(debt);
                    }} 
                    title="Edit" 
                    leadingIcon="pencil"
                  />
                )}
                {onMarkSettled && canSettle && (
                  <Menu.Item 
                    onPress={() => {
                      setMenuVisible(false);
                      Alert.alert(
                        'Mark as Settled?',
                        'This will mark the debt as fully settled, regardless of the remaining balance.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Mark Settled', 
                            onPress: () => onMarkSettled(debt.id)
                          }
                        ]
                      );
                    }} 
                    title="Mark as Settled" 
                    leadingIcon="check-all"
                  />
                )}
                {onDelete && (
                  <Menu.Item 
                    onPress={handleDelete} 
                    title="Delete" 
                    leadingIcon="delete"
                    titleStyle={{ color: colors.error }}
                  />
                )}
              </Menu>
            </View>

            <View style={{ padding: 20 }}>
              {/* Type Badge */}
              <View style={{ 
                alignSelf: 'flex-start',
                backgroundColor: debt.type === 'IOU' ? colors.iouContainer : colors.uomContainer,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 16,
                marginBottom: 16
              }}>
                <Text style={{ 
                  color: debt.type === 'IOU' ? colors.iouColor : colors.uomColor,
                  fontWeight: '500'
                }}>
                  {debt.type === 'IOU' ? 'I Owe Them' : 'They Owe Me'}
                </Text>
              </View>

              {/* Main Info */}
              <Text variant="titleMedium" style={{ marginBottom: 4, color: colors.textPrimary }}>
                {personName}
              </Text>
              <Text variant="headlineMedium" style={{ marginBottom: 16, color: colors.textPrimary }}>
                ${debt.amountOriginal}
              </Text>

              {debt.description && (
                <View style={{ marginBottom: 16 }}>
                  <Text variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: 2 }}>
                    Description
                  </Text>
                  <Text variant="bodyLarge" style={{ color: colors.textPrimary }}>
                    {debt.description}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 24, marginBottom: 16 }}>
                <View>
                  <Text variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: 2 }}>
                    Created
                  </Text>
                  <Text variant="bodyMedium" style={{ color: colors.textPrimary }}>
                    {formatDate(debt.createdAt)}
                  </Text>
                </View>
                {debt.dueAt && (
                  <View>
                    <Text variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: 2 }}>
                      Due
                    </Text>
                    <Text variant="bodyMedium" style={{ color: colors.textPrimary }}>
                      {formatDate(debt.dueAt)}
                    </Text>
                  </View>
                )}
              </View>

              <Divider style={{ marginVertical: 16 }} />

              {/* Balance Info */}
              <View style={{ 
                backgroundColor: isSettled ? colors.uomContainer : isPaid ? colors.surfaceVariant : colors.surfaceVariant,
                padding: 16,
                borderRadius: 8,
                marginBottom: 16
              }}>
                <Text variant="titleMedium" style={{ marginBottom: 4, color: colors.textPrimary }}>
                  {isSettled ? 'Status' : 'Balance'}
                </Text>
                <Text 
                  variant="headlineSmall" 
                  style={{ 
                    color: isSettled ? colors.settledColor : isPaid ? colors.paidColor : colors.textPrimary
                  }}
                >
                  {isSettled ? 'Settled' : isPaid ? 'Fully Paid' : `$${balance}`}
                </Text>
                {!isSettled && payments.length > 0 && (
                  <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 4 }}>
                    {payments.length} payment{payments.length !== 1 ? 's' : ''} made
                  </Text>
                )}
              </View>

              {/* Payments Section */}
              {payments.length > 0 && (
                <>
                  <Text variant="titleMedium" style={{ marginBottom: 12, color: colors.textPrimary }}>
                    Payment History
                  </Text>
                  <Card style={{ marginBottom: 16, backgroundColor: colors.surface }}>
                    <Card.Content>
                      {payments.map((payment, index) => (
                        <View key={payment.id}>
                          <View style={{ paddingVertical: 8 }}>
                            <View style={{ 
                              flexDirection: 'row', 
                              justifyContent: 'space-between',
                              marginBottom: 4
                            }}>
                              <Text variant="titleSmall" style={{ color: colors.textPrimary }}>
                                ${payment.amount}
                              </Text>
                              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                                {formatDate(payment.date)}
                              </Text>
                            </View>
                            {payment.note && (
                              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                                {payment.note}
                              </Text>
                            )}
                          </View>
                          {index < payments.length - 1 && <Divider />}
                        </View>
                      ))}
                    </Card.Content>
                  </Card>
                </>
              )}

              {/* Action Buttons */}
              {!isSettled && onAddPayment && (
                <Button
                  mode="contained"
                  onPress={() => onAddPayment(debt.id)}
                  icon="plus"
                  style={{ marginBottom: 8 }}
                >
                  Add Payment
                </Button>
              )}

              <Button mode="outlined" onPress={onDismiss}>
                Close
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Debt?</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: colors.textPrimary }}>
              Are you sure you want to delete this debt? This will also delete all associated payments. This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmDelete} textColor={colors.error}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}