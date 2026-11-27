import { apiClient } from "@/lib/api-client";
import type {
  BatchConsumptionResult,
  ConsumeStockFefoRequest,
  CreateInventoryItemRequest,
  InventoryBatch,
  InventoryItem,
  InventoryTransaction,
  InventoryTransactionType,
  ReceiveInventoryBatchRequest,
  UpdateInventoryItemRequest
} from "@/types/inventory";

export const inventoryService = {
  async listItems(search?: string): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    if (search?.trim()) {
      params.set("search", search.trim());
    }
    return apiClient.get<InventoryItem[]>(`/api/v1/inventory/items${params.size ? `?${params}` : ""}`);
  },

  async createItem(payload: CreateInventoryItemRequest): Promise<{ id: string; message: string }> {
    return apiClient.post<{ id: string; message: string }, CreateInventoryItemRequest>(
      "/api/v1/inventory/items",
      payload
    );
  },

  async updateItem(id: string, payload: UpdateInventoryItemRequest): Promise<{ message: string }> {
    return apiClient.put<{ message: string }, UpdateInventoryItemRequest>(
      `/api/v1/inventory/items/${id}`,
      payload
    );
  },

  async listBatches(itemId: string): Promise<InventoryBatch[]> {
    return apiClient.get<InventoryBatch[]>(
      `/api/v1/inventory/items/${itemId}/batches`
    );
  },

  async receiveBatch(payload: ReceiveInventoryBatchRequest): Promise<{ id: string; message: string }> {
    return apiClient.post<{ id: string; message: string }, ReceiveInventoryBatchRequest>(
      "/api/v1/inventory/batches",
      payload
    );
  },

  async consumeFefo(
    payload: ConsumeStockFefoRequest
  ): Promise<{ message: string; consumedBatches: BatchConsumptionResult[] }> {
    return apiClient.post<
      { message: string; consumedBatches: BatchConsumptionResult[] },
      ConsumeStockFefoRequest
    >("/api/v1/inventory/consume", payload);
  },

  async listTransactions(
    itemId?: string,
    type?: InventoryTransactionType
  ): Promise<InventoryTransaction[]> {
    const params = new URLSearchParams();
    if (itemId) params.set("itemId", itemId);
    if (type) params.set("type", type);
    return apiClient.get<InventoryTransaction[]>(
      `/api/v1/inventory/transactions${params.size ? `?${params}` : ""}`
    );
  }
};
