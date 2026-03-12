import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cardService, transactionService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import io from 'socket.io-client';
import { useFocusEffect } from 'expo-router';
import { SOCKET_URL } from '@/constants/config';

interface Card {
  uid: string;
  holderName: string;
  balance: number;
  status: string;
  email?: string;
  phone?: string;
  createdAt: string;
  passcodeSet: boolean;
}

export default function CardsScreen() {
  const [activeSegment, setActiveSegment] = useState<'holders' | 'topup' | 'register'>('holders');
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scannedCard, setScannedCard] = useState<Card | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form states for register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPin, setRegPin] = useState('');
  const [topupAmount, setTopupAmount] = useState('');

  // Editing state
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState('');
  
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on('card-status', async (data) => {
      try {
        const card = await cardService.getCard(data.uid);
        setScannedCard(card);
      } catch (err) {
        setScannedCard({ uid: data.uid, holderName: 'New Card', balance: 0, status: 'New', passcodeSet: false, createdAt: new Date().toISOString() });
      }
    });
    return () => { socket.disconnect(); };
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const data = await cardService.getCards();
      // Normalize data
      const normalized = data.map((c: any) => ({
        ...c,
        uid: c.uid || c.UID || c._id,
      }));
      setCards(normalized);
    } catch (error) {
      console.error('Fetch cards error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSegment === 'holders') fetchCards();
  }, [activeSegment]);

  const handleTopup = async () => {
    if (!scannedCard || !topupAmount) return;
    setIsProcessing(true);
    try {
      const res = await transactionService.topup({
        uid: scannedCard.uid,
        amount: parseFloat(topupAmount),
        processedBy: user?.username
      });
      if (res.success) {
        Alert.alert('Success', `Topped up Frw ${topupAmount} for ${scannedCard.holderName}`);
        setTopupAmount('');
        setScannedCard(res.card);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Top up failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async () => {
    if (!scannedCard || !regName || !regPin) {
        Alert.alert('Missing Info', 'Name and 6-digit PIN are required');
        return;
    }

    if (scannedCard.status !== 'New') {
        Alert.alert('Attention', 'This card is already registered to ' + scannedCard.holderName);
        return;
    }
    setIsProcessing(true);
    try {
        const res = await transactionService.topup({
            uid: scannedCard.uid,
            holderName: regName,
            email: regEmail,
            phone: regPhone,
            passcode: regPin,
            amount: 0,
            processedBy: user?.username
        });
        if (res.success) {
            Alert.alert('Success', 'Card registered successfully!');
            setRegName(''); setRegEmail(''); setRegPhone(''); setRegPin('');
            setActiveSegment('holders');
        }
    } catch (err: any) {
        Alert.alert('Error', err.message || 'Registration failed');
    } finally {
        setIsProcessing(false);
    }
  };

  const startEditing = (card: Card) => {
    setEditingCard(card);
    setEditName(card.holderName);
    setEditEmail(card.email || '');
    setEditPhone(card.phone || '');
    setEditStatus(card.status);
  };

  const handleUpdateCard = async () => {
    if (!editingCard) return;
    setIsProcessing(true);
    try {
      const res = await cardService.updateCard(editingCard.uid, {
        holderName: editName,
        email: editEmail,
        phone: editPhone,
        status: editStatus
      });
      if (res.success) {
        Alert.alert('Success', 'Card updated successfully');
        setEditingCard(null);
        fetchCards();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Update failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCards = cards.filter(c => 
    c.holderName.toLowerCase().includes(search.toLowerCase()) || 
    c.uid.toLowerCase().includes(search.toLowerCase())
  );

  const renderCardItem = ({ item }: { item: Card }) => (
    <View style={[styles.holderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
        <Text style={[styles.avatarText, { color: theme.primary }]}>{item.holderName.charAt(0)}</Text>
      </View>
      <View style={styles.holderInfo}>
        <Text style={[styles.holderName, { color: theme.text }]}>{item.holderName}</Text>
        <Text style={[styles.holderUid, { color: theme.muted }]}>{item.uid}</Text>
      </View>
      <View style={styles.holderBalance}>
        <Text style={[styles.balanceText, { color: theme.success }]}>Frw {item.balance.toLocaleString()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? theme.success + '20' : theme.danger + '20' }]}>
          <Text style={[styles.statusText, { color: item.status === 'active' ? theme.success : theme.danger }]}>{item.status}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.editBtn, { backgroundColor: theme.primary + '10' }]} 
        onPress={() => startEditing(item)}
      >
        <Ionicons name="create-outline" size={20} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.header}>
        <Text style={styles.headerTitle}>Card Command Center</Text>
        <View style={styles.segmentedControl}>
          {(['holders', 'topup', 'register'] as const).map((seg) => (
            <TouchableOpacity 
              key={seg} 
              style={[styles.segmentBtn, activeSegment === seg && styles.segmentBtnActive]}
              onPress={() => setActiveSegment(seg)}
            >
              <Text style={[styles.segmentText, activeSegment === seg && styles.segmentTextActive]}>
                {seg.charAt(0).toUpperCase() + seg.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {activeSegment === 'holders' && (
        <View style={styles.content}>
          <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="search" size={20} color={theme.icon} />
            <TextInput 
              style={[styles.searchInput, { color: theme.text }]} 
              placeholder="Search holders..." 
              placeholderTextColor={theme.muted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={filteredCards}
              renderItem={renderCardItem}
              keyExtractor={(item) => item.uid}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 100, color: theme.muted }}>No cards found</Text>}
            />
          )}
        </View>
      )}

      {(activeSegment === 'topup' || activeSegment === 'register') && (
        <ScrollView style={styles.content}>
          {!scannedCard ? (
            <View style={[styles.scanPrompt, { borderColor: theme.info, backgroundColor: theme.info + '05' }]}>
               <Ionicons name="radio" size={60} color={theme.info} />
               <Text style={[styles.scanText, { color: theme.info }]}>Waiting for RFID Scan...</Text>
               <Text style={{ color: theme.muted, textAlign: 'center' }}>Place a card near the terminal to {activeSegment === 'topup' ? 'add funds' : 'link a new user'}.</Text>
            </View>
          ) : (
            <View style={styles.formCard}>
                <View style={[styles.cardPreview, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.cardPreviewHeader}>
                        <Ionicons name="card" size={24} color={theme.primary} />
                        <Text style={[styles.cardUid, { color: theme.text }]}>{scannedCard.uid}</Text>
                        <TouchableOpacity onPress={() => setScannedCard(null)}>
                            <Ionicons name="refresh" size={20} color={theme.danger} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.cardPreviewName, { color: theme.text }]}>{scannedCard.holderName}</Text>
                    <Text style={[styles.cardPreviewBalance, { color: theme.success }]}>Frw {scannedCard.balance.toLocaleString()}</Text>
                </View>

                {activeSegment === 'topup' && (
                  <View style={styles.form}>
                    <Text style={[styles.label, { color: theme.text }]}>Top-up Amount (Frw)</Text>
                    <TextInput 
                      style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                      placeholder="Enter amount"
                      placeholderTextColor={theme.muted}
                      keyboardType="numeric"
                      value={topupAmount}
                      onChangeText={setTopupAmount}
                    />
                    <View style={styles.presets}>
                      {[500, 1000, 5000].map(amt => (
                        <TouchableOpacity key={amt} style={[styles.presetBtn, { borderColor: theme.primary }]} onPress={() => setTopupAmount(amt.toString())}>
                          <Text style={{ color: theme.primary, fontWeight: 'bold' }}>+{amt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: theme.success }]} 
                      onPress={handleTopup}
                      disabled={isProcessing}
                    >
                        <Text style={styles.actionBtnText}>{isProcessing ? 'Processing...' : 'Add Balance'}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {activeSegment === 'register' && (
                  <View style={styles.form}>
                    {scannedCard.status !== 'New' ? (
                      <View style={[styles.infoNotice, { backgroundColor: theme.primary + '10' }]}>
                        <Ionicons name="information-circle" size={24} color={theme.primary} />
                        <Text style={[styles.infoNoticeText, { color: theme.text }]}>
                            This card is already registered to <Text style={{ fontWeight: 'bold' }}>{scannedCard.holderName}</Text>. To update this card's details, please go to the <Text style={{ fontWeight: 'bold' }}>Holders</Text> list.
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={[styles.label, { color: theme.text }]}>Holder Name</Text>
                        <TextInput 
                          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                          placeholder="Full Name"
                          placeholderTextColor={theme.muted}
                          value={regName}
                          onChangeText={setRegName}
                        />
                        <Text style={[styles.label, { color: theme.text }]}>Email (Optional)</Text>
                        <TextInput 
                          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                          placeholder="Email"
                          placeholderTextColor={theme.muted}
                          keyboardType="email-address"
                          value={regEmail}
                          onChangeText={setRegEmail}
                        />
                        <Text style={[styles.label, { color: theme.text }]}>6-Digit PIN</Text>
                        <TextInput 
                          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                          placeholder="******"
                          placeholderTextColor={theme.muted}
                          keyboardType="numeric"
                          maxLength={6}
                          secureTextEntry
                          value={regPin}
                          onChangeText={setRegPin}
                        />
                        <TouchableOpacity 
                          style={[styles.actionBtn, { backgroundColor: theme.primary }]} 
                          onPress={handleRegister}
                          disabled={isProcessing}
                        >
                            <Text style={styles.actionBtnText}>{isProcessing ? 'Processing...' : 'Register User'}</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Edit Card Modal */}
      <Modal visible={!!editingCard} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Card Details</Text>
                    <TouchableOpacity onPress={() => setEditingCard(null)}>
                        <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                    <Text style={[styles.label, { color: theme.text }]}>Holder Name</Text>
                    <TextInput 
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                        value={editName}
                        onChangeText={setEditName}
                    />

                    <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
                    <TextInput 
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                        value={editEmail}
                        onChangeText={setEditEmail}
                        keyboardType="email-address"
                    />

                    <Text style={[styles.label, { color: theme.text }]}>Phone Number</Text>
                    <TextInput 
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                        value={editPhone}
                        onChangeText={setEditPhone}
                        keyboardType="phone-pad"
                    />

                    <Text style={[styles.label, { color: theme.text }]}>Card Status</Text>
                    <View style={styles.statusOptions}>
                        {['active', 'blocked'].map(s => (
                            <TouchableOpacity 
                                key={s} 
                                style={[styles.statusOptBtn, { borderColor: theme.border }, editStatus === s && { backgroundColor: theme.info, borderColor: theme.info }]}
                                onPress={() => setEditStatus(s)}
                            >
                                <Text style={[styles.statusOptText, { color: theme.text }, editStatus === s && { color: 'white' }]}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: theme.primary }]} 
                        onPress={handleUpdateCard}
                        disabled={isProcessing}
                    >
                        <Text style={styles.actionBtnText}>{isProcessing ? 'Updating...' : 'Save Changes'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: 'white', marginBottom: 20 },
  segmentedControl: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentBtnActive: { backgroundColor: 'white' },
  segmentText: { color: 'white', fontWeight: '700', fontSize: 13 },
  segmentTextActive: { color: '#6366f1' },
  content: { flex: 1, padding: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 15, borderWidth: 1, marginBottom: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  list: { paddingBottom: 100 },
  holderCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  holderInfo: { flex: 1 },
  holderName: { fontSize: 16, fontWeight: '700' },
  holderUid: { fontSize: 12 },
  holderBalance: { alignItems: 'flex-end' },
  balanceText: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  scanPrompt: { padding: 40, alignItems: 'center', borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', marginTop: 40, gap: 15 },
  scanText: { fontSize: 18, fontWeight: '800' },
  formCard: { gap: 20 },
  cardPreview: { padding: 20, borderRadius: 24, borderWidth: 1, elevation: 4 },
  cardPreviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  cardUid: { flex: 1, fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' },
  cardPreviewName: { fontSize: 24, fontWeight: '800', marginBottom: 5 },
  cardPreviewBalance: { fontSize: 20, fontWeight: '700' },
  form: { gap: 12 },
  label: { fontSize: 14, fontWeight: '700', marginLeft: 4 },
  input: { height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  presets: { flexDirection: 'row', gap: 10 },
  presetBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  actionBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  actionBtnText: { color: 'white', fontSize: 18, fontWeight: '800' },
  
  editBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { height: '80%', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalBody: { flex: 1, padding: 25 },
  modalFooter: { padding: 25 },
  
  statusOptions: { flexDirection: 'row', gap: 10, marginTop: 5 },
  statusOptBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  statusOptText: { fontWeight: '700', fontSize: 14 },

  infoNotice: { padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  infoNoticeText: { flex: 1, marginLeft: 12, fontSize: 13, lineHeight: 20 }
});
