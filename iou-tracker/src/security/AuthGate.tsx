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
  const hasHydrated = useSecurityStore.persist.hasHydrated();
  const [locked, setLocked] = useState<boolean>(biometricsEnabled);
  const [authing, setAuthing] = useState(false);
  const appState = useRef(AppState.currentState);

  const tryAuth = async (prompt?: string) => {
    if (authing) return;
    setAuthing(true);
    try {
      const res = await authenticate(prompt);
      if (res.ok) {
        markAuthed();
        setLocked(false);
      } else {
        setLocked(true);
      }
    } catch (err) {
      setLocked(true);
    } finally {
      setAuthing(false);
    }
  };

  // On mount: only lock if enabled & session expired
  useEffect(() => {
    if (!hasHydrated) return; // Wait for store hydration
    if (!biometricsEnabled) {
      setLocked(false);
      return;
    }
    const fresh = Boolean(lastAuthAt && Date.now() - lastAuthAt < sessionMs);
    if (fresh) {
      setLocked(false);
    } else {
      setLocked(true);
      tryAuth('Authenticate to continue');
    }
  }, [biometricsEnabled, sessionMs, lastAuthAt, hasHydrated]);

  // On resume: if enabled and session expired, lock and prompt
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const prev = appState.current;
      appState.current = state;
      if (!biometricsEnabled || !hasHydrated) return;

      if ((prev === 'background' || prev === 'inactive') && state === 'active') {
        const expired = !lastAuthAt || Date.now() - lastAuthAt >= sessionMs;
        if (expired) {
          setLocked(true);
          tryAuth('Re-authenticate');
        }
      }
    });
    return () => sub.remove();
  }, [biometricsEnabled, sessionMs, lastAuthAt, hasHydrated]);

  if (!biometricsEnabled || !locked) return <>{children}</>;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <ActivityIndicator />
      <Text style={{ color: colors.textPrimary, marginTop: 16, marginBottom: 8 }}>
        Locked — biometric authentication required
      </Text>
      <Button
        mode="contained"
        onPress={() => tryAuth()}
        icon="fingerprint"
        disabled={authing}
      >
        {authing ? 'Authenticating…' : 'Unlock'}
      </Button>
    </View>
  );
}
