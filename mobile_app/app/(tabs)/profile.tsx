import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, Platform, TouchableOpacity, Modal, Switch } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumHeader } from '@/components/ui/PremiumHeader';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { transactionService } from '@/services/api';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [stats, setStats] = useState({ salesCount: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [securityVisible, setSecurityVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [pushReceipts, setPushReceipts] = useState(true);
  const [emailReports, setEmailReports] = useState(false);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const txs = await transactionService.getTransactions();
      const safeTxs = Array.isArray(txs) ? txs : [];
      
      // Salesperson only sees their own transactions
      // Agent sees everything
      const userTxs = user?.role === 'agent' 
        ? safeTxs 
        : safeTxs.filter((t: any) => 
            t.processedBy === user?.username || 
            t.processedBy === user?.email ||
            t.uid === user?.id // Legacy fallback
          );
      
      const salesTxs = userTxs.filter((t: any) => t.type === 'debit');
      const revenue = salesTxs.reduce((sum: number, t: any) => sum + t.amount, 0);
      
      setStats({
        salesCount: salesTxs.length,
        revenue
      });
    } catch (error) {
      console.error('Profile stats error:', error);
      // Fallback to zeros on error to avoid sticking on dots/stale data
      setStats({ salesCount: 0, revenue: 0 });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserStats();
    }, [user])
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from Tap & Pay?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const ProfileItem = ({ icon, label, value, color, last = false }: any) => (
    <View style={[
      styles.profileItem,
      !last && { borderBottomWidth: 1, borderBottomColor: theme.border }
    ]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color || theme.primary} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemLabel, { color: theme.muted }]}>{label}</Text>
        <Text style={[styles.itemValue, { color: theme.text }]}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PremiumHeader
        title="Profile"
        subtitle="User Account Details"
        gradient
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeInUp.duration(600)} style={styles.headerSection}>
          <LinearGradient
            colors={[theme.primary, theme.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
            </View>
          </LinearGradient>

          <Text style={[styles.userName, { color: theme.text }]}>{user?.fullName}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.primary + '15' }]}>
            <Text style={[styles.userRole, { color: theme.primary }]}>{user?.role?.toUpperCase()}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Statistics</Text>
          <View style={styles.statsGrid}>
            <PremiumCard style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {loading ? '...' : stats.salesCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.muted }]}>Sales</Text>
            </PremiumCard>
            <PremiumCard style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.success }]}>
                {loading ? '...' : `Frw ${(stats.revenue / 1000).toFixed(1)}K`}
              </Text>
              <Text style={[styles.statLabel, { color: theme.muted }]}>Revenue</Text>
            </PremiumCard>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Details</Text>
          <PremiumCard style={styles.infoCard}>
            <ProfileItem icon="person-outline" label="Username" value={user?.username} color={theme.primary} />
            <ProfileItem icon="mail-outline" label="Email Address" value={user?.email} color={theme.info} />
            <ProfileItem icon="shield-checkmark-outline" label="Status" value="Active Account" color={theme.success} last />
          </PremiumCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
          <PremiumCard style={styles.infoCard}>
            <TouchableOpacity 
              style={styles.settingsRow}
              onPress={() => setSecurityVisible(true)}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.warning + '15' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.warning} />
              </View>
              <Text style={[styles.settingsText, { color: theme.text }]}>Security Settings</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.muted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingsRow, { borderTopWidth: 1, borderTopColor: theme.border }]}
              onPress={() => setNotificationsVisible(true)}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.info + '15' }]}>
                <Ionicons name="notifications-outline" size={20} color={theme.info} />
              </View>
              <Text style={[styles.settingsText, { color: theme.text }]}>Notifications</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.muted} />
            </TouchableOpacity>
          </PremiumCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <PremiumButton
            title="Sign Out"
            onPress={handleLogout}
            variant="danger"
            icon={<Ionicons name="log-out-outline" size={20} color="white" />}
            style={styles.logoutButton}
          />
          <Text style={[styles.versionText, { color: theme.muted }]}> Tap & Pay • Build 1.0.24</Text>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Security Settings Modal */}
      <Modal visible={securityVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Security Settings</Text>
              <TouchableOpacity onPress={() => setSecurityVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.settingToggleRow}>
                <View style={styles.settingToggleInfo}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Biometric Authentication</Text>
                  <Text style={[styles.settingDesc, { color: theme.muted }]}>Use FaceID or Fingerprint to log in</Text>
                </View>
                <Switch 
                  value={biometricEnabled} 
                  onValueChange={setBiometricEnabled}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>
              <View style={styles.settingToggleRow}>
                <View style={styles.settingToggleInfo}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Two-Factor Authentication</Text>
                  <Text style={[styles.settingDesc, { color: theme.muted }]}>Require a code when logging in</Text>
                </View>
                <Switch 
                  value={twoFactorEnabled} 
                  onValueChange={setTwoFactorEnabled}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>
              <PremiumButton 
                title="Change Password" 
                variant="outline"
                icon={<Ionicons name="key-outline" size={20} color={theme.primary} />}
                onPress={() => Alert.alert('Change Password', 'Password change instructions have been sent to your email.')}
                style={{ marginTop: Spacing.xl }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={notificationsVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.settingToggleRow}>
                <View style={styles.settingToggleInfo}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Push Receipts</Text>
                  <Text style={[styles.settingDesc, { color: theme.muted }]}>Receive instant notifications for transactions</Text>
                </View>
                <Switch 
                  value={pushReceipts} 
                  onValueChange={setPushReceipts}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>
              <View style={styles.settingToggleRow}>
                <View style={styles.settingToggleInfo}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Daily Email Reports</Text>
                  <Text style={[styles.settingDesc, { color: theme.muted }]}>Get daily summary at end of day</Text>
                </View>
                <Switch 
                  value={emailReports} 
                  onValueChange={setEmailReports}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  headerSection: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
    ...Shadows.md,
    marginBottom: Spacing.lg + 10,
  },
  avatarInner: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  infoCard: {
    padding: 0,
    overflow: 'hidden',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
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
    fontSize: 15,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  settingsText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: Spacing.xxl,
  },
  versionText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    minHeight: '40%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  modalBody: {
    padding: Spacing.xl,
  },
  settingToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  settingToggleInfo: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});

