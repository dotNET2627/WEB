export interface InventoryItem {
  id: string;
  clinicId: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  minimumStock: number;
  totalQuantityOnHand: number;
  isLowStock: boolean;
  description?: string | null;
  isActive: boolean;
  updatedAt: string;
}

export interface CreateInventoryItemRequest {
  clinicId: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  minimumStock: number;
  description?: string;
}

export interface UpdateInventoryItemRequest {
  name: string;
  category: string;
  unit: string;
  minimumStock: number;
  description?: string;
  isActive: boolean;
}

export interface InventoryBatch {
  id: string;
  clinicId: string;
  inventoryItemId: string;
  batchNumber: string;
  expirationDate: string;
  quantityOnHand: number;
  unitCost: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  createdAt: string;
}

export interface ReceiveInventoryBatchRequest {
  clinicId: string;
  inventoryItemId: string;
  batchNumber: string;
  expirationDate: string;
  quantity: number;
  unitCost: number;
  referenceCode?: string;
  note?: string;
}

export type InventoryTransactionType =
  | "Import"
  | "ProcedureExport"
  | "Disposal"
  | "PrescriptionDispense"
  | "Adjustment";

export interface ConsumeStockFefoRequest {
  clinicId: string;
  inventoryItemId: string;
  quantity: number;
  transactionType?: InventoryTransactionType;
  referenceCode?: string;
  note?: string;
}

export interface BatchConsumptionResult {
  batchId: string;
  batchNumber: string;
  expirationDate: string;
  consumedQuantity: number;
  remainingInBatch: number;
}

export interface InventoryTransaction {
  id: string;
  clinicId: string;
  inventoryItemId: string;
  inventoryBatchId: string;
  batchNumber: string;
  type: InventoryTransactionType;
  quantity: number;
  unitCost: number;
  referenceCode?: string | null;
  note?: string | null;
  createdAt: string;
}
