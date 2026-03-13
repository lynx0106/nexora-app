import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { showToast } from '../../lib/toast';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ordersApi, Order } from '../../api/orders.api';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';

type OrderDetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const statusColors: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.info,
  preparing: colors.info,
  ready: colors.success,
  delivered: colors.success,
  cancelled: colors.error,
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export default function OrderDetailScreen() {
  const route = useRoute<OrderDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [route.params.orderId]);

  const loadOrder = async () => {
    try {
      const data = await ordersApi.getById(route.params.orderId);
      setOrder(data);
    } catch (error) {
      if (__DEV__) console.error('Error loading order:', error);
      showToast('No se pudo cargar el pedido', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePayment = async () => {
    if (!order) return;

    setPaymentLoading(true);
    try {
      const { paymentLink } = await ordersApi.getPaymentLink(order.id);
      if (paymentLink) {
        await Linking.openURL(paymentLink);
        showToast('Abriendo enlace de pago', 'success');
      } else {
        showToast('No se generó el link de pago', 'error');
      }
    } catch (error: any) {
      if (__DEV__) console.error('Error getting payment link:', error);
      showToast('No se pudo generar el link de pago', 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header del pedido */}
      <View style={styles.header}>
        <Text style={styles.orderId}>Pedido #{order.id.slice(0, 8)}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[order.status] || colors.textSecondary },
          ]}
        >
          <Text style={styles.statusText}>
            {statusLabels[order.status] || order.status}
          </Text>
        </View>
      </View>

      <Text style={styles.date}>{formatDate(order.createdAt)}</Text>

      {/* Productos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Productos</Text>
        {order.items?.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.productName || 'Producto'}</Text>
              <Text style={styles.itemQuantity}>Cantidad: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>
              {formatCurrency(Number(item.price) * item.quantity)}
            </Text>
          </View>
        ))}
      </View>

      {/* Información del cliente */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Cliente</Text>
        <Text style={styles.infoText}>{order.customerName || 'Sin nombre'}</Text>
        {order.customerEmail && (
          <Text style={styles.infoTextSecondary}>{order.customerEmail}</Text>
        )}
      </View>

      {/* Total */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(Number(order.total))}</Text>
        </View>
      </View>

      {/* Botón de pago */}
      {order.status === 'pending' && (
        <TouchableOpacity
          style={[styles.payButton, paymentLoading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={paymentLoading}
        >
          {paymentLoading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.payButtonText}>Pagar con Wompi</Text>
          )}
        </TouchableOpacity>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderId: {
    ...typography.h3,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
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
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.body,
    fontWeight: '600',
  },
  itemQuantity: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  itemPrice: {
    ...typography.body,
    color: colors.primary,
  },
  infoText: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  infoTextSecondary: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  notesText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  totalSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
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
    ...typography.h2,
    color: colors.primary,
  },
  payButton: {
    backgroundColor: colors.success,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});