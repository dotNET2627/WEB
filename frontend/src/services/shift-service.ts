import { apiClient } from "@/lib/api-client";
import type {
  CashierShiftDto,
  CashierShiftSummaryDto,
  CloseCashierShiftRequest,
  OpenCashierShiftRequest,
} from "@/types/shift";

const BASE = "/api/v1/cashier-shifts";

export const shiftService = {
  open: (body: OpenCashierShiftRequest): Promise<{ id: string }> =>
    apiClient.post(`${BASE}/open`, body),

  getCurrent: (params: { clinicId: string; cashierId?: string }): Promise<CashierShiftDto | null> => {
    const q = new URLSearchParams({ clinicId: params.clinicId });
    if (params.cashierId) q.set("cashierId", params.cashierId);
    return apiClient.get(`${BASE}/current?${q.toString()}`);
  },

  close: (id: string, body: CloseCashierShiftRequest): Promise<void> =>
    apiClient.post(`${BASE}/${id}/close`, body),

  list: (params: {
    clinicId: string;
    from?: string;
    to?: string;
    cashierId?: string;
  }): Promise<CashierShiftSummaryDto[]> => {
    const q = new URLSearchParams({ clinicId: params.clinicId });
    if (params.from) q.set("from", params.from);
    if (params.to) q.set("to", params.to);
    if (params.cashierId) q.set("cashierId", params.cashierId);
    return apiClient.get(`${BASE}?${q.toString()}`);
  },
};
