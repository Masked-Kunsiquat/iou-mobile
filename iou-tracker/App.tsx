import React, { useEffect } from 'react';
import Dashboard from './src/screens/Dashboard';
import { migrate } from './src/db/migrations';
import { seedIfEmpty } from './src/db/seed';
import { openDB } from './src/db/db';

export default function App() {
  useEffect(() => {
    (async () => {
      await migrate();
      // seed once if people table is empty
      const db = await openDB();
      const row = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM people');
      if (!row || row.count === 0) await seedIfEmpty();
    })();
  }, []);

  return <Dashboard />;
}
