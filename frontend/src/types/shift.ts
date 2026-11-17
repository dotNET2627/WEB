export interface CashierShiftDto {
  id: string;
  clinicId: string;
  cashierId: string;
  cashierName: string;
  shiftNumber: string;
  startedAt: string;
  closedAt?: string | null;
  status: "Open" | "Closed";
  openingCash: number;
  systemCashAmount: number;
  systemTransferAmount: number;
  systemCardAmount: number;
  systemInsuranceAmount: number;
  systemTotalAmount: number;
  actualCashAmount?: number | null;
  actualTransferAmount?: number | null;
  actualCardAmount?: number | null;
  cashDifference?: number | null;
  expectedTotalCash: number;
  notes?: string | null;
}

export interface CashierShiftSummaryDto {
  id: string;
  shiftNumber: string;
  cashierId: string;
  cashierName: string;
  startedAt: string;
  closedAt?: string | null;
  status: "Open" | "Closed";
  openingCash: number;
  systemTotalAmount: number;
  actualCashAmount?: number | null;
  cashDifference?: number | null;
}

export interface OpenCashierShiftRequest {
  clinicId: string;
  cashierId: string;
  cashierName: string;
  openingCash: number;
  notes?: string | null;
}

export interface CloseCashierShiftRequest {
  actualCash: number;
  actualTransfer: number;
  actualCard: number;
  notes?: string | null;
}
