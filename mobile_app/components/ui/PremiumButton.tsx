import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle,
  Platform,
  StyleProp
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Colors, Spacing, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';

interface PremiumButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  gradient?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  gradient = false,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.primary,
          text: '#ffffff',
          border: 'transparent',
        };
      case 'secondary':
        return {
          bg: theme.secondary,
          text: '#ffffff',
          border: 'transparent',
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: theme.primary,
          border: theme.primary,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          text: theme.primary,
          border: 'transparent',
        };
      case 'danger':
        return {
          bg: theme.danger,
          text: '#ffffff',
          border: 'transparent',
        };
      case 'success':
        return {
          bg: theme.success,
          text: '#ffffff',
          border: 'transparent',
        };
      default:
        return {
          bg: theme.primary,
          text: '#ffffff',
          border: 'transparent',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { height: 36, padding: 12, fontSize: 14 };
      case 'md':
        return { height: 48, padding: 20, fontSize: 16 };
      case 'lg':
        return { height: 56, padding: 24, fontSize: 18 };
      default:
        return { height: 48, padding: 20, fontSize: 16 };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator color={vStyles.text} />
      ) : (
        <>
          {icon && <Animated.View style={styles.iconContainer}>{icon}</Animated.View>}
          <Text style={[
            styles.text, 
            { color: vStyles.text, fontSize: sStyles.fontSize },
            textStyle
          ]}>
            {title}
          </Text>
        </>
      )}
    </>
  );

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.8}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.container,
        {
          height: sStyles.height,
          paddingHorizontal: sStyles.padding,
          backgroundColor: gradient ? 'transparent' : vStyles.bg,
          borderColor: vStyles.border,
          borderWidth: vStyles.border === 'transparent' ? 0 : 1,
          opacity: (disabled || loading) ? 0.6 : 1,
        },
        variant === 'primary' && !gradient && Shadows.md,
        animatedStyle,
        style,
      ]}
    >
      {gradient && variant === 'primary' ? (
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, styles.gradient]}
        >
          {buttonContent}
        </LinearGradient>
      ) : (
        buttonContent
      )}
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  iconContainer: {
    marginRight: 8,
  },
});
