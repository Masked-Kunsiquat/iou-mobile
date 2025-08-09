// src/security/biometrics.ts
import * as LocalAuthentication from 'expo-local-authentication';

export async function authenticate(prompt = 'Unlock') {
  const hasHW = await LocalAuthentication.hasHardwareAsync();
  const enrolled = hasHW && (await LocalAuthentication.isEnrolledAsync());
  if (!hasHW) return { ok: false, error: 'Biometrics not available' };
  if (!enrolled) return { ok: false, error: 'No biometrics enrolled' };

  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    cancelLabel: 'Cancel',
    disableDeviceFallback: false, // allow PIN/passcode fallback
    requireConfirmation: false,
  });

  if (res.success) return { ok: true as const };
  if (['user_cancel', 'system_cancel', 'app_cancelled'].includes(res.error ?? '')) {
    return { ok: false as const, cancelled: true };
  }
  return { ok: false as const, error: res.error ?? 'Authentication failed' };
}
