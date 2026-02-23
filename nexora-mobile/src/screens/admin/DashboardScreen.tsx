import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { RoleGuard } from '../../components/RoleGuard';
import dashboardApi, { ActivityItem, SalesChartData } from '../../api/dashboard.api';
import { getBusinessFeatures, toBusinessType, BusinessType } from '../../config/menuConfig';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user, businessType } = useAuth();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [salesChart, setSalesChart] = useState<SalesChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener features según el tipo de negocio
  const typedBusinessType: BusinessType = useMemo(() => toBusinessType(businessType), [businessType]);
  const features = useMemo(() => getBusinessFeatures(typedBusinessType), [typedBusinessType]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    if (!user?.tenantId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const [activityData, salesData] = await Promise.all([
        dashboardApi.getActivity(user.tenantId),
        dashboardApi.getSalesChart(user.tenantId),
      ]);
      setActivity(activityData);
      setSalesChart(salesData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es', { day: '2-digit', month: 'short' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'confirmed':
      case 'completed':
        return '#22c55e';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Calculate metrics
  const totalSales = salesChart.reduce((sum, item) => sum + item.total, 0);
  const todaySales = salesChart[salesChart.length - 1]?.total || 0;
  const orderCount = activity.filter(a => a.type === 'order').length;
  const appointmentCount = activity.filter(a => a.type === 'appointment').length;

  // Simple bar chart
  const maxSales = Math.max(...salesChart.map(s => s.total), 1);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Metrics Cards */}
      <View style={styles.metricsContainer}>
        <View style={[styles.metricCard, { backgroundColor: '#6366f1' }]}>
          <Text style={styles.metricValue}>{formatCurrency(totalSales)}</Text>
          <Text style={styles.metricLabel}>Ventas Semana</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: '#22c55e' }]}>
          <Text style={styles.metricValue}>{formatCurrency(todaySales)}</Text>
          <Text style={styles.metricLabel}>Ventas Hoy</Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        {features.hasOrders && (
          <View style={[styles.metricCard, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.metricValue}>{orderCount}</Text>
            <Text style={styles.metricLabel}>{features.orderLabel}</Text>
          </View>
        )}
        {features.hasAppointments && (
          <View style={[styles.metricCard, { backgroundColor: '#3b82f6' }]}>
            <Text style={styles.metricValue}>{appointmentCount}</Text>
            <Text style={styles.metricLabel}>{features.appointmentLabel}</Text>
          </View>
        )}
      </View>

      {/* Sales Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ventas Últimos 7 Días</Text>
        <View style={styles.chartContainer}>
          {salesChart.map((item, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max((item.total / maxSales) * 100, 4),
                      backgroundColor: item.total > 0 ? '#6366f1' : '#e5e5e5',
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{formatDate(item.date)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividad Reciente</Text>
        {activity.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyText}>No hay actividad reciente</Text>
          </View>
        ) : (
          activity.map((item) => (
            <View key={item.id} style={styles.activityItem}>
              <View
                style={[
                  styles.activityIcon,
                  {
                    backgroundColor:
                      item.type === 'order' ? '#6366f1' : '#3b82f6',
                  },
                ]}
              >
                <Text style={styles.activityIconText}>
                  {item.type === 'order' ? '$' : '📅'}
                </Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activityDescription}>
                  {item.description}
                </Text>
                <Text style={styles.activityTime}>
                  {formatTime(item.date)} - {formatDate(item.date)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(item.status)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  metricCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  chartContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-end',
    height: 150,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 20,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  emptyActivity: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 18,
    color: '#fff',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  activityDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});