// src/store/securityStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persist version history
 * v1: add `hydrated` runtime flag, default biometricsEnabled=false
 * v2: add `setHydrated` action to API
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
  setHydrated: (v: boolean) => void;
};

const MAX_SESSION_MS = 86_400_000; // 24 hours

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      biometricsEnabled: false, // avoid first-launch lockout
      sessionMs: 5 * 60 * 1000,
      lastAuthAt: null,
      hydrated: false,
      setEnabled: (v) => set({ biometricsEnabled: v }),
      setSessionMs: (ms) => {
        // why: prevent negative/huge values that break gating logic
        const value = Number.isFinite(ms) ? ms : 0;
        const clamped = Math.max(0, Math.min(value, MAX_SESSION_MS));
        set({ sessionMs: clamped });
      },
      markAuthed: () => set({ lastAuthAt: Date.now() }),
      clearSession: () => set({ lastAuthAt: null }),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: 'security-settings',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        biometricsEnabled: s.biometricsEnabled,
        sessionMs: s.sessionMs,
        lastAuthAt: s.lastAuthAt,
        // hydrated & setters are runtime-only
      }),
      migrate: async (persisted, fromVersion) => {
        const p = (persisted as Partial<SecurityState>) ?? {};
        // Return a partial slice only for persisted keys; runtime fields are omitted
        const next: Partial<SecurityState> = {
          biometricsEnabled: p.biometricsEnabled ?? false,
          sessionMs: p.sessionMs ?? 5 * 60 * 1000,
          lastAuthAt: p.lastAuthAt ?? null,
        };
        return next;
      },
      onRehydrateStorage: () => () => {
        // mark store ready only after rehydration completes
        useSecurityStore.getState().setHydrated(true);
      },
    }
  )
);
