import type { InvoiceStatus } from "@/types/invoice";

export interface FinancialReportDto {
  clinicId: string;
  from: string;
  to: string;

  // KPI Overview
  totalCollected: number;
  cashCollected: number;
  transferCollected: number;
  cardCollected: number;
  insuranceCollected: number;
  otherCollected: number;
  totalTransactionsCount: number;

  // Invoices in period
  totalInvoiced: number;
  invoicesCount: number;
  paidInFullCount: number;
  partiallyPaidCount: number;
  unpaidCount: number;

  // Outstanding Debt
  totalOutstandingDebt: number;
  debtorsCount: number;

  // Detailed Lists
  transactions: FinancialPaymentTransactionDto[];
  invoices: FinancialInvoiceSummaryDto[];
  debtors: PatientDebtSummaryDto[];
}

export interface FinancialPaymentTransactionDto {
  paymentId?: string | null;
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientCode?: string | null;
  amount: number;
  method: string;
  paidAt: string;
  reference?: string | null;
  note?: string | null;
}

export interface FinancialInvoiceSummaryDto {
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientCode?: string | null;
  issuedAt: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: InvoiceStatus;
}

export interface PatientDebtSummaryDto {
  patientId: string;
  patientName: string;
  patientCode?: string | null;
  phoneNumber?: string | null;
  unpaidInvoicesCount: number;
  totalDebt: number;
  lastIssuedAt: string;
}
