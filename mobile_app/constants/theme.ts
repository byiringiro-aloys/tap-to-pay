/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const primary = '#6366f1'; // Indigo
const secondary = '#8b5cf6'; // Violet
const success = '#10b981'; // Green
const warning = '#f59e0b'; // Amber
const danger = '#ef4444'; // Red
const info = '#3b82f6'; // Blue

export const Colors = {
  light: {
    text: '#1f2937',
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
    muted: '#64748b'
  },
  dark: {
    text: '#f1f5f9',
    background: '#0f172a',
    tint: secondary,
    icon: '#94a3b8',
    tabIconDefault: '#475569',
    tabIconSelected: secondary,
    card: '#1e293b',
    border: '#334155',
    primary,
    secondary,
    success,
    warning,
    danger,
    info,
    muted: '#94a3b8'
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

