// src/store/ledgerStore.ts
import { create } from 'zustand';
import { dashboardTotals, listPeopleWithTotals } from '../db/repo';
import { PersonService } from '../services/PersonService';
import { Person } from '../models/types';

type Dashboard = { totalIOU: string; totalUOM: string; net: string; };
type PeopleRow = { id: string; name: string; iouTotal: string; uomTotal: string; net: string; };

type State = {
  dashboard: Dashboard | null;
  people: PeopleRow[];
  contacts: Person[];
  refresh: () => Promise<void>;
  refreshContacts: () => Promise<void>;
};

export const useLedgerStore = create<State>((set, get) => ({
  dashboard: null,
  people: [],
  contacts: [],
  
  refresh: async () => {
    try {
      // Use existing repo functions for dashboard data
      // Could move this to a service later if needed
      const [d, p] = await Promise.all([dashboardTotals(), listPeopleWithTotals()]);
      set({ dashboard: d, people: p });
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  },
  
  refreshContacts: async () => {
    try {
      // Use service layer for contacts
      const contacts = await PersonService.listAllPeople();
      set({ contacts });
    } catch (error) {
      console.error('Failed to refresh contacts:', error);
    }
  }
}));