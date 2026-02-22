import apiClient from './client';

export interface Appointment {
  id: string;
  dateTime: string;
  doctorId?: string;
  doctor?: {
    id: string;
    name: string;
    email: string;
  };
  clientId: string;
  client?: {
    id: string;
    name: string;
    email: string;
  };
  serviceId?: string;
  service?: {
    id: string;
    name: string;
    price: number;
  };
  notes?: string;
  pax?: number;
  occasion?: string;
  tenantId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  dateTime: string;
  doctorId?: string;
  clientId: string;
  serviceId?: string;
  notes?: string;
  pax?: number;
  occasion?: string;
  tenantId: string;
}

export interface UpdateAppointmentDto {
  dateTime?: string;
  doctorId?: string;
  serviceId?: string;
  notes?: string;
  pax?: number;
  occasion?: string;
}

export interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  todayCount: number;
  weekCount: number;
}

class AppointmentsApi {
  /**
   * Get all appointments for the current tenant
   */
  async getByTenant(tenantId: string): Promise<Appointment[]> {
    return await apiClient.get<Appointment[]>(`/appointments/tenant/${tenantId}`);
  }

  /**
   * Get appointments for current user
   */
  async getMyAppointments(tenantId: string): Promise<Appointment[]> {
    return await apiClient.get<Appointment[]>(`/appointments/tenant/${tenantId}`);
  }

  /**
   * Get appointment by ID
   */
  async getById(id: string): Promise<Appointment> {
    return await apiClient.get<Appointment>(`/appointments/${id}`);
  }

  /**
   * Create a new appointment
   */
  async create(data: CreateAppointmentDto): Promise<Appointment> {
    return await apiClient.post<Appointment>('/appointments', data);
  }

  /**
   * Update an appointment
   */
  async update(id: string, data: UpdateAppointmentDto): Promise<Appointment> {
    return await apiClient.put<Appointment>(`/appointments/${id}`, data);
  }

  /**
   * Cancel an appointment
   */
  async cancel(id: string): Promise<void> {
    await apiClient.delete(`/appointments/${id}`);
  }

  /**
   * Update appointment status (admin only)
   */
  async updateStatus(id: string, status: string): Promise<Appointment> {
    return await apiClient.put<Appointment>(`/appointments/${id}/status`, { status });
  }

  /**
   * Get appointment statistics
   */
  async getStats(tenantId: string): Promise<AppointmentStats> {
    return await apiClient.get<AppointmentStats>(`/appointments/stats/${tenantId}`);
  }
}

export const appointmentsApi = new AppointmentsApi();
export default appointmentsApi;
