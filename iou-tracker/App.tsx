import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import Dashboard from './src/screens/Dashboard';
import IOUScreen from './src/screens/IOUScreen';
import UOMScreen from './src/screens/UOMScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import { migrate } from './src/db/migrations';
import { seedIfEmpty } from './src/db/seed';
import { openDB } from './src/db/db';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';

type Screen = 'dashboard' | 'ious' | 'uoms' | 'contacts';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const { isDark } = useAppTheme();

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

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {renderScreen()}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}