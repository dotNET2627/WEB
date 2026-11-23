import { apiClient } from "@/lib/api-client";
import type {
  TreatmentStep,
  CreateTreatmentStepRequest,
  UpdateTreatmentStepRequest,
  ChangeTreatmentStepStatusRequest
} from "@/types/treatment-step";

export const treatmentStepService = {
  getByPlanId: (planId: string) =>
    apiClient.get<{ data: TreatmentStep[] }>(`/api/v1/treatment-plans/${planId}/steps`),

  create: (planId: string, payload: CreateTreatmentStepRequest) =>
    apiClient.post<{ data: string }, CreateTreatmentStepRequest>(
      `/api/v1/treatment-plans/${planId}/steps`,
      payload
    ),

  update: (planId: string, stepId: string, payload: UpdateTreatmentStepRequest) =>
    apiClient.put<{ data: boolean }, UpdateTreatmentStepRequest>(
      `/api/v1/treatment-plans/${planId}/steps/${stepId}`,
      payload
    ),

  changeStatus: (planId: string, stepId: string, status: TreatmentStep["status"]) =>
    apiClient.patch<{ data: boolean }, ChangeTreatmentStepStatusRequest>(
      `/api/v1/treatment-plans/${planId}/steps/${stepId}/status`,
      { status }
    ),

  delete: (planId: string, stepId: string) =>
    apiClient.delete<{ data: boolean }>(`/api/v1/treatment-plans/${planId}/steps/${stepId}`)
};
