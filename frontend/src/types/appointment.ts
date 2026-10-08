export type AppointmentStatus =
  | "Pending"
  | "Confirmed"
  | "Completed"
  | "Cancelled"
  | "NoShow"
  // legacy lowercase (keep for backwards compat)
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "noShow";

export interface AppointmentListItem {
  id: string;
  patientId: string;
  patientName?: string | null;
  doctorId: string;
  doctorName?: string | null;
  clinicId: string;
  startsAt: string;
  endsAt?: string | null;
  status: AppointmentStatus;
  reason?: string | null;
}

export interface AppointmentDetail extends AppointmentListItem {
  plannedServices: PlannedServiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PlannedServiceItem {
  serviceId: string;
  serviceName: string;
  unitPrice: number;
  toothNumber?: string | null;
}

export interface RescheduleRequest {
  startsAt: string;
  endsAt?: string | null;
  reason?: string | null;
}
