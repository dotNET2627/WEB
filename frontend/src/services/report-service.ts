import { apiClient } from "@/lib/api-client";
import type { FinancialReportDto } from "@/types/report";

const BASE = "/api/v1/reports";

export const reportService = {
  getFinancialReport: (params: {
    clinicId: string;
    from?: string;
    to?: string;
    patientId?: string;
  }): Promise<FinancialReportDto> => {
    const q = new URLSearchParams({ clinicId: params.clinicId });
    if (params.from) q.set("from", params.from);
    if (params.to) q.set("to", params.to);
    if (params.patientId) q.set("patientId", params.patientId);
    return apiClient.get(`${BASE}/financial?${q.toString()}`);
  },
};
