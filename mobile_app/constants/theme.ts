import { Platform } from 'react-native';

const primary = '#6366f1'; // Indigo
const secondary = '#a855f7'; // Purple
const success = '#10b981'; // Emerald
const warning = '#f59e0b'; // Amber
const danger = '#ef4444'; // Rose
const info = '#0ea5e9'; // Sky

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
    muted: '#64748b',
    subtle: '#f1f5f9',
    glass: 'rgba(255, 255, 255, 0.7)',
  },
  dark: {
    text: '#f8fafc',
    background: '#020617',
    tint: primary,
    icon: '#94a3b8',
    tabIconDefault: '#334155',
    tabIconSelected: primary,
    card: '#0f172a',
    border: '#1e293b',
    primary,
    secondary,
    success,
    warning,
    danger,
    info,
    muted: '#94a3b8',
    subtle: '#1e293b',
    glass: 'rgba(15, 23, 42, 0.7)',
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


