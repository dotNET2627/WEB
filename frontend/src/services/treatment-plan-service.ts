import { apiClient } from "@/lib/api-client";
import type { TreatmentPlan, CreateTreatmentPlanRequest } from "@/types/treatment-plan";

export const treatmentPlanService = {
  getByPatientId: (patientId: string) =>
    apiClient.get<TreatmentPlan[]>(`/api/v1/patients/${patientId}/treatment-plans`),

  create: (patientId: string, payload: CreateTreatmentPlanRequest) =>
    apiClient.post<{ data: string }, CreateTreatmentPlanRequest>(
      `/api/v1/patients/${patientId}/treatment-plans`,
      payload
    )
};
