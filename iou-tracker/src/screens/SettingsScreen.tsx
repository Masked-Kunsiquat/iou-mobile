// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Appbar, List, Switch, Text, RadioButton, Button, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../theme/ThemeProvider';
import { useSecurityStore } from '../store/securityStore';
import { authenticate } from '../security/biometrics';

const OPTIONS = [
  { label: '1 minute', ms: 60_000 },
  { label: '5 minutes', ms: 5 * 60_000 },
  { label: '15 minutes', ms: 15 * 60_000 },
  { label: '1 hour', ms: 60 * 60_000 },
];

export default function SettingsScreen({ onBack }: { onBack?: () => void }) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { biometricsEnabled, sessionMs, setEnabled, setSessionMs, clearSession } = useSecurityStore();
  const [updating, setUpdating] = useState(false); // prevents concurrent prompts

  const onToggleBiometrics = async (next: boolean) => {
    if (updating) return;
    setUpdating(true);
    try {
      if (next) {
        // Prompt immediately; only enable on success
        const res = await authenticate('Enable biometric unlock');
        if (res.ok) {
          setEnabled(true);
          clearSession(); // why: force fresh auth window right after enabling
        } else {
          setEnabled(false); // keep disabled if unsupported/cancelled
        }
      } else {
        setEnabled(false);
        clearSession(); // why: lock immediately when turning off/on states change
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Appbar.Header statusBarHeight={insets.top}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 16 + insets.bottom }}
      >
        <List.Section>
          <List.Subheader>Security</List.Subheader>

          <View style={{ backgroundColor: colors.surface, borderRadius: 8 }}>
            <List.Item
              title="Require biometric unlock"
              description="Lock app on launch and when returning from background"
              right={() => (
                <Switch
                  accessibilityLabel="Toggle biometric unlock"
                  value={biometricsEnabled}
                  disabled={updating}
                  onValueChange={onToggleBiometrics}
                />
              )}
            />
            <Divider />

            <List.Item title="Grace period" description="Skip re-auth within this time window" />
            <RadioButton.Group onValueChange={(v) => setSessionMs(Number(v))} value={String(sessionMs)}>
              {OPTIONS.map((opt) => (
                <View
                  key={opt.ms}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ color: colors.textPrimary }}>{opt.label}</Text>
                  <RadioButton value={String(opt.ms)} />
                </View>
              ))}
            </RadioButton.Group>

            <View style={{ padding: 16 }}>
              <Button mode="outlined" onPress={() => clearSession()} disabled={updating}>
                Lock now
              </Button>
            </View>
          </View>
        </List.Section>
      </ScrollView>
    </>
  );
}
