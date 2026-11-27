import { apiClient } from "@/lib/api-client";
import type { PagedResponse } from "@/types/api";
import type {
  CreatePatientRequest,
  MedicalHistoryItem,
  MedicalImage,
  PatientDetail,
  PatientListItem,
  ToothCondition,
  UpdatePatientRequest
} from "@/types/patient";

export const patientService = {
  getPatients: async (params?: { page?: number; pageSize?: number; search?: string }) => {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      pageSize: String(params?.pageSize ?? 20)
    });
    if (params?.search) query.set("search", params.search);
    return apiClient.get<PagedResponse<PatientListItem>>(`/api/v1/patients?${query}`);
  },

  getPage: (page = 1, pageSize = 20) => patientService.getPatients({ page, pageSize }),

  getById: (id: string) => apiClient.get<PatientDetail>(`/api/v1/patients/${id}`),

  create: (data: CreatePatientRequest) =>
    apiClient.post<{ id: string }, CreatePatientRequest>("/api/v1/patients", data),

  update: (id: string, data: UpdatePatientRequest) =>
    apiClient.put<PatientDetail, UpdatePatientRequest>(`/api/v1/patients/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/api/v1/patients/${id}`),

  getOdontogram: (patientId: string) =>
    apiClient.get<ToothCondition[]>(`/api/v1/patients/${patientId}/odontogram`),

  updateTooth: (
    patientId: string,
    toothNumber: number,
    data: Pick<ToothCondition, "condition" | "surfaces" | "notes">
  ) => apiClient.put<ToothCondition, typeof data>(`/api/v1/patients/${patientId}/odontogram/${toothNumber}`, data),

  getMedicalHistory: (patientId: string) =>
    apiClient.get<MedicalHistoryItem[]>(`/api/v1/patients/${patientId}/medical-history`),

  addMedicalHistory: (patientId: string, item: Omit<MedicalHistoryItem, "id" | "createdAt">) =>
    apiClient.post<MedicalHistoryItem, typeof item>(`/api/v1/patients/${patientId}/medical-history`, item),

  deleteMedicalHistory: (patientId: string, itemId: string) =>
    apiClient.delete<void>(`/api/v1/patients/${patientId}/medical-history/${itemId}`),

  getMedicalImages: (patientId: string) =>
    apiClient.get<MedicalImage[]>(`/api/v1/patients/${patientId}/images`),

  uploadMedicalImage: (patientId: string, data: FormData) =>
    apiClient.post<MedicalImage, FormData>(`/api/v1/patients/${patientId}/images`, data),

  deleteMedicalImage: (patientId: string, imageId: string) =>
    apiClient.delete<void>(`/api/v1/patients/${patientId}/images/${imageId}`)
};
