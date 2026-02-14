export class CreateAppointmentDto {
  dateTime: string; // ISO string
  doctorId?: string;
  clientId: string;
  serviceId?: string;
  notes?: string;
  pax?: number;
  occasion?: string;
  tenantId: string;
}
