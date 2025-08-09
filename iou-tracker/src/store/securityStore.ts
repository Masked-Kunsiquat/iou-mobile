// src/store/securityStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SecurityState = {
  biometricsEnabled: boolean;
  sessionMs: number;           // grace period
  lastAuthAt: number | null;   // epoch ms of last success
  setEnabled: (v: boolean) => void;
  setSessionMs: (ms: number) => void;
  markAuthed: () => void;
  clearSession: () => void;
};

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set) => ({
      biometricsEnabled: true,
      sessionMs: 5 * 60 * 1000, // default 5 min
      lastAuthAt: null,
      setEnabled: (v) => set({ biometricsEnabled: v }),
      setSessionMs: (ms) => set({ sessionMs: ms }),
      markAuthed: () => set({ lastAuthAt: Date.now() }),
      clearSession: () => set({ lastAuthAt: null }),
    }),
    {
      name: 'security-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        biometricsEnabled: s.biometricsEnabled,
        sessionMs: s.sessionMs,
        lastAuthAt: s.lastAuthAt,
      }),
    }
  )
);
