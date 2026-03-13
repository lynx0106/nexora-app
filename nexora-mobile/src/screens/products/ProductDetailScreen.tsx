import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { showToast } from '../../lib/toast';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { productsApi, Product } from '../../api/products.api';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItem, isInCart, getItemQuantity } = useCart();

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const data = await productsApi.getById(productId);
      setProduct(data);
    } catch (error) {
      if (__DEV__) console.error('Error loading product:', error);
      showToast('No se pudo cargar el producto', 'error');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const currentInCart = getItemQuantity(product.id);
    if (product.stock < quantity + currentInCart) {
      showToast('No hay suficiente stock disponible', 'error');
      return;
    }

    addItem(product, quantity);
    showToast(`${quantity} x ${product.name} agregado al carrito`, 'success');
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(q => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Producto no encontrado</Text>
      </View>
    );
  }

  const isLowStock = product.stock <= (product.minStock || 0);
  const margin = product.cost > 0 ? ((product.price - product.cost) / product.price * 100) : 0;

  return (
    <View style={styles.container}>
      <ScrollView>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📦</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>

          {product.description && (
            <>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.description}>{product.description}</Text>
            </>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Stock</Text>
              <Text style={[styles.infoValue, isLowStock && styles.lowStockValue]}>
                {product.stock} unidades
              </Text>
              {isLowStock && (
                <Text style={styles.lowStockWarning}>⚠️ Stock bajo</Text>
              )}
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Stock Mínimo</Text>
              <Text style={styles.infoValue}>{product.minStock || 0}</Text>
            </View>
          </View>

          {user?.role === 'admin' && product.cost > 0 && (
            <View style={styles.adminInfo}>
              <Text style={styles.sectionTitle}>Información de Costos</Text>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Costo:</Text>
                <Text style={styles.costValue}>{formatCurrency(product.cost)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Margen:</Text>
                <Text style={[styles.costValue, styles.marginValue]}>
                  {margin.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Ganancia:</Text>
                <Text style={styles.costValue}>
                  {formatCurrency(product.price - product.cost)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => product && toggleFavorite(product)}
        >
          <Text style={styles.favoriteIcon}>
            {product && isFavorite(product.id) ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>

        <View style={styles.quantitySelector}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={decrementQuantity}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={incrementQuantity}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.addButton, product.stock === 0 && styles.addButtonDisabled]}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
        >
          <Text style={styles.addButtonText}>
            {product.stock === 0 ? 'Sin Stock' : 'Agregar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  image: {
    width: '100%',
    height: 300,
  },
  imagePlaceholder: {
    height: 300,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 80,
  },
  content: {
    padding: spacing.lg,
  },
  productName: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  productPrice: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...typography.h4,
    color: colors.text,
  },
  lowStockValue: {
    color: colors.error,
  },
  lowStockWarning: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  adminInfo: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  costLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  costValue: {
    ...typography.body,
    fontWeight: '600',
  },
  marginValue: {
    color: colors.success,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.inputBorder,
    gap: spacing.md,
    alignItems: 'center',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
  },
  quantityButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '600',
  },
  quantityText: {
    ...typography.body,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  addButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
