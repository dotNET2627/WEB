export type TreatmentStepStatus = "NotStarted" | "InProgress" | "Completed";

export interface TreatmentStep {
  id: string;
  treatmentPlanId: string;
  clinicId: string;
  stepName: string;
  serviceId?: string | null;
  doctorId?: string | null;
  toothNumber?: string | null;
  cost: number;
  orderIndex: number;
  status: TreatmentStepStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTreatmentStepRequest {
  stepName: string;
  serviceId?: string | null;
  doctorId?: string | null;
  toothNumber?: string | null;
  cost: number;
  orderIndex: number;
  notes?: string | null;
}

export interface UpdateTreatmentStepRequest {
  stepName: string;
  serviceId?: string | null;
  doctorId?: string | null;
  toothNumber?: string | null;
  cost: number;
  orderIndex: number;
  notes?: string | null;
}

export interface ChangeTreatmentStepStatusRequest {
  status: TreatmentStepStatus;
}
