import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Share,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { userService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';

interface SystemUser {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'agent' | 'salesperson';
  passwordSet: boolean;
  lastLogin?: string;
}

export default function UsersScreen() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Add user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Setup result
  const [setupResult, setSetupResult] = useState<{ username: string; setupUrl: string } | null>(null);

  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Users fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const onRefresh = () => { setRefreshing(true); fetchUsers(); };

  const handleAddUser = async () => {
    if (!newFullName.trim() || !newEmail.trim()) {
      Alert.alert('Missing Info', 'Full name and email are required');
      return;
    }
    setIsProcessing(true);
    try {
      const result = await userService.addUser({
        fullName: newFullName.trim(),
        email: newEmail.trim()
      });
      if (result.success) {
        setSetupResult({ username: result.username, setupUrl: result.setupUrl });
        setNewFullName('');
        setNewEmail('');
        setShowAddForm(false);
        fetchUsers();
      } else {
        Alert.alert('Error', result.error || 'Failed to add user');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add team member');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = (targetUser: SystemUser) => {
    if (targetUser.role === 'agent') {
      Alert.alert('Locked', 'Cannot remove agent accounts');
      return;
    }
    if (targetUser._id === user?.id) {
      Alert.alert('Error', 'Cannot remove your own account');
      return;
    }
    Alert.alert(
      'Revoke Access',
      `Remove ${targetUser.fullName} from the team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteUser(targetUser._id);
              Alert.alert('Done', 'Access revoked');
              fetchUsers();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove user');
            }
          }
        }
      ]
    );
  };

  const shareSetupLink = async (url: string) => {
    try {
      await Share.share({
        message: `You've been invited to the Tap & Pay system! Set up your password here: ${url}`,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const agents = users.filter(u => u.role === 'agent');
  const salespersons = users.filter(u => u.role === 'salesperson');

  if (loading && users.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const renderUserItem = (item: SystemUser) => {
    const isAgent = item.role === 'agent';
    const canDelete = !isAgent && item._id !== user?.id;

    return (
      <View key={item._id} style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.userAvatar, { backgroundColor: isAgent ? theme.primary + '20' : theme.info + '20' }]}>
          <Text style={[styles.userAvatarText, { color: isAgent ? theme.primary : theme.info }]}>
            {item.fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text }]}>{item.fullName}</Text>
          <Text style={[styles.userUsername, { color: theme.muted }]}>@{item.username}</Text>
          <View style={styles.userMeta}>
            <View style={[
              styles.roleBadge,
              { backgroundColor: isAgent ? theme.primary + '20' : theme.info + '20' }
            ]}>
              <Text style={[styles.roleText, { color: isAgent ? theme.primary : theme.info }]}>
                {item.role}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={[styles.statusDot, { backgroundColor: item.passwordSet ? theme.success : theme.warning }]} />
              <Text style={{ color: item.passwordSet ? theme.success : theme.warning, fontSize: 11, fontWeight: '600' }}>
                {item.passwordSet ? 'Verified' : 'Pending'}
              </Text>
            </View>
          </View>
          {item.lastLogin && (
            <Text style={{ color: theme.muted, fontSize: 11, marginTop: 4 }}>
              Last login: {new Date(item.lastLogin).toLocaleDateString()}
            </Text>
          )}
        </View>
        {canDelete ? (
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: theme.danger + '15' }]}
            onPress={() => handleDeleteUser(item)}
          >
            <Ionicons name="trash" size={18} color={theme.danger} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.lockIcon, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
            <Ionicons name="lock-closed" size={16} color={theme.muted} />
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>👥 Team</Text>
            <Text style={styles.headerSubtitle}>Salesperson Management</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Ionicons name={showAddForm ? 'close' : 'person-add'} size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Summary bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{users.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={[styles.summaryDivider]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{agents.length}</Text>
            <Text style={styles.summaryLabel}>Agents</Text>
          </View>
          <View style={[styles.summaryDivider]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{salespersons.length}</Text>
            <Text style={styles.summaryLabel}>Sales</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Add User Form */}
      {showAddForm && (
        <View style={[styles.addFormCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.formTitle, { color: theme.text }]}>➕ Add Team Member</Text>

          <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="Jane Smith"
            placeholderTextColor={theme.muted}
            value={newFullName}
            onChangeText={setNewFullName}
          />

          <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="jane@example.com"
            placeholderTextColor={theme.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={newEmail}
            onChangeText={setNewEmail}
          />

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            onPress={handleAddUser}
            disabled={isProcessing}
          >
            <Ionicons name="mail" size={20} color="white" />
            <Text style={styles.submitBtnText}>
              {isProcessing ? 'Creating...' : '📧 Invite Member'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Setup Result */}
      {setupResult && (
        <View style={[styles.resultCard, { backgroundColor: theme.success + '10', borderColor: theme.success }]}>
          <View style={styles.resultHeader}>
            <Ionicons name="checkmark-circle" size={24} color={theme.success} />
            <Text style={[styles.resultTitle, { color: theme.success }]}>Invitation Created!</Text>
          </View>
          <Text style={{ color: theme.text, marginBottom: 8 }}>
            Username: <Text style={{ fontWeight: '800' }}>{setupResult.username}</Text>
          </Text>
          <View style={[styles.linkBox, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
            <Text style={{ color: theme.primary, fontSize: 12, fontFamily: 'monospace' }} numberOfLines={2}>
              {setupResult.setupUrl}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.shareBtn, { backgroundColor: theme.primary }]}
              onPress={() => shareSetupLink(setupResult.setupUrl)}
            >
              <Ionicons name="share" size={16} color="white" />
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Share Link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareBtn, { backgroundColor: theme.muted + '30' }]}
              onPress={() => setSetupResult(null)}
            >
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Users List */}
      <View style={styles.section}>
        {agents.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              🛡️ Administrators ({agents.length})
            </Text>
            {agents.map(renderUserItem)}
          </>
        )}

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
          🛒 Salespersons ({salespersons.length})
        </Text>
        {salespersons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={50} color={theme.muted} />
            <Text style={{ color: theme.muted, marginTop: 12, textAlign: 'center' }}>
              No salespersons yet.{'\n'}Tap + to invite team members.
            </Text>
          </View>
        ) : (
          salespersons.map(renderUserItem)
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: 'white' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  summaryBar: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 14, justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { color: 'white', fontSize: 20, fontWeight: '900' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  summaryDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },
  addFormCard: { margin: 16, borderRadius: 24, padding: 24, borderWidth: 1, elevation: 2 },
  formTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 10, marginLeft: 4 },
  input: { height: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  submitBtn: { height: 52, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 8, elevation: 4 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  resultCard: { margin: 16, borderRadius: 20, padding: 20, borderWidth: 1 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultTitle: { fontSize: 16, fontWeight: '800' },
  linkBox: { padding: 12, borderRadius: 12 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  userAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  userAvatarText: { fontSize: 20, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700' },
  userUsername: { fontSize: 12, marginBottom: 6 },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  roleText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  deleteBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  lockIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
});
