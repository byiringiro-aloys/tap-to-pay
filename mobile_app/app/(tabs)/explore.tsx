import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PremiumHeader } from '@/components/ui/PremiumHeader';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { productService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function ProductsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchProducts = async () => {
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchProducts();
  };

  const renderProduct = ({ item, index }: any) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 100).duration(500)}
      layout={Layout.springify()}
    >
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            setSelectedProduct(item);
            setModalVisible(true);
        }}
      >
        <PremiumCard style={styles.productCard}>
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '10' }]}>
              <Text style={styles.productIcon}>{item.icon || '📦'}</Text>
            </View>
            
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.productCategory, { color: theme.muted }]}>
                {item.category?.name || 'Uncategorized'}
              </Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="pricetag" size={14} color={theme.primary} />
                  <Text style={[styles.statText, { color: theme.text }]}>
                    Frw {item.price.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons 
                      name="cube" 
                      size={14} 
                      color={item.stock < 10 ? theme.danger : theme.success} 
                  />
                  <Text style={[
                      styles.statText, 
                      { color: item.stock < 10 ? theme.danger : theme.text }
                  ]}>
                    {item.stock} in stock
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.editBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Placeholder for edit
              }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        </PremiumCard>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PremiumHeader 
        title="Inventory" 
        subtitle="Manage your products"
        gradient
        rightAction={
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={80} color={theme.muted + '40'} />
                <Text style={[styles.emptyText, { color: theme.muted }]}>No products found</Text>
            </View>
          }
        />
      )}

      {/* Product Detail Modal */}
      <Modal visible={modalVisible && !!selectedProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Product Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.detailHeader}>
                <View style={[styles.detailIconWrap, { backgroundColor: theme.primary + '15' }]}>
                  <Text style={styles.detailIconText}>{selectedProduct?.icon || '📦'}</Text>
                </View>
                <Text style={[styles.detailName, { color: theme.text }]}>{selectedProduct?.name}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '10' }]}>
                  <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>
                    {selectedProduct?.category?.name || 'Uncategorized'}
                  </Text>
                </View>
              </View>

              <View style={styles.statsContainer}>
                <View style={[styles.statBox, { backgroundColor: theme.card }]}>
                  <Ionicons name="pricetag" size={20} color={theme.primary} />
                  <Text style={[styles.statVal, { color: theme.text }]}>
                    Frw {selectedProduct?.price.toLocaleString()}
                  </Text>
                  <Text style={[styles.statLab, { color: theme.muted }]}>Unit Price</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: theme.card }]}>
                  <Ionicons 
                    name="cube" 
                    size={20} 
                    color={selectedProduct?.stock < 10 ? theme.danger : theme.success} 
                  />
                  <Text style={[
                    styles.statVal, 
                    { color: selectedProduct?.stock < 10 ? theme.danger : theme.text }
                  ]}>
                    {selectedProduct?.stock}
                  </Text>
                  <Text style={[styles.statLab, { color: theme.muted }]}>In Stock</Text>
                </View>
              </View>

              <PremiumCard style={styles.descriptionCard}>
                <Text style={[styles.descTitle, { color: theme.text }]}>Description</Text>
                <Text style={[styles.descText, { color: theme.muted }]}>
                  This is a premium product managed within the Tap & Pay inventory system. 
                  High availability and quality assured.
                </Text>
              </PremiumCard>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.muted }]}>Product ID</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{selectedProduct?._id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.muted }]}>Last Updated</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>Just now</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.actionBtnText, { color: theme.text }]}>Edit Product</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: theme.primary, flex: 1.5 }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.actionBtnText, { color: 'white' }]}>Done</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  productCard: {
    marginBottom: Spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productIcon: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  productCategory: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
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
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalBody: {
    flex: 1,
    padding: 24,
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  detailIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIconText: {
    fontSize: 50,
  },
  detailName: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  statLab: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  descriptionCard: {
    padding: 20,
    marginBottom: 24,
  },
  descTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalFooter: {
    padding: 24,
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
