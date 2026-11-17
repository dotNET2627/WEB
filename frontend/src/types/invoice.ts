export type InvoiceStatus = "Unpaid" | "PartiallyPaid" | "Paid" | "Cancelled";

export interface InvoiceDto {
  id: string;
  patientId: string;
  patientName: string;
  clinicId: string;
  invoiceNumber: string;
  appointmentId?: string | null;
  status: InvoiceStatus;
  subTotal: number;
  discountAmount: number;
  discountPercent: number;
  discountValue: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  notes?: string | null;
  issuedAt: string;
  createdAt: string;
  updatedAt: string;
  lines: InvoiceLineDto[];
  payments: PaymentDto[];
}

export interface InvoiceLineDto {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  serviceId?: string | null;
  toothNumber?: string | null;
}

export interface PaymentDto {
  amount: number;
  method: string;
  paidAt: string;
  reference?: string | null;
  note?: string | null;
  id?: string | null;
}

export interface InvoiceSummaryDto {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  status: InvoiceStatus;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  issuedAt: string;
  appointmentId?: string | null;
}

export interface CreateInvoiceRequest {
  patientId: string;
  clinicId: string;
  appointmentId?: string | null;
  notes?: string | null;
  discountAmount: number;
  discountPercent: number;
  lines: CreateInvoiceLineRequest[];
}

export interface CreateInvoiceLineRequest {
  description: string;
  quantity: number;
  unitPrice: number;
  serviceId?: string | null;
  toothNumber?: string | null;
}

export interface RecordPaymentRequest {
  amount: number;
  method: string;
  reference?: string | null;
  note?: string | null;
}

export interface InvoiceVietQrDto {
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  amount: number;
  bankBin: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  description: string;
  qrImageUrl: string;
  qrPayload: string;
}

export type PaymentMethod = "Cash" | "Card" | "Transfer" | "Insurance" | "Other";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash: "Tiền mặt",
  Card: "Thẻ ngân hàng (POS)",
  Transfer: "Chuyển khoản (VietQR)",
  Insurance: "Bảo hiểm",
  Other: "Khác",
};
