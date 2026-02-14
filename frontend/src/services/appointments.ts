import { fetchAPIWithAuth } from "../lib/api";

export interface Appointment {
  id: string;
  tenantId: string;
  dateTime: string;
  status: string;
  notes: string;
  doctorId: string;
  clientId: string;
  serviceId: string;
  doctor?: { firstName: string; lastName: string; email: string };
  client?: { firstName: string; lastName: string; email: string };
  service?: { name: string; price: number; duration: number };
  tenant?: { name: string; sector?: string };
}

export interface CreateAppointmentDto {
  dateTime: string;
  doctorId?: string;
  clientId: string;
  serviceId: string;
  notes?: string;
  tenantId: string;
  pax?: number;
  occasion?: string;
}

export const appointmentsService = {
  create: async (data: CreateAppointmentDto) => {
    return fetchAPIWithAuth("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  findAllByTenant: async (tenantId: string, userId?: string): Promise<Appointment[]> => {
    let url = `/appointments/tenant/${tenantId}`;
    if (userId) {
      url += `?userId=${userId}`;
    }
    return fetchAPIWithAuth(url);
  },

  findAllByDoctor: async (doctorId: string): Promise<Appointment[]> => {
    return fetchAPIWithAuth(`/appointments/doctor/${doctorId}`);
  },

  updateStatus: async (id: string, status: string) => {
    return fetchAPIWithAuth(`/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  update: async (id: string, data: any) => {
    return fetchAPIWithAuth(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return fetchAPIWithAuth(`/appointments/${id}`, {
      method: "DELETE",
    });
  },
};
