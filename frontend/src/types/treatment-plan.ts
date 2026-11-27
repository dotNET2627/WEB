export type TreatmentPlanStatus = "InProgress" | "Completed" | "Paused" | "Cancelled";

export interface TreatmentPlan {
  id: string;
  patientId: string;
  clinicId: string;
  doctorId?: string | null;
  name: string;
  estimatedCost: number;
  startDate: string;
  endDate?: string | null;
  status: TreatmentPlanStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTreatmentPlanRequest {
  name: string;
  estimatedCost: number;
  startDate: string;
  endDate?: string | null;
  doctorId?: string | null;
  notes?: string | null;
}
