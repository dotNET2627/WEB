import { apiClient } from "@/lib/api-client";
import type { PagedResponse } from "@/types/api";
import type { InvoiceListItem } from "@/types/invoice";

export const invoiceService = {
  getPage: (page = 1, pageSize = 20) =>
    apiClient.get<PagedResponse<InvoiceListItem>>(`/api/v1/invoices?page=${page}&pageSize=${pageSize}`)
};
