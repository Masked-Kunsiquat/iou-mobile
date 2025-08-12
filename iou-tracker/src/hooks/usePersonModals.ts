import { useState, useCallback } from 'react';
import { Person } from '../models/types';
import { upsertPerson } from '../db/repo';
import { useLedgerStore } from '../store/ledgerStore';

export function usePersonModals() {
  const { refresh } = useLedgerStore();
  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

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
    await upsertPerson(person);
    await refresh();
    closePersonModal();
  }, [refresh, closePersonModal]);

  return {
    personModalVisible,
    editingPerson,
    openPersonModal,
    closePersonModal,
    handleSavePerson,
  };
}