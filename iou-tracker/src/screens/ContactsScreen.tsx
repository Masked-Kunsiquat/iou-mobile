import React, { useEffect, useState } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { Card, Text, Appbar, FAB, IconButton } from 'react-native-paper';
import { upsertPerson, getPersonById, deletePerson, listAllPeople } from '../db/repo';
import PersonModal from '../components/PersonModal';
import { Person } from '../models/types';
import { useThemeColors } from '../theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ContactsScreenProps {
  onBack?: () => void;
}

export default function ContactsScreen({ onBack }: ContactsScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

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

  const handleSavePerson = async (
    person: Omit<Person, 'id'> & Partial<Pick<Person, 'id'>>
  ) => {
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

  // Separate async deletion logic with explicit error handling
  const performDeletePerson = async (person: Person) => {
    try {
      await deletePerson(person.id);
      await refreshContacts();
    } catch (error) {
      console.error('Failed to delete person:', error);
      Alert.alert(
        'Cannot Delete',
        'This person has existing debts. Please settle all debts before deleting.'
      );
    }
  };

  const handleDeletePerson = (person: Person) => {
    Alert.alert('Delete Contact', `Are you sure you want to delete ${person.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        // Call the external function without awaiting directly in the Alert callback
        onPress: () => {
          performDeletePerson(person).catch((err) => {
            console.error('Unhandled delete error:', err);
            Alert.alert('Error', 'Failed to delete contact due to an unexpected error.');
          });
        },
      },
    ]);
  };

  const handleAddPerson = () => {
    setEditingPerson(null);
    setPersonModalVisible(true);
  };

  if (loading) {
    return (
      <>
        <Appbar.Header statusBarHeight={insets.top}>
          <Appbar.BackAction onPress={onBack} />
          <Appbar.Content title="Manage Contacts" />
        </Appbar.Header>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.background,
            paddingBottom: insets.bottom,
          }}
        >
          <Text style={{ color: colors.textSecondary }}>Loading contacts...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Appbar.Header statusBarHeight={insets.top}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title="Manage Contacts" />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 16 + insets.bottom }}
        style={{ backgroundColor: colors.background }}
      >
        {contacts.map((person) => (
          <Card key={person.id} style={{ backgroundColor: colors.surface }}>
            <Card.Content>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    variant="titleLarge"
                    style={{ marginBottom: 4, color: colors.textPrimary }}
                  >
                    {person.name}
                  </Text>
                  {person.contact && (
                    <Text
                      variant="bodyMedium"
                      style={{ color: colors.textSecondary, marginBottom: 4 }}
                    >
                      📞 {person.contact}
                    </Text>
                  )}
                  {person.notes && (
                    <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                      💬 {person.notes}
                    </Text>
                  )}
                  {!person.contact && !person.notes && (
                    <Text
                      variant="bodySmall"
                      style={{ color: colors.textDisabled, fontStyle: 'italic' }}
                    >
                      No additional info
                    </Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <IconButton
                    icon="pencil"
                    mode="contained-tonal"
                    size={20}
                    iconColor={colors.primary}
                    onPress={() => handleEditPerson(person)}
                  />
                  <IconButton
                    icon="delete"
                    mode="contained-tonal"
                    size={20}
                    iconColor={colors.error}
                    onPress={() => handleDeletePerson(person)}
                  />
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}

        {contacts.length === 0 && (
          <Card style={{ backgroundColor: colors.surface }}>
            <Card.Content
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 40,
              }}
            >
              <Text
                variant="titleMedium"
                style={{ color: colors.textSecondary, marginBottom: 8 }}
              >
                No contacts yet
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: colors.textDisabled, textAlign: 'center' }}
              >
                Tap the + button to add your first contact
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={{ position: 'absolute', right: 16, bottom: insets.bottom + 16 }}
        onPress={handleAddPerson}
      />

      <PersonModal
        visible={personModalVisible}
        onDismiss={() => setPersonModalVisible(false)}
        onSave={handleSavePerson}
        editPerson={editingPerson}
      />
    </>
  );
}
