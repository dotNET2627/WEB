import { apiClient } from "@/lib/api-client";
import type {
  CreatePrescriptionRequest,
  DispensePrescriptionResponse,
  PrescriptionDto,
  PrescriptionStatus
} from "@/types/prescription";

export const prescriptionService = {
  async list(patientId?: string, status?: PrescriptionStatus): Promise<PrescriptionDto[]> {
    const params = new URLSearchParams();
    if (patientId) params.set("patientId", patientId);
    if (status) params.set("status", status);
    return apiClient.get<PrescriptionDto[]>(
      `/api/v1/prescriptions${params.size ? `?${params}` : ""}`
    );
  },

  async create(payload: CreatePrescriptionRequest): Promise<{ id: string; message: string }> {
    return apiClient.post<{ id: string; message: string }, CreatePrescriptionRequest>(
      "/api/v1/prescriptions",
      payload
    );
  },

  async dispense(id: string): Promise<DispensePrescriptionResponse> {
    return apiClient.post<DispensePrescriptionResponse, undefined>(
      `/api/v1/prescriptions/${id}/dispense`
    );
  },

  async cancel(id: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }, undefined>(
      `/api/v1/prescriptions/${id}/cancel`
    );
  }
};
