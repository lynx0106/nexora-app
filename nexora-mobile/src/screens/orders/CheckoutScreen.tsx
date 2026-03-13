import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { showToast } from '../../lib/toast';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ordersApi } from '../../api/orders.api';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CheckoutScreen() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState(
    user ? `${user.firstName} ${user.lastName}`.trim() : ''
  );
  const [customerPhone, setCustomerPhone] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleCreateOrder = async () => {
    if (!customerName.trim()) {
      showToast('Por favor ingresa tu nombre', 'error');
      return;
    }

    if (items.length === 0) {
      showToast('El carrito está vacío', 'error');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: Number(item.product.price),
        })),
        total,
      };

      const order = await ordersApi.create(orderData);
      
      clearCart();
      
      Alert.alert(
        '¡Pedido Creado!',
        `Tu pedido #${order.id.slice(0, 8)} ha sido creado exitosamente.`,
        [
          {
            text: 'Ver Pedido',
            onPress: () => navigation.replace('OrderDetail', { orderId: order.id }),
          },
          {
            text: 'Ir a Inicio',
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );
    } catch (error: any) {
      if (__DEV__) console.error('Error creating order:', error);
      showToast(error.response?.data?.message || 'No se pudo crear el pedido', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Resumen del pedido */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen del Pedido</Text>
        {items.map((item) => (
          <View key={item.product.id} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.quantity}x {item.product.name}
            </Text>
            <Text style={styles.itemPrice}>
              {formatCurrency(Number(item.product.price) * item.quantity)}
            </Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>

      {/* Información del cliente */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Cliente</Text>
        
        <Text style={styles.inputLabel}>Nombre *</Text>
        <TextInput
          style={styles.input}
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Tu nombre"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.inputLabel}>Teléfono (opcional)</Text>
        <TextInput
          style={styles.input}
          value={customerPhone}
          onChangeText={setCustomerPhone}
          placeholder="Tu teléfono"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
        />
      </View>

      {/* Notas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notas del Pedido</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Instrucciones especiales, alergias, etc."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Botón de confirmar */}
      <TouchableOpacity
        style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
        onPress={handleCreateOrder}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.confirmButtonText}>Confirmar Pedido</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Al confirmar el pedido, aceptas nuestros términos y condiciones.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  itemName: {
    ...typography.body,
    flex: 1,
    marginRight: spacing.sm,
  },
  itemPrice: {
    ...typography.body,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.inputBorder,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.h4,
  },
  totalValue: {
    ...typography.h3,
    color: colors.primary,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.text,
    ...typography.body,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
