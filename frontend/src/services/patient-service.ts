import { apiClient } from "@/lib/api-client";
import type { PagedResponse } from "@/types/api";
import type { PatientListItem } from "@/types/patient";

export const patientService = {
  getPage: (page = 1, pageSize = 20) =>
    apiClient.get<PagedResponse<PatientListItem>>(`/api/v1/patients?page=${page}&pageSize=${pageSize}`)
};
