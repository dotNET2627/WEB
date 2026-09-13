import { apiClient } from "@/lib/api-client";
import type { AppointmentListItem } from "@/types/appointment";
import type { PagedResponse } from "@/types/api";

export const appointmentService = {
  getPage: (page = 1, pageSize = 20) =>
    apiClient.get<PagedResponse<AppointmentListItem>>(`/api/v1/appointments?page=${page}&pageSize=${pageSize}`)
};
