import { Platform } from 'react-native';

const primary = '#0F172A'; // Obsidian Slate (Premium Dark)
const secondary = '#1E3A8A'; // Deep Midnight Blue
const success = '#10b981'; // Emerald
const warning = '#f59e0b'; // Amber
const danger = '#e11d48'; // Premium Rose/Red
const info = '#0284c7'; // Rich Sky

export const Colors = {
  light: {
    text: '#0f172a',
    background: '#f8fafc',
    tint: primary,
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: primary,
    card: '#ffffff',
    border: '#e2e8f0',
    primary,
    secondary,
    success,
    warning,
    danger,
    info,
    muted: '#475569',
    subtle: '#f1f5f9',
    glass: 'rgba(255, 255, 255, 0.85)',
  },
  dark: {
    text: '#f8fafc',
    background: '#020617',
    tint: '#38bdf8',
    icon: '#94a3b8',
    tabIconDefault: '#475569',
    tabIconSelected: '#38bdf8',
    card: '#0B1121', // Deeper than base background
    border: '#1e293b',
    primary: '#1E293B', // Slightly lighter slate for dark mode cards if needed, but primary actions might be better as an accent
    secondary: '#0F172A', // Dark slate
    success,
    warning,
    danger,
    info,
    muted: '#94a3b8',
    subtle: '#1e293b',
    glass: 'rgba(15, 23, 42, 0.85)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'System',
    mono: 'Courier New',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});


