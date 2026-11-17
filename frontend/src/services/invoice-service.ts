import { apiClient } from "@/lib/api-client";
import type {
  CreateInvoiceRequest,
  InvoiceDto,
  InvoiceSummaryDto,
  InvoiceVietQrDto,
  RecordPaymentRequest,
} from "@/types/invoice";

const BASE = "/api/v1/invoices";

export const invoiceService = {
  create: (body: CreateInvoiceRequest): Promise<{ id: string }> =>
    apiClient.post(BASE, body),

  getById: (id: string): Promise<InvoiceDto> =>
    apiClient.get(`${BASE}/${id}`),

  list: (params: {
    clinicId: string;
    patientId?: string;
    from?: string;
    to?: string;
  }): Promise<InvoiceSummaryDto[]> => {
    const q = new URLSearchParams({ clinicId: params.clinicId });
    if (params.patientId) q.set("patientId", params.patientId);
    if (params.from) q.set("from", params.from);
    if (params.to) q.set("to", params.to);
    return apiClient.get(`${BASE}?${q.toString()}`);
  },

  recordPayment: (id: string, body: RecordPaymentRequest): Promise<void> =>
    apiClient.post(`${BASE}/${id}/payments`, body),

  getVietQr: (id: string, amount?: number): Promise<InvoiceVietQrDto> => {
    const q = amount && amount > 0 ? `?amount=${amount}` : "";
    return apiClient.get(`${BASE}/${id}/vietqr${q}`);
  },

  cancel: (id: string): Promise<void> =>
    apiClient.patch(`${BASE}/${id}/cancel`),
};
