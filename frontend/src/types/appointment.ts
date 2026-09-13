export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "noShow";

export interface AppointmentListItem {
  id: string;
  patientId: string;
  doctorId: string;
  startsAt: string;
  endsAt?: string;
  status: AppointmentStatus;
}
