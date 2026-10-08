import { apiClient } from "@/lib/api-client";
import type { AppointmentListItem, AppointmentDetail, RescheduleRequest } from "@/types/appointment";

export const appointmentService = {
  /** Fetch appointments that overlap with [from, to], optionally filtered by doctor. */
  getByDateRange: (from: Date, to: Date, doctorId?: string) => {
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    if (doctorId) params.set("doctorId", doctorId);
    return apiClient.get<AppointmentListItem[]>(`/api/v1/appointments?${params}`);
  },

  /** Get full detail of a single appointment. */
  getById: (id: string) =>
    apiClient.get<AppointmentDetail>(`/api/v1/appointments/${id}`),

  /** Reschedule an appointment (drag & drop or form). */
  reschedule: (id: string, body: RescheduleRequest) =>
    apiClient.put<void, RescheduleRequest>(`/api/v1/appointments/${id}`, body),
};
