// src/security/AuthGate.tsx
import React, { useEffect, useRef, useState } from 'react';
import { AppState, View, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { authenticate } from './biometrics';
import { useThemeColors } from '../theme/ThemeProvider';
import { useSecurityStore } from '../store/securityStore';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();
  const { biometricsEnabled, sessionMs, lastAuthAt, markAuthed } = useSecurityStore();
  const [locked, setLocked] = useState<boolean>(biometricsEnabled);
  const appState = useRef(AppState.currentState);

  const tryAuth = async (prompt?: string) => {
    const res = await authenticate(prompt);
    if (res.ok) {
      markAuthed();
      setLocked(false);
    } else {
      setLocked(true);
    }
  };

  // On mount: only lock if enabled & session expired
  useEffect(() => {
    if (!biometricsEnabled) {
      setLocked(false);
      return;
    }
    const fresh = lastAuthAt && Date.now() - lastAuthAt < sessionMs;
    if (fresh) setLocked(false);
    else {
      setLocked(true);
      tryAuth('Authenticate to continue');
    }
  }, [biometricsEnabled, sessionMs, lastAuthAt]);

  // On resume: if enabled and session expired, lock and prompt
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const prev = appState.current;
      appState.current = state;
      if (!biometricsEnabled) return;

      if ((prev === 'background' || prev === 'inactive') && state === 'active') {
        const expired = !lastAuthAt || Date.now() - lastAuthAt >= sessionMs;
        if (expired) {
          setLocked(true);
          tryAuth('Re-authenticate');
        }
      }
    });
    return () => sub.remove();
  }, [biometricsEnabled, sessionMs, lastAuthAt]);

  if (!biometricsEnabled || !locked) return <>{children}</>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <ActivityIndicator />
      <Text style={{ color: colors.textPrimary, marginTop: 16, marginBottom: 8 }}>
        Locked — biometric authentication required
      </Text>
      <Button mode="contained" onPress={() => tryAuth()} icon="fingerprint">
        Unlock
      </Button>
    </View>
  );
}
