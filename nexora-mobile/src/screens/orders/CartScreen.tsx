import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { showToast } from '../../lib/toast';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCart, CartItem } from '../../context/CartContext';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CartScreen() {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const navigation = useNavigation<NavigationProp>();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      showToast('Agrega productos al carrito para continuar', 'error');
      return;
    }
    navigation.navigate('Checkout');
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      {item.product.imageUrl ? (
        <Image source={{ uri: item.product.imageUrl }} style={styles.productImage} />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Text style={styles.productImagePlaceholderText}>📦</Text>
        </View>
      )}
      
      <View style={styles.itemInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.product.name}</Text>
        <Text style={styles.productPrice}>{formatCurrency(Number(item.product.price))}</Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => {
              if (item.quantity < item.product.stock) {
                updateQuantity(item.product.id, item.quantity + 1);
              } else {
                showToast('No hay más stock disponible', 'error');
              }
            }}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.itemRight}>
        <Text style={styles.itemTotal}>
          {formatCurrency(Number(item.product.price) * item.quantity)}
        </Text>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeItem(item.product.id)}
        >
          <Text style={styles.removeButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Carrito Vacío</Text>
        <Text style={styles.emptyText}>
          Agrega productos desde el catálogo para comenzar
        </Text>
        <TouchableOpacity 
          style={styles.shopButton}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={styles.shopButtonText}>Ver Productos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.itemCount}>{itemCount} producto{itemCount !== 1 ? 's' : ''}</Text>
            <TouchableOpacity onPress={() => {
              Alert.alert(
                'Vaciar Carrito',
                '¿Estás seguro de eliminar todos los productos?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Vaciar', style: 'destructive', onPress: clearCart },
                ]
              );
            }}>
              <Text style={styles.clearText}>Vaciar</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutButtonText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  list: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  itemCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  clearText: {
    ...typography.caption,
    color: colors.error,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 32,
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  productName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  productPrice: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    color: colors.primary,
  },
  quantityText: {
    ...typography.body,
    fontWeight: '600',
    marginHorizontal: spacing.md,
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemTotal: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  removeButton: {
    padding: spacing.xs,
  },
  removeButtonText: {
    fontSize: 18,
  },
  footer: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.inputBorder,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalLabel: {
    ...typography.h4,
  },
  totalValue: {
    ...typography.h3,
    color: colors.primary,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  checkoutButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  shopButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  shopButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
