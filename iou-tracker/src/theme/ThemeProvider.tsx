import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
  MD3Theme,
} from 'react-native-paper';

// --- helpers ---------------------------------------------------------------

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('rgb(') || color.startsWith('rgba(')) return color;
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

// --- custom themes ---------------------------------------------------------

const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976d2',
    primaryContainer: '#e3f2fd',
    secondary: '#388e3c',
    secondaryContainer: '#e8f5e9',
    error: '#d32f2f',
    errorContainer: '#ffebee',
    background: '#fafafa',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    outline: '#e0e0e0',
  },
};

const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90caf9',
    primaryContainer: '#1565c0',
    secondary: '#81c784',
    secondaryContainer: '#2e7d32',
    error: '#ef5350',
    errorContainer: '#c62828',
    background: '#121212',
    surface: '#1e1e1e',
    surfaceVariant: '#2c2c2c',
    outline: '#424242',
  },
};

type ThemeContextType = {
  isDark: boolean;
  theme: MD3Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// --- provider --------------------------------------------------------------

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  useEffect(() => {
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);

  const theme = isDark ? darkTheme : lightTheme;
  const toggleTheme = () => setIsDark((v) => !v);

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}

// --- convenience hook for app-level tokens --------------------------------

export function useThemeColors() {
  const { theme } = useAppTheme();
  const c = theme.colors;

  // Derive disabled text per M3: onSurface @ 38% opacity
  const textDisabled = withAlpha(c.onSurface, 0.38);

  return {
    // Base tokens
    background: c.background,
    surface: c.surface,
    surfaceVariant: c.surfaceVariant,
    outline: c.outline,
    primary: c.primary,
    primaryContainer: c.primaryContainer,
    secondary: c.secondary,
    secondaryContainer: c.secondaryContainer,
    error: c.error,
    errorContainer: c.errorContainer,
    onSurface: c.onSurface,
    onSurfaceVariant: c.onSurfaceVariant,
    onPrimary: (c as any).onPrimary ?? '#ffffff', // safe fallback

    // App semantics
    iouColor: c.error,
    iouContainer: c.errorContainer,
    uomColor: c.secondary,
    uomContainer: c.secondaryContainer,
    settledColor: '#4caf50',
    paidColor: '#ff9800',

    // Text
    textPrimary: c.onSurface,
    textSecondary: c.onSurfaceVariant,
    textDisabled,
  };
}
