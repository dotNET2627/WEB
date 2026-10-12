import { apiClient } from "@/lib/api-client";
import type { TodayAppointment } from "@/types/appointment";

const BASE = "/api/v1";

export const receptionService = {
  /** Lịch hẹn hôm nay cho phòng khám (dành cho màn hình lễ tân). */
  getTodayAppointments: async (
    clinicId: string,
    date?: string // YYYY-MM-DD, defaults to today on server
  ): Promise<TodayAppointment[]> => {
    const params = new URLSearchParams({ clinicId });
    if (date) params.set("date", date);
    return apiClient.get<TodayAppointment[]>(
      `${BASE}/reception/today?${params}`
    );
  },

  /** Check-in: Confirmed → CheckedIn */
  checkIn: (id: string) =>
    apiClient.patch(`${BASE}/appointments/${id}/check-in`),

  /** Bắt đầu khám: CheckedIn → InProgress */
  startExam: (id: string) =>
    apiClient.patch(`${BASE}/appointments/${id}/start-exam`),

  /** Hoàn thành: InProgress → Completed */
  complete: (id: string) =>
    apiClient.patch(`${BASE}/appointments/${id}/complete`),

  /** Vắng mặt: Confirmed/CheckedIn → NoShow */
  markNoShow: (id: string) =>
    apiClient.patch(`${BASE}/appointments/${id}/no-show`),

  /** Xác nhận: Pending → Confirmed */
  confirm: (id: string) =>
    apiClient.patch(`${BASE}/appointments/${id}/confirm`),
};
