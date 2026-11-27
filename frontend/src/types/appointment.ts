// All statuses from the backend state machine
export type AppointmentStatus =
  | "Pending"      // Chờ xác nhận
  | "Confirmed"    // Đã xác nhận
  | "CheckedIn"    // Đã đến (check-in tại quầy)
  | "InProgress"   // Đang khám
  | "Completed"    // Hoàn thành
  | "Cancelled"    // Hủy
  | "NoShow";      // Vắng mặt

// ── Calendar list (from /api/v1/appointments) ──────────────────────────────
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

// ── Reception / today screen (from /api/v1/reception/today) ──────────────
export interface TodayAppointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  startsAt: string;
  endsAt?: string | null;
  checkedInAt?: string | null;
  status: AppointmentStatus;
  reason?: string | null;
  plannedServices: PlannedServiceItem[];
}

// ── Shared sub-types ──────────────────────────────────────────────────────
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
