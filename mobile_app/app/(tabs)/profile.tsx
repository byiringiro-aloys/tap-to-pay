import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
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
            <TouchableOpacity style={styles.settingsRow}>
              <View style={[styles.iconContainer, { backgroundColor: theme.warning + '15' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.warning} />
              </View>
              <Text style={[styles.settingsText, { color: theme.text }]}>Security Settings</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.muted} />
            </TouchableOpacity>

            <View style={[styles.settingsRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.info + '15' }]}>
                <Ionicons name="notifications-outline" size={20} color={theme.info} />
              </View>
              <Text style={[styles.settingsText, { color: theme.text }]}>Notifications</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.muted} />
            </View>
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
});

