export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  patientId: string;
  totalAmount: number;
  paidAmount: number;
  status: "unpaid" | "partiallyPaid" | "paid" | "cancelled";
}
