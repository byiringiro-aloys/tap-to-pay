import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const ProfileItem = ({ icon, label, value, color }: any) => (
    <View style={[styles.profileItem, { borderBottomColor: theme.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color || theme.primary} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemLabel, { color: theme.muted }]}>{label}</Text>
        <Text style={[styles.itemValue, { color: theme.text }]}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.fullName}</Text>
          <Text style={styles.userRole}>{user?.role?.toUpperCase()}</Text>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Information</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ProfileItem icon="person-outline" label="Username" value={user?.username} color={theme.primary} />
          <ProfileItem icon="mail-outline" label="Email Address" value={user?.email} color={theme.info} />
          <ProfileItem icon="shield-checkmark-outline" label="Role" value={user?.role} color={theme.success} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
        <TouchableOpacity style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingsItem}>
                <Ionicons name="lock-closed-outline" size={22} color={theme.icon} />
                <Text style={[styles.settingsText, { color: theme.text }]}>Change Password</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.muted} />
            </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: theme.danger }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color={theme.danger} />
        <Text style={[styles.logoutText, { color: theme.danger }]}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={[styles.versionText, { color: theme.muted }]}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 1,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  logoutButton: {
    margin: 24,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 12,
  },
});
