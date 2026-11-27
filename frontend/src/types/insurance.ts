export type InsuranceType = "SocialHealth" | "Private";

export type InsuranceClaimStatus = "Processing" | "Approved" | "Rejected" | "Paid";

export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  SocialHealth: "Bảo hiểm Y tế (BHYT)",
  Private: "Bảo hiểm tư nhân",
};

export const INSURANCE_STATUS_LABELS: Record<
  InsuranceClaimStatus,
  { label: string; badge: string }
> = {
  Processing: {
    label: "Chờ thẩm định",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
  },
  Approved: {
    label: "Đã duyệt chi trả",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
  },
  Rejected: {
    label: "Từ chối bồi thường",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
  },
  Paid: {
    label: "Đã thanh toán",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

export interface InsuranceClaimDto {
  id: string;
  patientId: string;
  patientName: string;
  patientCode?: string | null;
  patientPhone?: string | null;
  clinicId: string;
  claimNumber: string;
  insuranceType: InsuranceType;
  providerName: string;
  cardNumber: string;
  policyNumber?: string | null;
  coverageRate?: number | null;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  appointmentId?: string | null;
  claimAmount: number;
  approvedAmount: number;
  patientPayAmount: number;
  status: InsuranceClaimStatus;
  diagnosis?: string | null;
  doctorName?: string | null;
  notes?: string | null;
  rejectReason?: string | null;
  submittedAt: string;
  processedAt?: string | null;
  createdAt: string;
  items: InsuranceClaimItemDto[];
}

export interface InsuranceClaimItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  approvedAmount?: number | null;
  toothNumber?: string | null;
  serviceId?: string | null;
}

export interface InsuranceClaimSummaryDto {
  id: string;
  claimNumber: string;
  patientId: string;
  patientName: string;
  patientCode?: string | null;
  insuranceType: InsuranceType;
  providerName: string;
  cardNumber: string;
  claimAmount: number;
  approvedAmount: number;
  patientPayAmount: number;
  status: InsuranceClaimStatus;
  submittedAt: string;
  processedAt?: string | null;
}

export interface CreateInsuranceClaimRequest {
  patientId: string;
  clinicId: string;
  insuranceType: InsuranceType;
  providerName: string;
  cardNumber: string;
  policyNumber?: string | null;
  coverageRate?: number | null;
  invoiceId?: string | null;
  appointmentId?: string | null;
  diagnosis?: string | null;
  doctorName?: string | null;
  notes?: string | null;
  items: CreateClaimItemDto[];
}

export interface CreateClaimItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
  toothNumber?: string | null;
  serviceId?: string | null;
}

export interface UpdateClaimStatusRequest {
  action: "Approve" | "Reject" | "Paid";
  approvedAmount?: number | null;
  notes?: string | null;
  reason?: string | null;
  reference?: string | null;
}
