import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import appointmentsApi from '../../api/appointments.api';
import productsApi, { Product } from '../../api/products.api';

type Props = NativeStackScreenProps<RootStackParamList, 'BookAppointment'>;

export default function BookAppointmentScreen({ route, navigation }: Props) {
  const { serviceId } = route.params || {};
  const { user, businessType } = useAuth();
  const isRestaurant = businessType === 'restaurant';
  
  const [services, setServices] = useState<Product[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(serviceId || null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [notes, setNotes] = useState('');
  const [pax, setPax] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00',
  ];

  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    if (!user?.tenantId) return;
    
    setLoadingServices(true);
    try {
      const products = await productsApi.getByTenant(user.tenantId);
      setServices(products);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es', { weekday: 'short', day: '2-digit' });
    }
  };

  const handleBook = async () => {
    if (!isRestaurant && !selectedService) {
      Alert.alert('Error', 'Por favor selecciona un servicio');
      return;
    }

    if (!user?.tenantId || !user?.id) {
      Alert.alert('Error', 'No se pudo obtener la información del usuario');
      return;
    }

    setIsLoading(true);
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const dateTime = new Date(selectedDate);
      dateTime.setHours(hours, minutes, 0, 0);

      const appointmentData = {
        dateTime: dateTime.toISOString(),
        clientId: user.id,
        serviceId: isRestaurant ? null : selectedService,
        tenantId: user.tenantId,
        notes: notes || undefined,
        pax,
      };

      await appointmentsApi.create(appointmentData);
      
      Alert.alert(
        isRestaurant ? 'Reserva Confirmada' : 'Cita Agendada',
        isRestaurant ? 'Tu reserva ha sido confirmada exitosamente' : 'Tu cita ha sido agendada exitosamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo agendar la cita');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedServiceData = services.find(s => s.id === selectedService);

  if (loadingServices) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>{isRestaurant ? 'Cargando...' : 'Cargando servicios...'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Service Selection - Only show for non-restaurants */}
      {!isRestaurant && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Servicio</Text>
        {services.length === 0 ? (
          <Text style={styles.noServicesText}>No hay servicios disponibles</Text>
        ) : (
          services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                selectedService === service.id && styles.serviceCardSelected,
              ]}
              onPress={() => setSelectedService(service.id)}
            >
              <View style={styles.serviceInfo}>
                <Text style={[
                  styles.serviceName,
                  selectedService === service.id && styles.serviceNameSelected,
                ]}>
                  {service.name}
                </Text>
                {service.description && (
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {service.description}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.servicePrice,
                selectedService === service.id && styles.servicePriceSelected,
              ]}>
                ${service.price.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
      )}

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fecha</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {availableDates.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateCard,
                selectedDate.toDateString() === date.toDateString() && styles.dateCardSelected,
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[
                styles.dateText,
                selectedDate.toDateString() === date.toDateString() && styles.dateTextSelected,
              ]}>
                {formatDate(date)}
              </Text>
              <Text style={[
                styles.dateNumber,
                selectedDate.toDateString() === date.toDateString() && styles.dateTextSelected,
              ]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hora</Text>
        <View style={styles.timeGrid}>
          {timeSlots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeCard,
                selectedTime === time && styles.timeCardSelected,
              ]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[
                styles.timeText,
                selectedTime === time && styles.timeTextSelected,
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pax Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Número de personas</Text>
        <View style={styles.paxContainer}>
          <TouchableOpacity
            style={styles.paxButton}
            onPress={() => setPax(Math.max(1, pax - 1))}
          >
            <Text style={styles.paxButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.paxText}>{pax}</Text>
          <TouchableOpacity
            style={styles.paxButton}
            onPress={() => setPax(Math.min(10, pax + 1))}
          >
            <Text style={styles.paxButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notas (opcional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Agrega notas especiales, alergias, preferencias..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Summary */}
      {selectedServiceData && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Servicio:</Text>
            <Text style={styles.summaryValue}>{selectedServiceData.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fecha:</Text>
            <Text style={styles.summaryValue}>
              {selectedDate.toLocaleDateString('es', { 
                weekday: 'long', 
                day: '2-digit', 
                month: 'long' 
              })}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hora:</Text>
            <Text style={styles.summaryValue}>{selectedTime}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Personas:</Text>
            <Text style={styles.summaryValue}>{pax}</Text>
          </View>
        </View>
      )}

      {/* Book Button */}
      <TouchableOpacity
        style={[styles.bookButton, (isRestaurant || !selectedService || isLoading) && styles.bookButtonDisabled]}
        onPress={handleBook}
        disabled={isRestaurant || !selectedService || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.bookButtonText}>{isRestaurant ? 'Confirmar Reserva' : 'Confirmar Cita'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  noServicesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f5f3ff',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  serviceNameSelected: {
    color: '#6366f1',
  },
  serviceDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  servicePriceSelected: {
    color: '#6366f1',
  },
  dateCard: {
    width: 70,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f1',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateTextSelected: {
    color: '#fff',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  timeCard: {
    width: '22%',
    marginHorizontal: '1.5%',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  timeCardSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  timeText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  timeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  paxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
  },
  paxButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paxButtonText: {
    fontSize: 24,
    color: '#6366f1',
    fontWeight: '600',
  },
  paxText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginHorizontal: 24,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  bookButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});