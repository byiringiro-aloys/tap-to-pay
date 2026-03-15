import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { authService } from '@/services/api';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumInput } from '@/components/ui/PremiumInput';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function ForgotScreen() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const handleForgot = async () => {
    if (!username) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(username);
      setSuccess(true);
    } catch (error: any) {
      Alert.alert('Request Failed', error.message || 'Check your username and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient
            colors={[theme.primary, theme.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
        >
            <Animated.View entering={FadeInDown.duration(800)}>
                <Ionicons name="key" size={80} color="white" />
            </Animated.View>
            <Animated.Text entering={FadeInUp.delay(200).duration(800)} style={styles.appName}>Recover Access</Animated.Text>
        </LinearGradient>

        <View style={[styles.formContainer, { backgroundColor: theme.background }]}>
            {!success ? (
            <>
                <Animated.View entering={FadeInUp.delay(400).duration(800)}>
                    <Text style={[styles.title, { color: theme.text }]}>Forgot Password?</Text>
                    <Text style={[styles.subtitle, { color: theme.muted }]}>
                        Enter your username below and we'll send you instructions to reset your password if your account is found.
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(600).duration(800)}>
                    <PremiumInput
                        label="Username"
                        placeholder="Enter your username"
                        value={username}
                        onChangeText={setUsername}
                        icon="person-outline"
                    />

                    <PremiumButton
                        title="Send Reset Instructions"
                        onPress={handleForgot}
                        loading={loading}
                        style={{ marginTop: Spacing.xl }}
                        gradient
                    />
                </Animated.View>
            </>
            ) : (
            <Animated.View entering={FadeInDown.duration(800)} style={styles.successView}>
                <View style={[styles.successIconWrap, { backgroundColor: theme.success + '15' }]}>
                    <Ionicons name="checkmark-circle" size={100} color={theme.success} />
                </View>
                <Text style={[styles.title, { color: theme.text, marginTop: 24 }]}>Link Sent!</Text>
                <Text style={[styles.subtitle, { color: theme.muted, textAlign: 'center' }]}>
                    If an account exists for {username}, you will receive an email with instructions shortly.
                </Text>
                <PremiumButton
                    title="Back to Login"
                    onPress={() => router.replace('/login')}
                    variant="outline"
                    style={{ width: '100%', marginTop: 32 }}
                />
            </Animated.View>
            )}

            {!success && (
                <Animated.View entering={FadeInUp.delay(800).duration(800)}>
                    <TouchableOpacity style={styles.footer} onPress={() => router.back()}>
                        <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16 }}>
                            ← Back to Login
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { 
    height: 300, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingTop: 40 
  },
  appName: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: 'white', 
    marginTop: 16,
    letterSpacing: -1 
  },
  formContainer: { 
    flex: 1, 
    marginTop: -40, 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: 32,
    paddingTop: 40 
  },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginBottom: 40, lineHeight: 22, fontWeight: '500' },
  successView: { alignItems: 'center', justifyContent: 'center', paddingTop: 20 },
  successIconWrap: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  footer: { marginTop: 40, alignItems: 'center' },
});
