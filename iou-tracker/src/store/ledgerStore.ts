import { create } from 'zustand';
import { dashboardTotals, listPeopleWithTotals } from '../db/repo';

type Dashboard = { totalIOU: string; totalUOM: string; net: string; };
type PeopleRow = { id: string; name: string; iouTotal: string; uomTotal: string; net: string; };

type State = {
  dashboard: Dashboard | null;
  people: PeopleRow[];
  refresh: () => Promise<void>;
};

export const useLedgerStore = create<State>((set) => ({
  dashboard: null,
  people: [],
  refresh: async () => {
    const [d, p] = await Promise.all([dashboardTotals(), listPeopleWithTotals()]);
    set({ dashboard: d, people: p });
  }
}));
