import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { productService, transactionService, cardService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SOCKET_URL } from '@/constants/config';
import io from 'socket.io-client';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

interface Product {
  _id: string;
  id?: string;
  name: string;
  price: number;
  icon: string;
  stock: number;
  category: any;
}

interface CartItem {
  product: Product;
  qty: number;
}

export default function SalesScreen() {
  const [activeTab, setActiveTab] = useState<'card' | 'market'>('card');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [scannedCard, setScannedCard] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [scannerId, setScannerId] = useState('reader-1');
  const [receiptData, setReceiptData] = useState<any>(null);

  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Socket setup for card scanning
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('card-status', async (data) => {
      if (data.deviceId && data.deviceId !== scannerId) return;
      
      try {
        const card = await cardService.getCard(data.uid);
        setScannedCard(card);
      } catch (err) {
        setScannedCard({ 
            uid: data.uid, 
            holderName: 'Unregistered Card', 
            balance: 0, 
            status: 'New',
            isUnregistered: true 
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [scannerId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        productService.getProducts(),
        productService.getCategories(),
      ]);
      setProducts(prodData.map((p: any) => ({ ...p, _id: p._id || p.id })));
      setCategories(catData.map((c: any) => ({ ...c, _id: c._id || c.id || c.slug })));
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert('Out of Stock', 'This item is currently unavailable');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        const available = product.stock;
        if (existing.qty >= available) {
            Alert.alert('Stock Limit', 'Cannot add more: Stock limit reached');
            return prev;
        }
        return prev.map((item) =>
          item.product._id === product._id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const newCart = prev.map((item) => {
        if (item.product._id === productId) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return { ...item, qty: 0 };
          if (newQty > item.product.stock) return item;
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(item => item.qty > 0);

      // Close checkout modal if cart becomes empty
      if (newCart.length === 0) {
        setCheckoutVisible(false);
      }
      return newCart;
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const startCheckout = async () => {
    if (cart.length === 0) return;
    
    // Web logic: Reserve stock for 5 mins
    try {
        const items = cart.map(i => ({ productId: i.product._id, qty: i.qty }));
        const sessionId = user?.id || Date.now().toString();
        await productService.reserveProducts(items, sessionId);
        setCheckoutVisible(true);
    } catch (error: any) {
        Alert.alert('Reservation Failed', error.message || 'Could not lock stock for checkout');
    }
  };

  const handleCloseReceipt = () => {
    setCart([]);
    setCheckoutVisible(false);
    setPasscode('');
    setReceiptData(null);
    fetchData(); // Refresh stock
    if (scannedCard) {
        cardService.getCard(scannedCard.uid).then(setScannedCard).catch(() => {});
    }
  };

  const handlePay = async () => {
    if (!scannedCard) {
      Alert.alert('No Card Scanned', 'Please scan an RFID card to pay');
      return;
    }

    if (scannedCard.balance < cartTotal) {
      Alert.alert('Insufficient Balance', 'Card balance is too low');
      return;
    }

    if (scannedCard.passcodeSet && passcode.length !== 6) {
        Alert.alert('Passcode Required', 'Please enter your 6-digit card passcode');
        return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        uid: scannedCard.uid,
        amount: cartTotal,
        items: cart.map(i => ({ id: i.product._id, name: i.product.name, price: i.product.price, qty: i.qty })),
        processedBy: user?.username,
        deviceId: scannerId,
        passcode: scannedCard.passcodeSet ? passcode : undefined
      };

      const result = await transactionService.pay(payload);
      
      if (result.success) {
        setReceiptData({
            transaction: result.transaction,
            card: result.card,
            items: cart
        });
      }
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => {
        if (typeof p.category === 'string') return p.category === selectedCategory;
        return p.category?.slug === selectedCategory;
    });

  const CardView = () => (
    <View style={styles.sectionContent}>
        <View style={styles.cardPreviewContainer}>
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.visualCard}
            >
                <View style={styles.cardChip} />
                <Text style={styles.cardNumber}>**** **** **** ****</Text>
                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.cardLabelText}>CARD HOLDER</Text>
                        <Text style={styles.cardValueText}>{scannedCard?.holderName || 'NO CARD'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.cardLabelText}>BALANCE</Text>
                        <Text style={[styles.cardValueText, { color: '#fbbf24' }]}>
                            Frw {scannedCard?.balance?.toLocaleString() || '0'}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>📋 Card Information</Text>
            {!scannedCard ? (
                <View style={styles.emptyInfo}>
                    <Ionicons name="radio" size={48} color={theme.muted} />
                    <Text style={{ color: theme.muted, textAlign: 'center', marginTop: 12 }}>
                        Place an RFID card on the reader to view details...
                    </Text>
                </View>
            ) : (
                <View style={styles.infoList}>
                    <InfoRow label="UID" value={scannedCard.uid} mono />
                    <InfoRow label="Status" value={scannedCard.status || 'Active'} color={theme.success} />
                    <InfoRow 
                        label="Passcode" 
                        value={scannedCard.passcodeSet ? '🔒 Protected' : '⚠️ Not Set'} 
                        color={scannedCard.passcodeSet ? theme.success : theme.warning} 
                    />
                    {scannedCard.email && <InfoRow label="Email" value={scannedCard.email} />}
                    {scannedCard.isUnregistered && (
                        <Text style={{ color: theme.danger, fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                            Card not found in database. Please register it first.
                        </Text>
                    )}
                </View>
            )}
        </View>
    </View>
  );

  const MarketplaceView = () => (
    <View style={styles.marketContainer}>
        <View style={styles.categoryWrapper}>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryContent}
            >
                <TouchableOpacity
                    onPress={() => setSelectedCategory('all')}
                    style={[
                        styles.catBtn,
                        selectedCategory === 'all' 
                            ? { backgroundColor: theme.primary, borderColor: theme.primary } 
                            : { backgroundColor: theme.card, borderColor: theme.border }
                    ]}
                >
                    <Text style={[styles.catBtnText, selectedCategory === 'all' ? { color: 'white' } : { color: theme.text }]}>All Items</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat._id}
                        onPress={() => setSelectedCategory(cat.slug)}
                        style={[
                            styles.catBtn,
                            selectedCategory === cat.slug 
                                ? { backgroundColor: theme.primary, borderColor: theme.primary } 
                                : { backgroundColor: theme.card, borderColor: theme.border }
                        ]}
                    >
                        <View style={[
                            styles.catIconWrap, 
                            selectedCategory === cat.slug ? { backgroundColor: 'rgba(255,255,255,0.2)' } : { backgroundColor: theme.background }
                        ]}>
                            <Text style={styles.catIconText}>{cat.icon}</Text>
                        </View>
                        <Text style={[styles.catBtnText, selectedCategory === cat.slug ? { color: 'white' } : { color: theme.text }]}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>


        <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={styles.prodRow}
            contentContainerStyle={styles.prodList}
            renderItem={({ item }) => {
                const inCart = cart.find(i => i.product._id === item._id);
                return (
                    <TouchableOpacity
                        style={[styles.prodCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                        onPress={() => addToCart(item)}
                    >
                        <Text style={styles.prodIcon}>{item.icon}</Text>
                        <Text style={[styles.prodName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.prodPrice, { color: theme.primary }]}>Frw {item.price.toLocaleString()}</Text>
                        <Text style={[styles.prodStock, { color: item.stock < 10 ? theme.danger : theme.muted }]}>
                            {item.stock} left
                        </Text>
                        {inCart && (
                            <View style={[styles.prodBadge, { backgroundColor: theme.primary }]}>
                                <Text style={styles.prodBadgeText}>{inCart.qty}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            }}
        />

        {cartCount > 0 && (
            <TouchableOpacity style={[styles.cartBar, { backgroundColor: theme.primary }]} onPress={startCheckout}>
                <Ionicons name="cart" size={24} color="white" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.cartBarTotal}>Frw {cartTotal.toLocaleString()}</Text>
                    <Text style={styles.cartBarSub}>{cartCount} items selected</Text>
                </View>
                <Text style={styles.checkoutText}>Checkout →</Text>
            </TouchableOpacity>
        )}
    </View>
  );



  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.header}>
        <View style={styles.headerTop}>
            <View>
                <Text style={styles.headerTitle}>Sales Dashboard</Text>
                <Text style={styles.headerSubtitle}>{user?.fullName} • 💼 Salesperson</Text>
            </View>
            <TouchableOpacity 
                style={styles.terminalBtn}
                onPress={() => {
                    const next = scannerId === 'reader-1' ? 'reader-2' : scannerId === 'reader-2' ? 'reader-3' : 'reader-1';
                    setScannerId(next);
                    Alert.alert('Terminal Switched', `Now using ${next}`);
                }}
            >
                <Ionicons name="radio" size={16} color="white" />
                <Text style={styles.terminalText}>{scannerId}</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
            <TabItem label="Scan Card" icon="card" active={activeTab === 'card'} onPress={() => setActiveTab('card')} />
            <TabItem label="Marketplace" icon="storefront" active={activeTab === 'market'} onPress={() => setActiveTab('market')} />
        </View>
      </LinearGradient>

      {activeTab === 'card' && <CardView />}
      {activeTab === 'market' && <MarketplaceView />}

      {/* Checkout Modal */}
      {checkoutVisible && (
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Checkout</Text>
                    <TouchableOpacity onPress={() => setCheckoutVisible(false)}>
                        <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                    <Text style={styles.sectionLabel}>ORDER SUMMARY</Text>
                    {cart.map(item => (
                        <View key={item.product._id} style={styles.cartReviewRow}>
                            <Text style={styles.cartReviewIcon}>{item.product.icon}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.cartReviewName, { color: theme.text }]} numberOfLines={1}>{item.product.name}</Text>
                                <Text style={{ color: theme.muted, fontSize: 12 }}>Frw {item.product.price.toLocaleString()} x {item.qty}</Text>
                            </View>
                            
                            <View style={styles.cartQtyControls}>
                                <TouchableOpacity 
                                    style={styles.qtyBtn} 
                                    onPress={() => updateQty(item.product._id, -1)}
                                >
                                    <Ionicons name="remove" size={16} color={theme.text} />
                                </TouchableOpacity>
                                <Text style={[styles.qtyText, { color: theme.text }]}>{item.qty}</Text>
                                <TouchableOpacity 
                                    style={styles.qtyBtn} 
                                    onPress={() => updateQty(item.product._id, 1)}
                                >
                                    <Ionicons name="add" size={16} color={theme.text} />
                                </TouchableOpacity>
                            </View>
                            
                            <Text style={[styles.cartReviewTotal, { color: theme.text, marginLeft: 15 }]}>Frw {(item.product.price * item.qty).toLocaleString()}</Text>
                        </View>
                    ))}

                    <View style={[styles.totalBox, { backgroundColor: theme.card }]}>
                        <View style={styles.totalRow}>
                            <Text style={{ color: theme.muted }}>Amount Due</Text>
                            <Text style={[styles.totalValue, { color: theme.text }]}>Frw {cartTotal.toLocaleString()}</Text>
                        </View>
                    </View>

                    <Text style={[styles.sectionLabel, { marginTop: 24 }]}>PAYMENT METHOD</Text>
                    {!scannedCard ? (
                        <View style={styles.paymentWait}>
                            <ActivityIndicator size="small" color={theme.primary} />
                            <Text style={{ color: theme.primary, marginLeft: 10 }}>Waiting for RFID scan...</Text>
                        </View>
                    ) : (
                        <View style={[styles.payCardInfo, { borderColor: theme.border }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <Ionicons name="card" size={20} color={theme.primary} />
                                <Text style={[styles.payCardText, { color: theme.text }]}>{scannedCard.holderName}</Text>
                            </View>
                            <View style={styles.payBalanceRow}>
                                <Text style={{ color: theme.muted }}>Available</Text>
                                <Text style={{ color: theme.success, fontWeight: 'bold' }}>Frw {scannedCard.balance.toLocaleString()}</Text>
                            </View>

                            {scannedCard.passcodeSet && (
                                <View style={styles.passInputWrap}>
                                    <Text style={[styles.passLabel, { color: theme.text }]}>Enter 6-Digit Passcode</Text>
                                    <TextInput
                                        style={[styles.passInput, { color: theme.text, borderColor: theme.border }]}
                                        secureTextEntry
                                        keyboardType="numeric"
                                        maxLength={6}
                                        value={passcode}
                                        onChangeText={setPasscode}
                                        placeholder="******"
                                        placeholderTextColor={theme.muted}
                                    />
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                <View style={styles.modalFooter}>
                    <TouchableOpacity 
                        style={[styles.payConfirmBtn, { backgroundColor: (!scannedCard || isProcessing) ? theme.muted : theme.success }]}
                        onPress={handlePay}
                        disabled={!scannedCard || isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.payConfirmText}>Confirm Payment</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      )}

      {/* Receipt Modal */}
      <Modal visible={!!receiptData} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={[styles.receiptModalContent, { backgroundColor: theme.background }]}>
                <View style={styles.receiptHeader}>
                    <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={30} color="white" />
                    </View>
                    <Text style={[styles.receiptTitle, { color: theme.text }]}>Payment Success!</Text>
                    <Text style={{ color: theme.muted, marginTop: 4 }}>
                        {new Date(receiptData?.transaction?.timestamp || Date.now()).toLocaleString()}
                    </Text>
                </View>

                <ScrollView style={styles.receiptBody} showsVerticalScrollIndicator={false}>
                    <View style={[styles.receiptCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {receiptData?.items.map((item: any) => (
                            <View key={item.product._id} style={styles.receiptRow}>
                                <Text style={[styles.receiptItemText, { color: theme.text }]} numberOfLines={1}>
                                    {item.qty}x {item.product.name}
                                </Text>
                                <Text style={[styles.receiptItemPrice, { color: theme.text }]}>
                                    Frw {(item.product.price * item.qty).toLocaleString()}
                                </Text>
                            </View>
                        ))}
                        
                        <View style={styles.receiptDivider} />
                        
                        <View style={styles.receiptRow}>
                            <Text style={styles.receiptTotalLabel}>Total Paid</Text>
                            <Text style={[styles.receiptTotalValue, { color: theme.success }]}>
                                Frw {receiptData?.transaction?.amount?.toLocaleString()}
                            </Text>
                        </View>
                        
                        <View style={styles.receiptDivider} />
                        
                        <View style={styles.receiptRow}>
                            <Text style={{ color: theme.muted }}>Card Used</Text>
                            <Text style={[styles.receiptItemText, { color: theme.text }]}>: {receiptData?.card?.holderName}</Text>
                        </View>
                        <View style={styles.receiptRow}>
                            <Text style={{ color: theme.muted }}>Remaining Balance</Text>
                            <Text style={[styles.receiptItemText, { color: theme.text }]}>: Frw {receiptData?.transaction?.balanceAfter?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.receiptRow}>
                            <Text style={{ color: theme.muted }}>Transaction ID</Text>
                            <Text style={[styles.receiptItemText, { color: theme.muted, fontSize: 11 }]}>: {receiptData?.transaction?.receiptId}</Text>
                        </View>
                    </View>

                    <View style={[styles.emailNotice, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="mail" size={20} color={theme.primary} />
                        <Text style={[styles.emailNoticeText, { color: theme.primary }]}>
                            A digital copy of this receipt has been emailed to the cardholder (if registered). You can also screenshot this page.
                        </Text>
                    </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                    <TouchableOpacity 
                        style={[styles.payConfirmBtn, { backgroundColor: theme.primary }]}
                        onPress={handleCloseReceipt}
                    >
                        <Text style={styles.payConfirmText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

    </View>
  );
}

function TabItem({ label, icon, active, onPress }: any) {
    return (
        <TouchableOpacity style={[styles.tabItem, active && styles.tabItemActive]} onPress={onPress}>
            <Ionicons name={icon} size={18} color={active ? 'white' : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.tabLabel, active && { color: 'white' }]}>{label}</Text>
        </TouchableOpacity>
    );
}

function InfoRow({ label, value, mono, color }: any) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, mono && { fontFamily: 'monospace' }, color && { color }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 15, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: 'white' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  terminalBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  terminalText: { color: 'white', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, gap: 10 },
  tabItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabItemActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '700', marginLeft: 8 },
  sectionContent: { flex: 1, padding: 20 },
  cardPreviewContainer: { marginBottom: 24 },
  visualCard: { height: 200, borderRadius: 20, padding: 25, justifyContent: 'space-between', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  cardChip: { width: 45, height: 35, backgroundColor: '#e2e8f0', borderRadius: 8, opacity: 0.8 },
  cardNumber: { color: 'white', fontSize: 22, fontWeight: '600', letterSpacing: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardLabelText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  cardValueText: { color: 'white', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' },
  infoCard: { borderRadius: 20, padding: 20, borderWidth: 1 },
  infoTitle: { fontSize: 16, fontWeight: '800', marginBottom: 15 },
  infoList: { gap: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  infoLabel: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  infoValue: { fontSize: 14, fontWeight: '700' },
  emptyInfo: { padding: 40, alignItems: 'center' },
  marketContainer: { flex: 1 },
  categoryWrapper: { paddingVertical: 12, backgroundColor: 'transparent', zIndex: 10 },
  categoryScroll: { paddingLeft: 16 },
  categoryContent: { paddingRight: 32, gap: 12, alignItems: 'center' },
  catBtn: { flexDirection: 'row', alignItems: 'center', paddingRight: 16, paddingLeft: 8, paddingVertical: 6, borderRadius: 25, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
  catIconWrap: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  catIconText: { fontSize: 14 },
  catBtnText: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  prodList: { padding: 10, paddingBottom: 100 },
  prodRow: { justifyContent: 'space-between' },
  prodCard: { width: (width - 30) / 2, borderRadius: 16, padding: 15, marginBottom: 10, borderWidth: 1, alignItems: 'center' },
  prodIcon: { fontSize: 36, marginBottom: 8 },
  prodName: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  prodPrice: { fontSize: 16, fontWeight: '800', marginVertical: 4 },
  prodStock: { fontSize: 11 },
  prodBadge: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  prodBadgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  cartBar: { position: 'absolute', bottom: 20, left: 20, right: 20, height: 65, borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, elevation: 5 },
  cartBarTotal: { color: 'white', fontSize: 18, fontWeight: '900' },
  cartBarSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  checkoutText: { color: 'white', fontWeight: 'bold' },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 1000 },
  modalContent: { height: '85%', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  modalBody: { flex: 1, padding: 25 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 15 },
  cartReviewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cartReviewIcon: { fontSize: 24, marginRight: 15 },
  cartReviewName: { fontSize: 14, fontWeight: '700' },
  cartReviewTotal: { fontSize: 14, fontWeight: '800' },
  cartQtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20, paddingHorizontal: 5, paddingVertical: 2 },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.8)' },
  qtyText: { fontSize: 14, fontWeight: 'bold', marginHorizontal: 10, minWidth: 20, textAlign: 'center' },
  totalBox: { borderRadius: 20, padding: 20, marginTop: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalValue: { fontSize: 22, fontWeight: '900' },
  paymentWait: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1' },
  payCardInfo: { borderRadius: 20, padding: 20, borderWidth: 1 },
  payCardText: { fontSize: 16, fontWeight: '800', marginLeft: 10 },
  payBalanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  passInputWrap: { marginTop: 20 },
  passLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  passInput: { height: 55, borderWidth: 1, borderRadius: 15, textAlign: 'center', fontSize: 20, letterSpacing: 10 },
  modalFooter: { padding: 25 },
  payConfirmBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  payConfirmText: { color: 'white', fontSize: 18, fontWeight: '900' },

  receiptModalContent: { flex: 1, marginTop: 60, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  receiptHeader: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  checkCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 5, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  receiptTitle: { fontSize: 24, fontWeight: '900' },
  receiptBody: { flex: 1, padding: 25 },
  receiptCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderStyle: 'dashed' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  receiptItemText: { fontSize: 14, fontWeight: '600', flex: 1 },
  receiptItemPrice: { fontSize: 14, fontWeight: '800', marginLeft: 15 },
  receiptDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginVertical: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  receiptTotalLabel: { fontSize: 18, fontWeight: '800', color: '#64748b' },
  receiptTotalValue: { fontSize: 24, fontWeight: '900' },
  emailNotice: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginTop: 25, marginBottom: 20 },
  emailNoticeText: { flex: 1, marginLeft: 12, fontSize: 12, fontWeight: '600', lineHeight: 18 },
});
