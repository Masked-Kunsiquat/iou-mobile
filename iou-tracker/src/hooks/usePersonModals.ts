// src/hooks/usePersonModals.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Person } from '../models/types';
import { PersonService } from '../services/PersonService';
import { BusinessError } from '../services/errors';
import { useLedgerStore } from '../store/ledgerStore';

export function usePersonModals() {
  const { refresh } = useLedgerStore();
  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);

  const openPersonModal = useCallback((person?: Person) => {
    setEditingPerson(person || null);
    setPersonModalVisible(true);
  }, []);

  const closePersonModal = useCallback(() => {
    setPersonModalVisible(false);
    setEditingPerson(null);
  }, []);

  const handleSavePerson = useCallback(async (
    person: Omit<Person, 'id'> & Partial<Pick<Person, 'id'>>
  ) => {
    setLoading(true);
    try {
      await PersonService.upsertPerson(person);
      await refresh();
      closePersonModal();
    } catch (error: unknown) {
      console.error('Failed to save person:', error);
      
      if (error instanceof BusinessError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to save person. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [refresh, closePersonModal]);

  return {
    personModalVisible,
    editingPerson,
    loading,
    openPersonModal,
    closePersonModal,
    handleSavePerson,
  };
}