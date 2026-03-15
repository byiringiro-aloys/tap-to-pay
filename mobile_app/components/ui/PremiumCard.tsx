import React from 'react';
import { StyleSheet, View, ViewStyle, Platform, StyleProp } from 'react-native';
import { Colors, Spacing, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BlurView } from 'expo-blur';

interface PremiumCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glass?: boolean;
  intensity?: number;
  elevated?: boolean;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({ 
  children, 
  style, 
  glass = false,
  intensity = 30,
  elevated = true
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  if (glass && Platform.OS !== 'web') {
    return (
      <View style={[
        styles.container, 
        { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
        elevated && Shadows.md, 
        style
      ]}>
        <BlurView intensity={intensity} style={styles.blur} tint={colorScheme}>
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.card,
        borderColor: theme.border,
        borderWidth: 1,
      }, 
      elevated && Shadows.sm, 
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  blur: {
    padding: Spacing.lg,
    width: '100%',
  },
});
