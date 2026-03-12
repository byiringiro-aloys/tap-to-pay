import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { transactionService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';

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

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const fetchTransactions = async () => {
    try {
      const data = await transactionService.getTransactions();
      // Normalize _id
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isDebit = item.type === 'debit';
    
    return (
      <View style={[styles.transactionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[
            styles.iconWrapper, 
            { backgroundColor: isDebit ? theme.danger + '15' : theme.success + '15' }
        ]}>
          <Ionicons 
            name={isDebit ? "cart" : "add-circle"} 
            size={24} 
            color={isDebit ? theme.danger : theme.success} 
          />
        </View>
        
        <View style={styles.details}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {item.description || (isDebit ? 'Purchase' : 'Top-up')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            {item.holderName} • {item.uid}
          </Text>
          <Text style={[styles.time, { color: theme.muted }]}>
            {format(new Date(item.timestamp), 'MMM dd, yyyy • HH:mm')}
          </Text>
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={[
            styles.amount, 
            { color: isDebit ? theme.danger : theme.success }
          ]}>
            {isDebit ? '-' : '+'} Frw {item.amount.toLocaleString()}
          </Text>
          <Text style={[styles.receipt, { color: theme.muted }]}>#{item.receiptId}</Text>
        </View>
      </View>
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
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Transactions</Text>
        <Text style={[styles.headerSubtitle, { color: theme.muted }]}>History of all payments and top-ups</Text>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color={theme.icon} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No transactions found</Text>
            <Text style={{ color: theme.muted, textAlign: 'center' }}>Transactions will appear here once cards are scanned.</Text>
          </View>
        }
      />
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  time: {
    fontSize: 11,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  receipt: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
