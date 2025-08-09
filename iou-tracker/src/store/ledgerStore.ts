import { create } from 'zustand';
import { dashboardTotals, listPeopleWithTotals, listAllPeople } from '../db/repo';
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
      const [d, p] = await Promise.all([dashboardTotals(), listPeopleWithTotals()]);
      set({ dashboard: d, people: p });
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  },
  refreshContacts: async () => {
    try {
      const contacts = await listAllPeople();
      set({ contacts });
    } catch (error) {
      console.error('Failed to refresh contacts:', error);
    }
  }
}));