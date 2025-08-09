// src/store/securityStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persist version history
 * v1: add `hydrated` runtime flag, default biometricsEnabled=false
 */
export type SecurityState = {
  biometricsEnabled: boolean;
  sessionMs: number; // grace period
  lastAuthAt: number | null; // epoch ms of last success
  hydrated: boolean; // true after persist rehydration completes
  setEnabled: (v: boolean) => void;
  setSessionMs: (ms: number) => void;
  markAuthed: () => void;
  clearSession: () => void;
};

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      biometricsEnabled: false, // default false to avoid first-launch lockout
      sessionMs: 5 * 60 * 1000,
      lastAuthAt: null,
      hydrated: false,
      setEnabled: (v) => set({ biometricsEnabled: v }),
      setSessionMs: (ms) => set({ sessionMs: ms }),
      markAuthed: () => set({ lastAuthAt: Date.now() }),
      clearSession: () => set({ lastAuthAt: null }),
    }),
    {
      name: 'security-settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        biometricsEnabled: s.biometricsEnabled,
        sessionMs: s.sessionMs,
        lastAuthAt: s.lastAuthAt,
        // `hydrated` is runtime-only; do not persist
      }),
      migrate: async (persisted, fromVersion) => {
        // Ensure sane defaults if coming from older versions
        const p = (persisted as Partial<SecurityState>) ?? {};
        return {
          biometricsEnabled: p.biometricsEnabled ?? false,
          sessionMs: p.sessionMs ?? 5 * 60 * 1000,
          lastAuthAt: p.lastAuthAt ?? null,
          // hydrated is handled by onRehydrateStorage
          hydrated: false,
          setEnabled: () => {},
          setSessionMs: () => {},
          markAuthed: () => {},
          clearSession: () => {},
        } as unknown as SecurityState;
      },
      onRehydrateStorage: () => (state, error) => {
        // Mark store ready only after rehydration completes
        // Why: prevents premature gating using default state
        state?.setEnabled &&
          // Rebind setters (migrate returns no-op placeholders); ensure we keep runtime methods
          Object.assign(state, {
            setEnabled: (v: boolean) => useSecurityStore.setState({ biometricsEnabled: v }),
            setSessionMs: (ms: number) => useSecurityStore.setState({ sessionMs: ms }),
            markAuthed: () => useSecurityStore.setState({ lastAuthAt: Date.now() }),
            clearSession: () => useSecurityStore.setState({ lastAuthAt: null }),
          });
        useSecurityStore.setState({ hydrated: true });
      },
    }
  )
);

// ----------------------------------------------------------------------------
// Example usage: update AuthGate to respect hydration before enforcing lock
// ----------------------------------------------------------------------------
// src/components/AuthGate.tsx
// import React from 'react';
// import { useSecurityStore } from '@/store/securityStore';
//
// type Props = { children: React.ReactNode; LockScreen: React.ComponentType; Loading?: React.ComponentType };
//
// export default function AuthGate({ children, LockScreen, Loading }: Props) {
//   const { hydrated, biometricsEnabled, lastAuthAt, sessionMs } = useSecurityStore();
//
//   if (!hydrated) {
//     return Loading ? <Loading /> : null; // render nothing or a spinner until ready
//   }
//
//   const now = Date.now();
//   const inSession = lastAuthAt != null && now - lastAuthAt <= sessionMs;
//   const locked = biometricsEnabled && !inSession;
//
//   if (locked) return <LockScreen />;
//   return <>{children}</>;
// }
