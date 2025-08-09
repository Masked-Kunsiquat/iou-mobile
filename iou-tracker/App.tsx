import React, { useEffect, useState } from 'react';
import Dashboard from './src/screens/Dashboard';
import IOUScreen from './src/screens/IOUScreen';
import UOMScreen from './src/screens/UOMScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import { migrate } from './src/db/migrations';
import { seedIfEmpty } from './src/db/seed';
import { openDB } from './src/db/db';

type Screen = 'dashboard' | 'ious' | 'uoms' | 'contacts';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');

  useEffect(() => {
    (async () => {
      await migrate();
      const db = await openDB();
      const row = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM people');
      if (!row || row.count === 0) await seedIfEmpty();
    })();
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'ious':
        return <IOUScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'uoms':
        return <UOMScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'contacts':
        return <ContactsScreen onBack={() => setCurrentScreen('dashboard')} />;
      default:
        return (
          <Dashboard
            onNavigateToIOUs={() => setCurrentScreen('ious')}
            onNavigateToUOMs={() => setCurrentScreen('uoms')}
            onNavigateToContacts={() => setCurrentScreen('contacts')}
          />
        );
    }
  };

  return renderScreen();
}