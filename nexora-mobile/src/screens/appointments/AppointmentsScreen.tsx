import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import appointmentsApi, { Appointment } from '../../api/appointments.api';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Appointments'>;

export default function AppointmentsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, businessType } = useAuth();
  const isRestaurant = businessType === 'restaurant';
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    if (!user?.tenantId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentsApi.getByTenant(user.tenantId);
      data.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las citas');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      case 'completed':
        return '#3b82f6';
      default:
        return '#94a3b8';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dayText: string;
    if (date.toDateString() === today.toDateString()) {
      dayText = 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayText = 'Mañana';
    } else {
      dayText = date.toLocaleDateString('es', { 
        weekday: 'short', 
        day: '2-digit', 
        month: 'short' 
      });
    }

    const time = date.toLocaleTimeString('es', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return { dayText, time };
  };

  const handleBookAppointment = () => {
    navigation.navigate('BookAppointment', {});
  };

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const { dayText, time } = formatDateTime(item.dateTime);
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity style={styles.appointmentCard}>
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dayText}>{dayText}</Text>
          <Text style={styles.timeText}>{time}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailsContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.serviceName}>
              {item.service?.name || 'Cita'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
          {item.doctor && (
            <Text style={styles.doctorName}>
              {item.doctor.name}
            </Text>
          )}
          {item.notes && (
            <Text style={styles.notes} numberOfLines={2}>
              {item.notes}
            </Text>
          )}
          {item.pax && item.pax > 1 && (
            <Text style={styles.paxText}>
              {item.pax} personas
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>Event</Text>
      <Text style={styles.emptyTitle}>{isRestaurant ? 'Sin reservas programadas' : 'Sin citas programadas'}</Text>
      <Text style={styles.emptyText}>
        {isRestaurant ? 'Haz tu primera reserva' : 'Agenda tu primera cita'}
      </Text>
      <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
        <Text style={styles.bookButtonText}>{isRestaurant ? 'Hacer Reserva' : 'Agendar Cita'}</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>{isRestaurant ? 'Cargando reservas...' : 'Cargando citas...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointment}
        contentContainerStyle={[
          styles.list,
          appointments.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {appointments.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingButton} 
          onPress={handleBookAppointment}
        >
          <Text style={styles.floatingButtonText}>{isRestaurant ? '+ Nueva Reserva' : '+ Nueva Cita'}</Text>
        </TouchableOpacity>
      )}
    </View>
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
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyList: {
    flex: 1,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateTimeContainer: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: '#e5e5e5',
    marginHorizontal: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  doctorName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  notes: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  paxText: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  bookButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});