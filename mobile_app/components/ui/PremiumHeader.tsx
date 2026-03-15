import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface PremiumHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  gradient?: boolean;
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  gradient = false,
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const HeaderContent = (
    <View style={[
      styles.content, 
      { 
        paddingTop: Platform.OS === 'ios' ? 0 : insets.top,
        height: 80 + (Platform.OS === 'ios' ? 0 : insets.top)
      }
    ]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={gradient ? 'white' : theme.text} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={[styles.title, { color: gradient ? 'white' : theme.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: gradient ? 'rgba(255,255,255,0.8)' : theme.muted }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.right}>
        {rightAction}
      </View>
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        {HeaderContent}
      </LinearGradient>
    );
  }

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.background,
        paddingTop: insets.top,
        borderBottomWidth: 1,
        borderBottomColor: theme.border
      }
    ]}>
      {HeaderContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
});
