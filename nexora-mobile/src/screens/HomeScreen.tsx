import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import dashboardApi, { DashboardMetrics } from '../api/dashboard.api';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getMenuItems, toBusinessType, getBusinessFeatures, BusinessType } from '../config/menuConfig';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const { user, logout, businessType } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Convertir businessType al tipo correcto
  const typedBusinessType: BusinessType = useMemo(() => toBusinessType(businessType), [businessType]);
  const features = useMemo(() => getBusinessFeatures(typedBusinessType), [typedBusinessType]);

  const loadMetrics = async () => {
    // Superadmin doesn't have a specific tenant, so skip metrics
    if (user?.role === 'superadmin') {
      setIsLoading(false);
      return;
    }
    if (!user?.tenantId) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await dashboardApi.getMetrics(user.tenantId);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMetrics();
  }, []);

  // Obtener items del menú usando la configuración centralizada
  const menuItems = useMemo(() => {
    return getMenuItems(user?.role || 'user', typedBusinessType);
  }, [user?.role, typedBusinessType]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Get personalized welcome message based on user role
  const getWelcomeMessage = () => {
    const firstName = user?.firstName || 'Usuario';
    const tenantName = user?.tenantId || '';
    const role = user?.role;

    if (role === 'superadmin') {
      return {
        title: `Bienvenido, Administrador de Nexora`,
        subtitle: 'Gestiona todos tus negocios desde un solo lugar'
      };
    } else if (role === 'admin' && tenantName) {
      return {
        title: `Bienvenido a ${tenantName}`,
        subtitle: 'Gestiona tu empresa'
      };
    } else if (role === 'staff' && tenantName) {
      return {
        title: `Hola ${firstName}`,
        subtitle: `Bienvenido a ${tenantName}`
      };
    } else {
      return {
        title: `Hola ${firstName}`,
        subtitle: 'Explora nuestros productos y servicios'
      };
    }
  };

  const welcomeMessage = getWelcomeMessage();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola,</Text>
          <Text style={styles.userName}>{user?.firstName || 'Usuario'}</Text>
          <Text style={styles.tenantName}>{user?.tenantId || ''}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>{welcomeMessage.title}</Text>
        <Text style={styles.welcomeSubtitle}>
          {welcomeMessage.subtitle}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{metrics?.totalOrders || 0}</Text>
              <Text style={styles.statLabel}>Pedidos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{metrics?.totalProducts || 0}</Text>
              <Text style={styles.statLabel}>Productos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(metrics?.totalSales || 0)}</Text>
              <Text style={styles.statLabel}>Ventas</Text>
            </View>
          </View>

          {(metrics?.pendingOrders || 0) > 0 && (
            <View style={styles.alertCard}>
              <Text style={styles.alertIcon}>⏳</Text>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Pedidos Pendientes</Text>
                <Text style={styles.alertText}>
                  Tienes {metrics?.pendingOrders} pedido(s) esperando atención
                </Text>
              </View>
            </View>
          )}

          {(metrics?.lowStockProducts || 0) > 0 && (
            <View style={[styles.alertCard, styles.alertWarning]}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Stock Bajo</Text>
                <Text style={styles.alertText}>
                  {metrics?.lowStockProducts} producto(s) con stock bajo
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={() => {
                // Navegación usando DrawerActions para pantallas del drawer
                // y navigation.navigate para pantallas del RootStack
                const drawerScreens = ['Productos', 'Pedidos', 'Citas', 'Dashboard'];
                
                if (drawerScreens.includes(item.route)) {
                  // Navegar dentro del drawer usando jumpTo
                  navigation.dispatch(DrawerActions.jumpTo(item.route as any));
                } else {
                  // Navegar a pantallas del RootStack (ChatList, etc.)
                  navigation.navigate(item.route as any);
                }
              }}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  greeting: {
    ...typography.body,
    color: colors.textInverse,
    opacity: 0.8,
  },
  userName: {
    ...typography.h2,
    color: colors.textInverse,
  },
  tenantName: {
    ...typography.caption,
    color: colors.textInverse,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  welcomeCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  welcomeTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  alertCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  alertWarning: {
    borderLeftColor: colors.warning,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  alertText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  menuContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  menuItem: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  menuTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  logoutButton: {
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  logoutText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
