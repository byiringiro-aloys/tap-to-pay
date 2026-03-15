import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { transactionService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { PremiumHeader } from '@/components/ui/PremiumHeader';
import { PremiumCard } from '@/components/ui/PremiumCard';
import Animated, { FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface Transaction {
  _id: string;
  uid: string;
  holderName: string;
  type: 'topup' | 'debit';
  amount: number;
  description: string;
  timestamp: string;
  receiptId: string;
}

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const fetchTransactions = async () => {
    try {
      const data = await transactionService.getTransactions();
      const normalized = data.map((t: any) => ({ ...t, _id: t._id || t.id }));
      setTransactions(normalized);
    } catch (error) {
      console.error('History fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [])
  );

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      // Primary Sort: Type (debit/Purchases first, then topup)
      if (a.type !== b.type) {
        return a.type === 'debit' ? -1 : 1;
      }

      // Secondary Sort: Based on user selection
      if (sortBy === 'date-desc') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === 'date-asc') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  }, [transactions, sortBy]);

  const onRefresh = () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fetchTransactions();
  };

  const renderTransaction = ({ item, index }: { item: Transaction, index: number }) => {
    const isDebit = item.type === 'debit';
    
    return (
      <Animated.View entering={FadeInRight.delay(index * 50).duration(500)}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            setSelectedTx(item);
            setModalVisible(true);
          }}
        >
          <PremiumCard style={styles.transactionCard}>
            <View style={[
                styles.iconWrapper, 
                { backgroundColor: isDebit ? theme.danger + '15' : theme.success + '15' }
            ]}>
              <Ionicons 
                name={isDebit ? "cart-outline" : "wallet-outline"} 
                size={24} 
                color={isDebit ? theme.danger : theme.success} 
              />
            </View>
            
            <View style={styles.details}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {item.description || (isDebit ? 'Purchase' : 'Top-up')}
              </Text>
              <View style={styles.metaRow}>
                <Text style={[styles.subtitle, { color: theme.muted }]}>
                  {item.holderName}
                </Text>
                <View style={[styles.dot, { backgroundColor: theme.muted }]} />
                <Text style={[styles.time, { color: theme.muted }]}>
                  {format(new Date(item.timestamp), 'HH:mm')}
                </Text>
              </View>
              <Text style={[styles.dateText, { color: theme.muted }]}>
                {format(new Date(item.timestamp), 'MMM dd, yyyy')}
              </Text>
            </View>
            
            <View style={styles.amountContainer}>
              <Text style={[
                styles.amount, 
                { color: isDebit ? theme.danger : theme.success }
              ]}>
                {isDebit ? '-' : '+'} Frw {item.amount.toLocaleString()}
              </Text>
              <View style={[styles.receiptBadge, { backgroundColor: theme.subtle }]}>
                <Text style={[styles.receipt, { color: theme.muted }]}>#{item.receiptId}</Text>
              </View>
            </View>
          </PremiumCard>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading && transactions.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PremiumHeader 
        title="History" 
        subtitle="Recent activities and payments"
        gradient
      />

      <View style={styles.sortContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortContent}>
          <SortChip 
            label="Newest" 
            active={sortBy === 'date-desc'} 
            onPress={() => setSortBy('date-desc')} 
            icon="calendar"
          />
          <SortChip 
            label="Oldest" 
            active={sortBy === 'date-asc'} 
            onPress={() => setSortBy('date-asc')} 
            icon="time"
          />
          <SortChip 
            label="Highest" 
            active={sortBy === 'amount-desc'} 
            onPress={() => setSortBy('amount-desc')} 
            icon="trending-up"
          />
          <SortChip 
            label="Lowest" 
            active={sortBy === 'amount-asc'} 
            onPress={() => setSortBy('amount-asc')} 
            icon="trending-down"
          />
        </ScrollView>
      </View>

      <FlatList
        data={sortedTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.card }]}>
              <Ionicons name="receipt-outline" size={60} color={theme.icon} />
            </View>
            <Text style={[styles.emptyText, { color: theme.text }]}>No transactions found</Text>
            <Text style={{ color: theme.muted, textAlign: 'center', maxWidth: 250 }}>
              Once you start processing payments or top-ups, they will appear here.
            </Text>
          </View>
        }
      />

      {/* Transaction Detail Modal */}
      <Modal visible={modalVisible && !!selectedTx} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.detailHeader}>
                <View style={[
                  styles.detailIconWrap, 
                  { backgroundColor: selectedTx?.type === 'debit' ? theme.danger + '15' : theme.success + '15' }
                ]}>
                  <Ionicons 
                    name={selectedTx?.type === 'debit' ? "cart" : "wallet"} 
                    size={40} 
                    color={selectedTx?.type === 'debit' ? theme.danger : theme.success} 
                  />
                </View>
                <Text style={[styles.detailAmount, { color: selectedTx?.type === 'debit' ? theme.danger : theme.success }]}>
                  {selectedTx?.type === 'debit' ? '-' : '+'} Frw {selectedTx?.amount.toLocaleString()}
                </Text>
                <Text style={[styles.detailStatus, { color: theme.success }]}>Completed Successfully</Text>
              </View>

              <PremiumCard style={styles.infoSection}>
                <DetailRow label="Description" value={selectedTx?.description || (selectedTx?.type === 'debit' ? 'Purchase' : 'Top-up')} />
                <DetailRow label="Card Holder" value={selectedTx?.holderName} />
                <DetailRow label="Card UID" value={selectedTx?.uid} mono />
                <DetailRow label="Receipt ID" value={`#${selectedTx?.receiptId}`} bold />
                <DetailRow 
                  label="Date" 
                  value={selectedTx ? format(new Date(selectedTx.timestamp), 'MMMM dd, yyyy') : ''} 
                />
                <DetailRow 
                  label="Time" 
                  value={selectedTx ? format(new Date(selectedTx.timestamp), 'HH:mm:ss') : ''} 
                />
              </PremiumCard>

              <View style={styles.noteBox}>
                <Ionicons name="shield-checkmark" size={20} color={theme.success} />
                <Text style={[styles.noteText, { color: theme.muted }]}>
                  This transaction is secured by Tap & Pay encrypted network. 
                  Digital receipt sent to registered email.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.doneBtn, { backgroundColor: theme.primary }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.doneBtnText}>Back to History</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SortChip({ label, active, onPress, icon }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  return (
    <TouchableOpacity 
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        styles.sortChip, 
        { backgroundColor: active ? theme.primary : theme.card },
        active && Shadows.sm
      ]}
    >
      <Ionicons 
        name={icon} 
        size={16} 
        color={active ? 'white' : theme.muted} 
        style={{ marginRight: 6 }}
      />
      <Text style={[styles.sortChipText, { color: active ? 'white' : theme.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function DetailRow({ label, value, mono, bold }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailRowLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[
        styles.detailRowValue, 
        { color: theme.text },
        mono && { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
        bold && { fontWeight: '900' }
      ]}>
        {value}
      </Text>
    </View>
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
  list: {
    padding: Spacing.lg,
    paddingTop: 0,
    paddingBottom: 100,
  },
  sortContainer: {
    paddingVertical: 16,
  },
  sortContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
    opacity: 0.5,
  },
  time: {
    fontSize: 13,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.8,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  receiptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  receipt: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
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
  detailHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  detailIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    transform: [{ rotate: '45deg' }],
  },
  detailAmount: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  detailStatus: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  infoSection: {
    padding: 24,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  detailRowLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailRowValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    gap: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
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

