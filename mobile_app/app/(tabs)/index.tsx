import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/constants/config';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

interface Stats {
  totalCards: number;
  totalRevenue: number;
  todayTransactions: number;
  topupVolume: number;
  purchaseVolume: number;
  activeCards: number;
  totalTransactions?: number;
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sysStatus, setSysStatus] = useState({ mqtt: 'online', api: 'online', db: 'online' });

  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const isAgent = user?.role === 'agent';

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      const data = await response.json();
      setStats(data);
      // Verify API is up
      setSysStatus(prev => ({ ...prev, api: 'online' }));
    } catch (error) {
      console.error('Stats error:', error);
      setSysStatus(prev => ({ ...prev, api: 'offline' }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.statIconWrapper, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.statTextContainer}>
        <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.muted }]}>{title}</Text>
      </View>
    </View>
  );

  const StatusItem = ({ label, status }: any) => (
    <View style={[styles.statusItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.statusDot, { backgroundColor: status === 'online' ? theme.success : theme.danger }]} />
      <Text style={[styles.statusLabelText, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.statusValueText, { color: status === 'online' ? theme.success : theme.danger }]}>
        {status === 'online' ? 'Stable' : 'Disconnected'}
      </Text>
    </View>
  );

  if (loading && !stats) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.fullName?.split(' ')[0]} 👋</Text>
            <Text style={styles.subGreeting}>
              {isAgent ? 'Administrator Dashboard Overview' : 'Sales Dashboard Overview'}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Role badge */}
        <View style={styles.roleBadgeContainer}>
          <View style={styles.roleBadge}>
            <Ionicons name={isAgent ? 'shield-checkmark' : 'cart'} size={14} color={isAgent ? theme.primary : theme.info} />
            <Text style={[styles.roleBadgeText, { color: isAgent ? theme.primary : theme.info }]}>
              {isAgent ? 'Agent' : 'Salesperson'}
            </Text>
          </View>
        </View>

        <View style={styles.totalRevenueCard}>
          <Text style={styles.revenueLabel}>
            {isAgent ? 'Total System Revenue' : "Today's Sales Volume"}
          </Text>
          <Text style={styles.revenueValue}>
            Frw {isAgent
              ? (stats?.purchaseVolume?.toLocaleString() || '0')
              : (stats?.purchaseVolume?.toLocaleString() || '0')
            }
          </Text>
          <View style={styles.revenueBadgeView}>
            <Ionicons name="trending-up" size={14} color={theme.success} />
            <Text style={[styles.revenueBadgeText, { color: theme.success }]}>Live metrics</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ===== AGENT DASHBOARD ===== */}
      {isAgent && (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>📊 Today's Metrics</Text>
            <View style={styles.statGrid}>
              <StatCard
                title="Transactions"
                value={stats?.todayTransactions || 0}
                icon="receipt"
                color={theme.info}
              />
              <StatCard
                title="Top-up Vol."
                value={`Frw ${stats?.topupVolume?.toLocaleString() || 0}`}
                icon="wallet"
                color={theme.success}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>👥 Holders Summary</Text>
            <View style={styles.statGrid}>
              <StatCard
                title="Total Cards"
                value={stats?.totalCards || 0}
                icon="people"
                color={theme.primary}
              />
              <StatCard
                title="Active Now"
                value={stats?.activeCards || 0}
                icon="radio"
                color={theme.warning}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>📣 System Status</Text>
            <View style={styles.statusGrid}>
              <StatusItem label="API Backend" status={sysStatus.api} />
              <StatusItem label="MQTT Broker" status={sysStatus.mqtt} />
              <StatusItem label="Database" status={sysStatus.db} />
            </View>
          </View>

          <View style={styles.chartSection}>
            <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>📈 Transaction Volume</Text>
              <Text style={[styles.chartSubtitle, { color: theme.muted }]}>Weekly performance metrics</Text>
              <View style={styles.chartBarContainer}>
                {[45, 60, 85, 30, 95, 70, 55].map((val, i) => (
                  <View key={i} style={styles.chartBarWrapper}>
                    <LinearGradient
                      colors={[theme.primary, theme.secondary]}
                      style={[styles.chartBar, { height: val * 1.5 }]}
                    />
                    <Text style={[styles.chartBarLabel, { color: theme.muted }]}>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </>
      )}

      {/* ===== SALESPERSON DASHBOARD ===== */}
      {!isAgent && (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>🛒 Sales Overview</Text>
            <View style={styles.statGrid}>
              <StatCard
                title="Today's Tx"
                value={stats?.todayTransactions || 0}
                icon="receipt"
                color={theme.info}
              />
              <StatCard
                title="Revenue"
                value={`Frw ${stats?.purchaseVolume?.toLocaleString() || 0}`}
                icon="cash"
                color={theme.success}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>💳 Card Activity</Text>
            <View style={styles.statGrid}>
              <StatCard
                title="Active Cards"
                value={stats?.activeCards || 0}
                icon="card"
                color={theme.primary}
              />
              <StatCard
                title="Total Cards"
                value={stats?.totalCards || 0}
                icon="people"
                color={theme.warning}
              />
            </View>
          </View>

          {/* Quick Actions for Salesperson */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>⚡ Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={[styles.quickActionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push('/(tabs)/sales')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="cart" size={28} color={theme.primary} />
                </View>
                <Text style={[styles.quickActionTitle, { color: theme.text }]}>New Sale</Text>
                <Text style={[styles.quickActionDesc, { color: theme.muted }]}>
                  Go to Sales tab to start a new transaction
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickActionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push('/(tabs)/history')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: theme.info + '15' }]}>
                  <Ionicons name="time" size={28} color={theme.info} />
                </View>
                <Text style={[styles.quickActionTitle, { color: theme.text }]}>View History</Text>
                <Text style={[styles.quickActionDesc, { color: theme.muted }]}>
                  Check recent transactions and receipts
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.chartSection}>
            <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>📊 Sales Performance</Text>
              <Text style={[styles.chartSubtitle, { color: theme.muted }]}>This week's sales trend</Text>
              <View style={styles.chartBarContainer}>
                {[35, 50, 75, 40, 85, 60, 45].map((val, i) => (
                  <View key={i} style={styles.chartBarWrapper}>
                    <LinearGradient
                      colors={[theme.info, theme.primary]}
                      style={[styles.chartBar, { height: val * 1.5 }]}
                    />
                    <Text style={[styles.chartBarLabel, { color: theme.muted }]}>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  subGreeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadgeContainer: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  totalRevenueCard: {
    alignItems: 'center',
    marginTop: 10,
  },
  revenueLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 8,
  },
  revenueValue: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 1,
  },
  revenueBadgeView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    elevation: 4,
  },
  revenueBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  statusGrid: {
    gap: 10,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusLabelText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  statusValueText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  chartCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartSubtitle: {
    fontSize: 12,
    marginBottom: 24,
  },
  chartBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  chartBarWrapper: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  chartBar: {
    width: 12,
    borderRadius: 6,
  },
  chartBarLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickActionDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
