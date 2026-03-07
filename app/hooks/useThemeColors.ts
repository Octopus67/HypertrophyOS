/**
 * useThemeColors — Returns the active color palette based on current theme.
 *
 * Usage: const c = useThemeColors();
 * Then use c.bg.base, c.text.primary, etc. instead of colors.xxx
 */

import { useMemo } from 'react';
import { colors as darkColors } from '../theme/tokens';
import { lightColors } from '../theme/lightColors';
import { useThemeStore } from '../store/useThemeStore';

export type ThemeColors = typeof darkColors;

/** Resolve 'system' | 'dark' | 'light' to effective 'dark' | 'light'. */
function resolveEffective(theme: string, systemScheme?: string | null): 'dark' | 'light' {
  if (theme === 'system') return systemScheme === 'light' ? 'light' : 'dark';
  return theme === 'light' ? 'light' : 'dark';
}

let _useColorScheme: (() => string | null | undefined) | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  _useColorScheme = require('react-native').useColorScheme;
} catch {
  // Not available in test/node environments
}

export function useThemeColors(): ThemeColors {
  const theme = useThemeStore((s) => s.theme);
  const systemScheme = _useColorScheme ? _useColorScheme() : null;
  const effective = resolveEffective(theme, systemScheme);
  return useMemo(
    () => (effective === 'dark' ? darkColors : (lightColors as unknown as ThemeColors)),
    [effective],
  );
}

/** Non-hook version for use outside React components (e.g. StyleSheet factories) */
export function getThemeColors(): ThemeColors {
  const theme = useThemeStore.getState().theme;
  // Outside React, we can't use useColorScheme. Default system to dark.
  const effective = theme === 'light' ? 'light' : 'dark';
  return effective === 'dark' ? darkColors : (lightColors as unknown as ThemeColors);
}
