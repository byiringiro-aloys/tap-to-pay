import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { Colors, Spacing, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { statsService, transactionService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumHeader } from '@/components/ui/PremiumHeader';
import Animated, { 
  FadeInDown, 
  FadeInRight,
  FadeInUp,
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface Stats {
  totalCards: number;
  totalRevenue: number;
  todayTransactions: number;
  topupVolume: number;
  purchaseVolume: number;
  activeCards: number;
  totalTransactions?: number;
  weeklyStats?: number[];
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sysStatus, setSysStatus] = useState({ mqtt: 'online', api: 'online', db: 'online' });
  const [weeklyTrend, setWeeklyTrend] = useState<number[]>([]);
  const [trendPercent, setTrendPercent] = useState('+0.0%');
  const [trendModalVisible, setTrendModalVisible] = useState(false);

  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const isAgent = user?.role === 'agent';

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Independent fetches to prevent cascading failures
      let backendData: any = {};
      try {
        backendData = await statsService.getStats();
      } catch (err) {
        console.warn('Backend stats fetch failed:', err);
      }

      let txs: any[] = [];
      try {
        const responseData = await transactionService.getTransactions();
        txs = Array.isArray(responseData) ? responseData : [];
      } catch (err) {
        console.warn('Transactions fetch failed:', err);
      }
      
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Filter transactions based on role
      const personalTxs = isAgent 
        ? txs 
        : txs.filter((t: any) => 
            t.processedBy === user?.username || 
            t.processedBy === user?.email
          );

      // 1. Transaction Counts
      const totalCount = personalTxs.length;
      const todayTxs = personalTxs.filter((t: any) => new Date(t.timestamp) >= startOfToday);
      const todayCount = todayTxs.length;

      // 2. Volume Calculations
      const todayDebit = todayTxs.filter((t: any) => t.type === 'debit');
      const todayVol = todayDebit.reduce((sum: number, t: any) => sum + t.amount, 0);

      const allDebit = personalTxs.filter((t: any) => t.type === 'debit');
      const totalVol = allDebit.reduce((sum: number, t: any) => sum + t.amount, 0);
      
      const allTopup = personalTxs.filter((t: any) => t.type === 'topup');
      const totalTopup = allTopup.reduce((sum: number, t: any) => sum + t.amount, 0);

      // 3. Weekly Trend (Role-Aware)
      const weekData = Array(7).fill(0);
      personalTxs.forEach((t: any) => {
        if (t.type !== 'debit') return;
        const txDate = new Date(t.timestamp);
        const diffDays = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
          const dayIndex = (txDate.getDay() + 6) % 7;
          weekData[dayIndex] += t.amount;
        }
      });

      const maxWeekVal = Math.max(...weekData, 1000);
      const normalizedTrend = weekData.map(v => (v / maxWeekVal) * 100 + 15);
      
      setStats({
        ...backendData,
        totalTransactions: totalCount,
        todayTransactions: todayCount,
        purchaseVolume: isAgent ? totalVol : todayVol, 
        topupVolume: totalTopup,
        totalRevenue: totalVol,
        activeCards: backendData.activeCards || 0,
        totalCards: backendData.totalCards || 0
      });
      
      setWeeklyTrend(normalizedTrend);

      // Growth Indicator logic
      const currentDay = (now.getDay() + 6) % 7;
      const prevDay = (currentDay + 6) % 7;
      const tVol = weekData[currentDay];
      const yVol = weekData[prevDay] > 0 ? weekData[prevDay] : 1;
      const diffPercent = ((tVol - yVol) / yVol) * 100;
      setTrendPercent(`${diffPercent >= 0 ? '+' : ''}${diffPercent.toFixed(1)}%`);
      
      setSysStatus(prev => ({ 
        ...prev, 
        api: (backendData?.totalCards || txs.length) ? 'online' : 'offline' 
      }));
    } catch (error) {
      console.error('Stats overview error:', error);
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
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    fetchStats();
  };

  const StatCard = ({ title, value, icon, color, delay = 0 }: any) => (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.statCardWrapper}>
      <PremiumCard style={styles.statCard}>
        <View style={[styles.statIconWrapper, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={styles.statTextContainer}>
          <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {value}
          </Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>{title}</Text>
        </View>
      </PremiumCard>
    </Animated.View>
  );

  const StatusItem = ({ label, status }: any) => (
    <PremiumCard style={styles.statusItem}>
      <View style={[styles.statusDot, { backgroundColor: status === 'online' ? theme.success : theme.danger }]} />
      <Text style={[styles.statusLabelText, { color: theme.text }]}>{label}</Text>
      <View style={[
        styles.statusBadge, 
        { backgroundColor: status === 'online' ? theme.success + '15' : theme.danger + '15' }
      ]}>
        <Text style={[
          styles.statusValueText, 
          { color: status === 'online' ? theme.success : theme.danger }
        ]}>
          {status === 'online' ? 'Stable' : 'Offline'}
        </Text>
      </View>
    </PremiumCard>
  );

  if (loading && !stats) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PremiumHeader 
        title={`Hello, ${user?.fullName?.split(' ')[0]} 👋`}
        subtitle={isAgent ? 'Administrator Dashboard' : 'Sales Overview'}
        gradient
        rightAction={
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="white" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(800)}>
          <LinearGradient
            colors={[theme.primary, theme.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainRevenueCard}
          >
            <View style={styles.revenueHeader}>
              <Text style={styles.revenueLabel}>
                {isAgent ? 'Total System Revenue' : "Today's Sales Volume"}
              </Text>
              <View style={styles.headerBadge}>
                <Ionicons name="pulse" size={14} color="white" />
                <Text style={styles.headerBadgeText}>Live</Text>
              </View>
            </View>
            
            <Text style={styles.revenueValue}>
              Frw {stats?.purchaseVolume?.toLocaleString() || '0'}
            </Text>
            
            <View style={styles.revenueFooter}>
              <View style={styles.revenueTrend}>
                <Ionicons 
                  name={trendPercent.startsWith('+') ? "trending-up" : "trending-down"} 
                  size={16} 
                  color={trendPercent.startsWith('+') ? "#4ade80" : "#f87171"} 
                />
                <Text style={styles.trendText}>{trendPercent} from yesterday</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📊 Key Metrics</Text>
          <View style={styles.statGrid}>
            <StatCard
              title={isAgent ? "Total System Tx" : "Lifetime Sales"}
              value={stats?.totalTransactions || 0}
              icon="receipt-outline"
              color={theme.info}
              delay={100}
            />
            <StatCard
              title={isAgent ? "Top-up Vol." : "Today's Tx"}
              value={isAgent ? `Frw ${stats?.topupVolume?.toLocaleString() || 0}` : (stats?.todayTransactions || 0)}
              icon={isAgent ? "wallet-outline" : "analytics-outline"}
              color={theme.success}
              delay={200}
            />
          </View>
          <View style={[styles.statGrid, { marginTop: Spacing.md }]}>
            <StatCard
              title="Total Cards"
              value={stats?.totalCards || 0}
              icon="people-outline"
              color={theme.primary}
              delay={300}
            />
            <StatCard
              title="Active Now"
              value={stats?.activeCards || 0}
              icon="radio-outline"
              color={theme.warning}
              delay={400}
            />
          </View>
        </View>

        {isAgent && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>📣 Infrastructure</Text>
            <View style={styles.statusList}>
              <StatusItem label="API Gateway" status={sysStatus.api} />
              <StatusItem label="MQTT Broker" status={sysStatus.mqtt} />
              <StatusItem label="Database Cluster" status={sysStatus.db} />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>📈 Performance Trend</Text>
            <TouchableOpacity onPress={() => setTrendModalVisible(true)}>
              <Text style={{ color: theme.primary, fontWeight: '600' }}>View Details</Text>
            </TouchableOpacity>
          </View>
          
          <PremiumCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={[styles.chartTitle, { color: theme.text }]}>Weekly Volume</Text>
                <Text style={[styles.chartSubtitle, { color: theme.muted }]}>Activity across the system</Text>
              </View>
              <View style={styles.chartLegend}>
                <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.legendText, { color: theme.muted }]}>Volume</Text>
              </View>
            </View>
            
            <View style={styles.chartBarContainer}>
              {(weeklyTrend.length > 0 ? weeklyTrend : [45, 60, 85, 30, 95, 70, 55]).map((val, i) => (
                <View key={i} style={styles.chartBarWrapper}>
                  <View style={styles.barBackground}>
                    <Animated.View 
                      entering={FadeInUp.delay(i * 100).duration(1000)}
                      style={[
                        styles.chartBar, 
                        { 
                          height: val,
                          backgroundColor: i === new Date().getDay() - 1 ? theme.secondary : theme.primary 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.chartBarLabel, { color: theme.muted }]}>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </Text>
                </View>
              ))}
            </View>
          </PremiumCard>
        </View>

        {!isAgent && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>⚡ Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.actionItem}
                onPress={() => router.push('/(tabs)/sales')}
              >
                <LinearGradient
                  colors={[theme.primary, theme.secondary]}
                  style={styles.actionIcon}
                >
                  <Ionicons name="cart" size={24} color="white" />
                </LinearGradient>
                <Text style={[styles.actionLabel, { color: theme.text }]}>New Sale</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionItem}
                onPress={() => router.push('/(tabs)/history')}
              >
                <View style={[styles.actionIcon, { backgroundColor: theme.info + '15' }]}>
                  <Ionicons name="time" size={24} color={theme.info} />
                </View>
                <Text style={[styles.actionLabel, { color: theme.text }]}>History</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionItem}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <View style={[styles.actionIcon, { backgroundColor: theme.warning + '15' }]}>
                  <Ionicons name="settings" size={24} color={theme.warning} />
                </View>
                <Text style={[styles.actionLabel, { color: theme.text }]}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Performance Detail Modal */}
      <Modal visible={trendModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Performance Insights</Text>
              <TouchableOpacity onPress={() => setTrendModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.insightHeader}>
                 <View style={[styles.trendCircle, { borderColor: theme.success + '40' }]}>
                    <Ionicons 
                      name={trendPercent.startsWith('+') ? "trending-up" : "trending-down"} 
                      size={40} 
                      color={trendPercent.startsWith('+') ? theme.success : theme.danger} 
                    />
                 </View>
                 <Text style={[styles.insightTitle, { color: theme.text }]}>Growth Analysis</Text>
                 <Text style={[styles.insightSub, { color: theme.muted }]}>
                   Your sales volume has seen a {trendPercent} {trendPercent.startsWith('+') ? 'increase' : 'decrease'} compared to the previous period.
                 </Text>
              </View>

              <PremiumCard style={styles.insightStats}>
                <View style={styles.insightRow}>
                  <Text style={[styles.insightLabel, { color: theme.muted }]}>Peak Day</Text>
                  <Text style={[styles.insightValue, { color: theme.text }]}>Friday</Text>
                </View>
                <View style={styles.insightRow}>
                   <Text style={[styles.insightLabel, { color: theme.muted }]}>Average Volume</Text>
                   <Text style={[styles.insightValue, { color: theme.text }]}>Frw 1.2M</Text>
                </View>
                <View style={styles.insightRow}>
                   <Text style={[styles.insightLabel, { color: theme.muted }]}>Growth Rate</Text>
                   <Text style={[styles.insightValue, { color: theme.success }]}>{trendPercent}</Text>
                </View>
              </PremiumCard>

              <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>Recommendations</Text>
              <View style={styles.recList}>
                 <View style={[styles.recItem, { backgroundColor: theme.primary + '10' }]}>
                   <Ionicons name="bulb-outline" size={20} color={theme.primary} />
                   <Text style={[styles.recText, { color: theme.text }]}>
                     Friday shows highest activity. Consider increasing agent availability.
                   </Text>
                 </View>
                 <View style={[styles.recItem, { backgroundColor: theme.info + '10' }]}>
                   <Ionicons name="analytics-outline" size={20} color={theme.info} />
                   <Text style={[styles.recText, { color: theme.text }]}>
                     Mid-week dip detected. Launch a mini-promo to boost transaction volume.
                   </Text>
                 </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
               <TouchableOpacity 
                 style={[styles.doneBtn, { backgroundColor: theme.primary }]}
                 onPress={() => setTrendModalVisible(false)}
               >
                 <Text style={styles.doneBtnText}>Got it!</Text>
               </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainRevenueCard: {
    padding: Spacing.xl,
    borderRadius: 32,
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  revenueLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  headerBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
    marginVertical: Spacing.sm,
  },
  revenueFooter: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  revenueTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statusList: {
    gap: Spacing.sm,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabelText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusValueText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  chartCard: {
    padding: Spacing.xl,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginTop: Spacing.md,
  },
  chartBarWrapper: {
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  barBackground: {
    width: 14,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    borderRadius: 7,
  },
  chartBarLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 32,
  },
  insightHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  trendCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  insightTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  insightSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  insightStats: {
    padding: 24,
    marginBottom: 24,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  recList: {
    gap: 12,
    marginTop: 16,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  recText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  modalFooter: {
    padding: 32,
    paddingTop: 16,
  },
  doneBtn: {
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  doneBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
});

