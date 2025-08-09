// src/security/biometrics.ts
import * as LocalAuthentication from 'expo-local-authentication';

export async function authenticate(prompt = 'Unlock') {
  try {
    const hasHW = await LocalAuthentication.hasHardwareAsync();
    if (!hasHW) {
      return { ok: false, error: 'Biometrics not available' };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return { ok: false, error: 'No biometrics enrolled' };
    }

    // Optional: stronger check using enrolled level (can be uncommented if needed)
    // const enrolledLevel = await LocalAuthentication.getEnrolledLevelAsync();
    // if (enrolledLevel < LocalAuthentication.SecurityLevel.BIOMETRIC) {
    //   return { ok: false, error: 'Insufficient biometric security level' };
    // }

    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      requireConfirmation: false,
    });

    if (res.success) {
      return { ok: true as const };
    }

    const cancellationCodes = ['user_cancel', 'system_cancel', 'app_cancel'];
    if (cancellationCodes.includes(res.error ?? '')) {
      return { ok: false as const, cancelled: true };
    }

    return { ok: false as const, error: res.error ?? 'Authentication failed' };
  } catch (err) {
    return { ok: false, error: (err as Error).message || 'Unexpected error' };
  }
}
