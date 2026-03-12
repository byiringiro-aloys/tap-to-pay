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
  Modal,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { productService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

interface Product {
  _id: string;
  name: string;
  price: number;
  icon: string;
  stock: number;
  category: any;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
}

const COMMON_ICONS = ['🍔', '🍕', '🥗', '🍦', '🍩', '🥐', '🥖', '🥯', '🥨', '🥪', '🥣', '🥘', '🍲', '🍿', '🍱', '🥟', '🍤', '🍙', '🍘', '🍥', '🍡', '🍢', '🍣', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍼', '🥛', '☕', '🍵', '🥤', '🍶', '🍺', '🍻', '📦', '💻', '📱', '⌚', '💊', '🩹', '🛒', '🛍️', '🎁'];

export default function StockScreen() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'addProduct' | 'addCategory'>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Add Product form
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('100');
  const [prodIcon, setProdIcon] = useState('🍔');
  const [prodCategory, setProdCategory] = useState('');

  // Add Category form
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('📦');

  // Edit Product modal
  const [editVisible, setEditVisible] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Icon picker
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<'prod' | 'cat' | 'edit'>('prod');

  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const fetchData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        productService.getProducts(),
        productService.getCategories(),
      ]);
      setProducts(prods.map((p: any) => ({ ...p, _id: p._id || p.id })));
      setCategories(cats.map((c: any) => ({ ...c, _id: c._id || c.id || c.slug })));
    } catch (error) {
      console.error('Stock fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // KPI calculations
  const totalSkus = products.length;
  const lowStock = products.filter(p => p.stock < 10).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalCats = categories.length;

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category?.name && p.category.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddProduct = async () => {
    if (!prodName || !prodCategory || !prodPrice) {
      Alert.alert('Missing Fields', 'Name, category and price are required');
      return;
    }
    setIsProcessing(true);
    try {
      const result = await productService.addProduct({
        name: prodName,
        categoryId: prodCategory,
        price: parseFloat(prodPrice),
        icon: prodIcon,
        stock: parseInt(prodStock) || 0,
      });
      if (result._id) {
        Alert.alert('Success', `${prodName} added to inventory`);
        setProdName(''); setProdPrice(''); setProdStock('100'); setProdIcon('🍔'); setProdCategory('');
        fetchData();
        setActiveTab('inventory');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add product');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddCategory = async () => {
    if (!catName) {
      Alert.alert('Missing', 'Category name is required');
      return;
    }
    setIsProcessing(true);
    try {
      const result = await productService.addCategory({ name: catName, icon: catIcon });
      if (result._id) {
        Alert.alert('Success', `Category "${catName}" created`);
        setCatName(''); setCatIcon('📦');
        fetchData();
        setActiveTab('inventory');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create category');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickRestock = async (product: Product) => {
    try {
      await productService.addStock(product._id, 10);
      Alert.alert('Restocked', `+10 units added to ${product.name}`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Restock failed');
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Remove "${product.name}" permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await productService.deleteProduct(product._id);
              Alert.alert('Deleted', `${product.name} removed`);
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Delete failed');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setEditName(product.name);
    setEditPrice(product.price.toString());
    setEditStock(product.stock.toString());
    setEditIcon(product.icon);
    setEditCategory(product.category?._id || '');
    setEditVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editProduct || !editName || !editPrice) return;
    setIsProcessing(true);
    try {
      const result = await productService.updateProduct(editProduct._id, {
        name: editName,
        price: parseFloat(editPrice),
        stock: parseInt(editStock),
        icon: editIcon,
        categoryId: editCategory,
      });
      if (result._id) {
        Alert.alert('Updated', `${editName} saved`);
        setEditVisible(false);
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Update failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const openIconPicker = (target: 'prod' | 'cat' | 'edit') => {
    setIconPickerTarget(target);
    setIconPickerVisible(true);
  };

  const selectIcon = (icon: string) => {
    if (iconPickerTarget === 'prod') setProdIcon(icon);
    else if (iconPickerTarget === 'cat') setCatIcon(icon);
    else if (iconPickerTarget === 'edit') setEditIcon(icon);
    setIconPickerVisible(false);
  };

  const KpiCard = ({ label, value, icon, color }: any) => (
    <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '15' }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={styles.kpiTextContainer}>
        <Text style={[styles.kpiValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        <Text style={[styles.kpiLabel, { color: theme.muted }]}>{label}</Text>
      </View>
    </View>
  );

  if (loading && products.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>📦 Inventory</Text>
            <Text style={styles.headerSubtitle}>Stock Management Center</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'inventory' && styles.tabBtnActive]}
            onPress={() => setActiveTab('inventory')}
          >
            <Ionicons name="list" size={16} color={activeTab === 'inventory' ? theme.primary : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.tabText, activeTab === 'inventory' && styles.tabTextActive]}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'addProduct' && styles.tabBtnActive]}
            onPress={() => setActiveTab('addProduct')}
          >
            <Ionicons name="add-circle" size={16} color={activeTab === 'addProduct' ? theme.primary : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.tabText, activeTab === 'addProduct' && styles.tabTextActive]}>Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'addCategory' && styles.tabBtnActive]}
            onPress={() => setActiveTab('addCategory')}
          >
            <Ionicons name="add-circle" size={16} color={activeTab === 'addCategory' ? theme.primary : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.tabText, activeTab === 'addCategory' && styles.tabTextActive]}>Add Category</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {activeTab === 'inventory' && (
        <View style={{ flex: 1 }}>
          {/* KPIs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll} contentContainerStyle={styles.kpiContent}>
            <KpiCard label="Total SKUs" value={totalSkus} icon="📦" color={theme.info} />
            <KpiCard label="Low Stock" value={lowStock} icon={lowStock > 0 ? '⚠️' : '✅'} color={lowStock > 0 ? theme.danger : theme.success} />
            <KpiCard label="Valuation" value={`Frw ${totalValue.toLocaleString()}`} icon="💸" color={theme.success} />
            <KpiCard label="Categories" value={totalCats} icon="🏷️" color={theme.secondary} />
          </ScrollView>

          {/* Search */}
          <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="search" size={20} color={theme.icon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search products..."
              placeholderTextColor={theme.muted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Product List */}
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.productList}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            renderItem={({ item }) => {
              const isLow = item.stock < 10;
              const isEmpty = item.stock <= 0;
              return (
                <View style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.productMain}>
                    <Text style={{ fontSize: 28 }}>{item.icon}</Text>
                    <View style={styles.productInfo}>
                      <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.productCategory, { color: theme.primary }]}>
                          {item.category?.name || 'Uncategorized'}
                        </Text>
                        <Text style={{ color: theme.success, fontWeight: '800', fontSize: 14 }}>
                          Frw {item.price.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.stockSection}>
                      <View style={[
                        styles.stockBadge,
                        {
                          backgroundColor: isEmpty ? theme.danger + '20' : isLow ? theme.warning + '20' : theme.success + '20'
                        }
                      ]}>
                        <Text style={{
                          color: isEmpty ? theme.danger : isLow ? theme.warning : theme.success,
                          fontWeight: '800', fontSize: 13,
                        }}>
                          {item.stock}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: theme.success + '15' }]}
                      onPress={() => handleQuickRestock(item)}
                    >
                      <Ionicons name="add" size={18} color={theme.success} />
                      <Text style={{ color: theme.success, fontSize: 11, fontWeight: '700' }}>+10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: theme.info + '15' }]}
                      onPress={() => openEditModal(item)}
                    >
                      <Ionicons name="pencil" size={16} color={theme.info} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: theme.danger + '15' }]}
                      onPress={() => handleDeleteProduct(item)}
                    >
                      <Ionicons name="trash" size={16} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={60} color={theme.muted} />
                <Text style={{ color: theme.muted, marginTop: 12 }}>
                  {products.length ? 'No products match your search' : 'Inventory is empty'}
                </Text>
              </View>
            }
          />
        </View>
      )}

      {activeTab === 'addProduct' && (
        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>🍔 New Product</Text>

            <Text style={[styles.label, { color: theme.text }]}>Name</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Product name"
              placeholderTextColor={theme.muted}
              value={prodName}
              onChangeText={setProdName}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.text }]}>Price (Frw)</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                  placeholder="0"
                  placeholderTextColor={theme.muted}
                  keyboardType="numeric"
                  value={prodPrice}
                  onChangeText={setProdPrice}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.text }]}>Stock</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                  placeholder="100"
                  placeholderTextColor={theme.muted}
                  keyboardType="numeric"
                  value={prodStock}
                  onChangeText={setProdStock}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: theme.text }]}>Icon</Text>
            <TouchableOpacity
              style={[styles.iconSelectBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
              onPress={() => openIconPicker('prod')}
            >
              <Text style={{ fontSize: 28 }}>{prodIcon}</Text>
              <Text style={{ color: theme.muted, marginLeft: 10 }}>Tap to change</Text>
            </TouchableOpacity>

            <Text style={[styles.label, { color: theme.text }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat._id}
                    style={[
                      styles.catChip,
                      { borderColor: theme.border },
                      prodCategory === cat._id && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                    onPress={() => setProdCategory(cat._id)}
                  >
                    <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                    <Text style={[
                      { fontSize: 13, fontWeight: '600', color: theme.text },
                      prodCategory === cat._id && { color: 'white' }
                    ]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              onPress={handleAddProduct}
              disabled={isProcessing}
            >
              <Text style={styles.submitBtnText}>
                {isProcessing ? 'Adding...' : '📦 Publish Product'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {activeTab === 'addCategory' && (
        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>📂 New Category</Text>

            <Text style={[styles.label, { color: theme.text }]}>Name</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Health, Tech, Food..."
              placeholderTextColor={theme.muted}
              value={catName}
              onChangeText={setCatName}
            />

            <Text style={[styles.label, { color: theme.text }]}>Icon</Text>
            <TouchableOpacity
              style={[styles.iconSelectBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
              onPress={() => openIconPicker('cat')}
            >
              <Text style={{ fontSize: 28 }}>{catIcon}</Text>
              <Text style={{ color: theme.muted, marginLeft: 10 }}>Tap to change</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              onPress={handleAddCategory}
              disabled={isProcessing}
            >
              <Text style={styles.submitBtnText}>
                {isProcessing ? 'Creating...' : '✨ Create Category'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Edit Product Modal */}
      <Modal visible={editVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>✏️ Edit Product</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.label, { color: theme.text }]}>Name</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                value={editName}
                onChangeText={setEditName}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.text }]}>Price</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                    keyboardType="numeric"
                    value={editPrice}
                    onChangeText={setEditPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.text }]}>Stock</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                    keyboardType="numeric"
                    value={editStock}
                    onChangeText={setEditStock}
                  />
                </View>
              </View>
              <Text style={[styles.label, { color: theme.text }]}>Icon</Text>
              <TouchableOpacity
                style={[styles.iconSelectBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                onPress={() => openIconPicker('edit')}
              >
                <Text style={{ fontSize: 28 }}>{editIcon}</Text>
                <Text style={{ color: theme.muted, marginLeft: 10 }}>Tap to change</Text>
              </TouchableOpacity>

              <Text style={[styles.label, { color: theme.text }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat._id}
                      style={[
                        styles.catChip,
                        { borderColor: theme.border },
                        editCategory === cat._id && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                      onPress={() => setEditCategory(cat._id)}
                    >
                      <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                      <Text style={[
                        { fontSize: 13, fontWeight: '600', color: theme.text },
                        editCategory === cat._id && { color: 'white' }
                      ]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.success, marginTop: 24 }]}
                onPress={handleSaveEdit}
                disabled={isProcessing}
              >
                <Text style={styles.submitBtnText}>
                  {isProcessing ? 'Saving...' : '💾 Save Changes'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Icon Picker Modal */}
      <Modal visible={iconPickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.iconPickerContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Choose Icon</Text>
              <TouchableOpacity onPress={() => setIconPickerVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COMMON_ICONS}
              numColumns={6}
              keyExtractor={(item) => item}
              contentContainerStyle={{ padding: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.iconOption, { backgroundColor: theme.card }]}
                  onPress={() => selectIcon(item)}
                >
                  <Text style={{ fontSize: 28 }}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 50, paddingBottom: 15, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 18 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: 'white' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, gap: 8 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', gap: 6 },
  tabBtnActive: { backgroundColor: 'white' },
  tabText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#6366f1' },
  kpiScroll: { paddingVertical: 12 },
  kpiContent: { paddingHorizontal: 16, gap: 10 },
  kpiCard: { width: 160, flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 12, borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  kpiIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  kpiTextContainer: { flex: 1, marginLeft: 10, justifyContent: 'center' },
  kpiLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  kpiValue: { fontSize: 16, fontWeight: '800' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 48, borderRadius: 15, borderWidth: 1, marginHorizontal: 16, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
  productList: { paddingHorizontal: 16, paddingBottom: 100 },
  productCard: { borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  productMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  productCategory: { fontSize: 12, fontWeight: '600' },
  stockSection: { alignItems: 'center' },
  stockBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  productActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  actionIconBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 4 },
  formContainer: { flex: 1, padding: 20 },
  formCard: { borderRadius: 24, padding: 24, borderWidth: 1 },
  formTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 12, marginLeft: 4 },
  input: { height: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  iconSelectBtn: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginBottom: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  submitBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 24, elevation: 4 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { height: '80%', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalBody: { flex: 1, padding: 24 },
  iconPickerContent: { height: '50%', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  iconOption: { flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', margin: 4, borderRadius: 12 },
});
