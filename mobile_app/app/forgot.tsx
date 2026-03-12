import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { authService } from '@/services/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
      style={styles.container}
    >
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        style={styles.headerGradient}
      >
        <Ionicons name="key" size={80} color="white" />
        <Text style={styles.appName}>Recover Access</Text>
      </LinearGradient>

      <View style={[styles.formContainer, { backgroundColor: theme.background }]}>
        {!success ? (
          <>
            <Text style={[styles.title, { color: theme.text }]}>Forgot Password?</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>Enter your username to receive a reset link.</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Username</Text>
              <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <Ionicons name="person-outline" size={20} color={theme.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Username"
                  placeholderTextColor={theme.muted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: theme.primary }]}
              onPress={handleForgot}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successView}>
            <Ionicons name="checkmark-circle" size={80} color={theme.success} />
            <Text style={[styles.title, { color: theme.text }]}>Link Sent!</Text>
            <Text style={[styles.subtitle, { color: theme.muted, textAlign: 'center' }]}>
                If an account exists for {username}, you will receive an email with instructions shortly.
            </Text>
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: theme.primary, width: '100%', marginTop: 20 }]}
              onPress={() => router.replace('/login')}
            >
                <Text style={styles.loginButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.footer} onPress={() => router.back()}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { height: '35%', justifyContent: 'center', alignItems: 'center' },
  appName: { fontSize: 28, fontWeight: '800', color: 'white', marginTop: 10 },
  formContainer: { flex: 1, marginTop: -30, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15, marginBottom: 32 },
  inputGroup: { marginBottom: 30 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  loginButton: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: '700' },
  successView: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  footer: { marginTop: 40, alignItems: 'center' },
});
