export type PrescriptionStatus = "Draft" | "Issued" | "Dispensed" | "Cancelled";

export interface PrescriptionItem {
  inventoryItemId?: string | null;
  medicationName: string;
  dosage: string;
  quantity: number;
  unit: string;
  instructions: string;
}

export interface PrescriptionDto {
  id: string;
  clinicId: string;
  code: string;
  patientId: string;
  patientName: string;
  patientCode?: string | null;
  doctorId?: string | null;
  doctorName: string;
  diagnosis: string;
  medicalNotes?: string | null;
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  createdAt: string;
  dispensedAt?: string | null;
}

export interface CreatePrescriptionRequest {
  code?: string;
  patientId: string;
  patientName: string;
  patientCode?: string;
  doctorId?: string;
  doctorName: string;
  diagnosis: string;
  medicalNotes?: string;
  isDraft: boolean;
  items: {
    inventoryItemId?: string | null;
    medicationName: string;
    dosage: string;
    quantity: number;
    unit: string;
    instructions: string;
  }[];
}

export interface DispensePrescriptionResponse {
  message: string;
  data: {
    prescriptionId: string;
    code: string;
    dispensedAt: string;
    dispensedItems: {
      inventoryItemId: string;
      medicationName: string;
      batches: {
        batchId: string;
        batchNumber: string;
        expirationDate: string;
        consumedQuantity: number;
        remainingInBatch: number;
      }[];
    }[];
  };
}
