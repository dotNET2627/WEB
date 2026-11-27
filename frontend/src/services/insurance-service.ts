import { apiClient } from "@/lib/api-client";
import type {
  CreateInsuranceClaimRequest,
  InsuranceClaimDto,
  InsuranceClaimSummaryDto,
  UpdateClaimStatusRequest,
} from "@/types/insurance";

const BASE = "/api/v1/insurance-claims";

export const insuranceService = {
  create: (body: CreateInsuranceClaimRequest): Promise<{ id: string }> =>
    apiClient.post(BASE, body),

  getById: (id: string): Promise<InsuranceClaimDto> =>
    apiClient.get(`${BASE}/${id}`),

  list: (params: {
    clinicId: string;
    patientId?: string;
    status?: string;
    insuranceType?: string;
    from?: string;
    to?: string;
  }): Promise<InsuranceClaimSummaryDto[]> => {
    const q = new URLSearchParams({ clinicId: params.clinicId });
    if (params.patientId) q.set("patientId", params.patientId);
    if (params.status) q.set("status", params.status);
    if (params.insuranceType) q.set("insuranceType", params.insuranceType);
    if (params.from) q.set("from", params.from);
    if (params.to) q.set("to", params.to);
    return apiClient.get(`${BASE}?${q.toString()}`);
  },

  updateStatus: (id: string, body: UpdateClaimStatusRequest): Promise<void> =>
    apiClient.patch(`${BASE}/${id}/status`, body),
};
