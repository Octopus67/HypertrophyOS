/**
 * Theme Store — Zustand with AsyncStorage persistence
 *
 * Manages light/dark/system theme preference. Default: dark.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => {
          if (s.theme === 'dark') return { theme: 'light' };
          if (s.theme === 'light') return { theme: 'system' };
          return { theme: 'dark' };
        }),
    }),
    {
      name: '@repwise:theme',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
