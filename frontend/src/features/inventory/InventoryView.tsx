"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  History,
  Package,
  Pencil,
  Plus,
  Search,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { inventoryService } from "@/services/inventory-service";
import type {
  BatchConsumptionResult,
  InventoryBatch,
  InventoryItem,
  InventoryTransaction,
  InventoryTransactionType
} from "@/types/inventory";

type ActiveTab = "items" | "batches" | "transactions";

const TX_TYPE_LABELS: Record<InventoryTransactionType, { label: string; badgeClass: string }> = {
  Import: { label: "Nhập kho", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ProcedureExport: { label: "Xuất thủ thuật", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  Disposal: { label: "Xuất hủy hỏng", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
  PrescriptionDispense: { label: "Cấp thuốc", badgeClass: "bg-violet-50 text-violet-700 border-violet-200" },
  Adjustment: { label: "Điều chỉnh", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" }
};

export function InventoryView() {
  const { user } = useAuth();
  const clinicId = user?.activeClinicId;

  if (!clinicId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-lg font-semibold">Chưa chọn phòng khám làm việc</h2>
        <p className="mt-1 text-sm">Chọn phòng khám ở thanh điều hướng để xem và quản lý kho.</p>
      </div>
    );
  }

  return <ClinicInventoryView key={clinicId} />;
}

function ClinicInventoryView() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("items");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [search, setSearch] = useState("");
  const [txFilterType, setTxFilterType] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastConsumed, setLastConsumed] = useState<BatchConsumptionResult[] | null>(null);

  // Modals state
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [consumeModalOpen, setConsumeModalOpen] = useState(false);

  // Item form state
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("Vật tư y tế");
  const [itemUnit, setItemUnit] = useState("Hộp");
  const [itemMinStock, setItemMinStock] = useState(10);
  const [itemDesc, setItemDesc] = useState("");
  const [itemActive, setItemActive] = useState(true);

  // Batch form state
  const [batchNumber, setBatchNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [batchQty, setBatchQty] = useState(10);
  const [batchCost, setBatchCost] = useState(0);
  const [batchRef, setBatchRef] = useState("");
  const [batchNote, setBatchNote] = useState("");

  // Consume form state
  const [consumeQty, setConsumeQty] = useState(1);
  const [consumeType, setConsumeType] = useState<InventoryTransactionType>("ProcedureExport");
  const [consumeRef, setConsumeRef] = useState("");
  const [consumeNote, setConsumeNote] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.listItems(search);
      setItems(data);
      setSelectedItem((prev) => {
        if (!prev) return data[0] ?? null;
        return data.find((i) => i.id === prev.id) ?? data[0] ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách vật tư.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadBatches = useCallback(async () => {
    if (!selectedItem) {
      setBatches([]);
      return;
    }
    try {
      const data = await inventoryService.listBatches(selectedItem.id);
      setBatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách lô hàng.");
    }
  }, [selectedItem]);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await inventoryService.listTransactions(
        undefined,
        txFilterType ? (txFilterType as InventoryTransactionType) : undefined
      );
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải lịch sử giao dịch kho.");
    }
  }, [txFilterType]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (activeTab === "batches") {
      void loadBatches();
    } else if (activeTab === "transactions") {
      void loadTransactions();
    }
  }, [activeTab, loadBatches, loadTransactions]);

  const lowStockCount = useMemo(() => items.filter((i) => i.isLowStock).length, [items]);
  const totalUnits = useMemo(
    () => items.reduce((acc, item) => acc + item.totalQuantityOnHand, 0),
    [items]
  );

  function openCreateItemModal() {
    setEditingItem(null);
    setItemCode("");
    setItemName("");
    setItemCategory("Vật tư y tế");
    setItemUnit("Hộp");
    setItemMinStock(10);
    setItemDesc("");
    setItemActive(true);
    setItemModalOpen(true);
  }

  function openEditItemModal(item: InventoryItem) {
    setEditingItem(item);
    setItemCode(item.code);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemUnit(item.unit);
    setItemMinStock(item.minimumStock);
    setItemDesc(item.description ?? "");
    setItemActive(item.isActive);
    setItemModalOpen(true);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      if (editingItem) {
        await inventoryService.updateItem(editingItem.id, {
          name: itemName,
          category: itemCategory,
          unit: itemUnit,
          minimumStock: Number(itemMinStock),
          description: itemDesc || undefined,
          isActive: itemActive
        });
        setFeedback("Đã cập nhật vật tư thành công.");
      } else {
        await inventoryService.createItem({
          code: itemCode,
          name: itemName,
          category: itemCategory,
          unit: itemUnit,
          minimumStock: Number(itemMinStock),
          description: itemDesc || undefined
        });
        setFeedback("Đã thêm vật tư mới thành công.");
      }
      setItemModalOpen(false);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu vật tư.");
    }
  }

  async function handleReceiveBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem) return;
    setError(null);
    setFeedback(null);
    try {
      await inventoryService.receiveBatch({
        inventoryItemId: selectedItem.id,
        batchNumber,
        expirationDate,
        quantity: Number(batchQty),
        unitCost: Number(batchCost),
        referenceCode: batchRef || undefined,
        note: batchNote || undefined
      });
      setBatchModalOpen(false);
      setBatchNumber("");
      setBatchRef("");
      setBatchNote("");
      setFeedback(`Đã nhập lô hàng mới cho "${selectedItem.name}".`);
      await Promise.all([loadItems(), loadBatches()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể nhập lô hàng.");
    }
  }

  async function handleConsumeFefo(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem) return;
    setError(null);
    setFeedback(null);
    try {
      const res = await inventoryService.consumeFefo({
        inventoryItemId: selectedItem.id,
        quantity: Number(consumeQty),
        transactionType: consumeType,
        referenceCode: consumeRef || undefined,
        note: consumeNote || undefined
      });
      setLastConsumed(res.consumedBatches);
      setConsumeModalOpen(false);
      setConsumeRef("");
      setConsumeNote("");
      setFeedback(`Đã xuất ${consumeQty} ${selectedItem.unit} "${selectedItem.name}" theo FEFO.`);
      await Promise.all([loadItems(), loadBatches()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xuất kho.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý Kho Vật tư & Lô hàng (FEFO)
          </h1>
          <p className="text-sm text-slate-500">
            Theo dõi danh mục vật tư y tế, lô hàng theo hạn sử dụng và lịch sử nhập/xuất kho.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateItemModal}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" />
            Thêm vật tư
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Tổng danh mục vật tư</span>
            <Package className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{items.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Tổng tồn kho khả dụng</span>
            <Boxes className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalUnits}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Dưới ngưỡng tối thiểu</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600">{lowStockCount}</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {feedback && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("items")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${
            activeTab === "items"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Package className="h-4 w-4" />
          Danh mục Vật tư
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("batches")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${
            activeTab === "batches"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Boxes className="h-4 w-4" />
          Lô hàng & Xuất FEFO
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("transactions")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${
            activeTab === "transactions"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <History className="h-4 w-4" />
          Lịch sử Giao dịch
        </button>
      </div>

      {/* TAB 1: ITEMS */}
      {activeTab === "items" && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã, tên hoặc loại..."
              className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Mã</th>
                  <th className="px-4 py-3">Tên vật tư / thuốc</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">ĐVT</th>
                  <th className="px-4 py-3 text-right">Tồn khả dụng</th>
                  <th className="px-4 py-3 text-right">Tối thiểu</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Chưa có vật tư nào. Nhấn &quot;Thêm vật tư&quot; để bắt đầu.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                        {item.code}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-slate-600">{item.category}</td>
                      <td className="px-4 py-3 text-slate-600">{item.unit}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {item.totalQuantityOnHand}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">{item.minimumStock}</td>
                      <td className="px-4 py-3">
                        {item.isLowStock ? (
                          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                            Sắp hết hàng
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            Đủ tồn kho
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditItemModal(item)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            title="Sửa vật tư"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(item);
                              setActiveTab("batches");
                            }}
                            className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
                          >
                            Lô & Nhập/Xuất
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BATCHES & FEFO */}
      {activeTab === "batches" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <label htmlFor="batch-item-select" className="text-sm font-medium text-slate-700">
                Vật tư:
              </label>
              <select
                id="batch-item-select"
                value={selectedItem?.id ?? ""}
                onChange={(e) => {
                  const found = items.find((i) => i.id === e.target.value) ?? null;
                  setSelectedItem(found);
                  setLastConsumed(null);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.code}] {item.name} (Tồn: {item.totalQuantityOnHand} {item.unit})
                  </option>
                ))}
              </select>
            </div>
            {selectedItem && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <ArrowDownCircle className="h-4 w-4" />
                  Nhập lô mới
                </button>
                <button
                  type="button"
                  onClick={() => setConsumeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-amber-700"
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  Xuất kho FEFO
                </button>
              </div>
            )}
          </div>

          {lastConsumed && lastConsumed.length > 0 && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              <p className="font-semibold">Chi tiết các lô đã trừ tự động theo FEFO:</p>
              <ul className="mt-1 list-disc pl-5">
                {lastConsumed.map((c) => (
                  <li key={c.batchId}>
                    Lô <strong>{c.batchNumber}</strong> (HSD: {c.expirationDate}): đã xuất{" "}
                    <strong>{c.consumedQuantity}</strong>, còn lại{" "}
                    <strong>{c.remainingInBatch}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Số lô</th>
                  <th className="px-4 py-3">Hạn sử dụng</th>
                  <th className="px-4 py-3 text-right">Số lượng còn</th>
                  <th className="px-4 py-3 text-right">Giá nhập</th>
                  <th className="px-4 py-3">Cảnh báo HSD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Chưa có lô hàng nào cho vật tư này.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr
                      key={b.id}
                      className={
                        b.isExpired
                          ? "bg-rose-50/70"
                          : b.isExpiringSoon
                          ? "bg-amber-50/70"
                          : "hover:bg-slate-50"
                      }
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        {b.batchNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{b.expirationDate}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {b.quantityOnHand}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {b.unitCost.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3">
                        {b.isExpired ? (
                          <span className="inline-flex rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                            Đã hết hạn
                          </span>
                        ) : b.isExpiringSoon ? (
                          <span className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            Sắp hết hạn (&le; 30 ngày)
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            Còn hạn
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTIONS */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label htmlFor="tx-type-filter" className="text-sm font-medium text-slate-700">
              Loại giao dịch:
            </label>
            <select
              id="tx-type-filter"
              value={txFilterType}
              onChange={(e) => setTxFilterType(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            >
              <option value="">Tất cả</option>
              <option value="Import">Nhập kho</option>
              <option value="ProcedureExport">Xuất thủ thuật</option>
              <option value="Disposal">Xuất hủy hỏng</option>
              <option value="PrescriptionDispense">Cấp thuốc</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Số lô</th>
                  <th className="px-4 py-3 text-right">Số lượng</th>
                  <th className="px-4 py-3">Mã chứng từ</th>
                  <th className="px-4 py-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Chưa có giao dịch kho nào.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const meta = TX_TYPE_LABELS[tx.type] ?? {
                      label: tx.type,
                      badgeClass: "bg-slate-100 text-slate-700 border-slate-200"
                    };
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {new Date(tx.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">
                          {tx.batchNumber}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {tx.quantity}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{tx.referenceCode || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{tx.note || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT ITEM */}
      {itemModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="item-modal-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 id="item-modal-title" className="text-lg font-semibold text-slate-900">
                {editingItem ? "Cập nhật vật tư" : "Thêm vật tư / thuốc mới"}
              </h2>
              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="mt-4 space-y-4">
              {!editingItem && (
                <div>
                  <label htmlFor="item-code" className="block text-sm font-medium text-slate-700">
                    Mã vật tư *
                  </label>
                  <input
                    id="item-code"
                    required
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    placeholder="VD: VT-GANGTAY-M"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label htmlFor="item-name" className="block text-sm font-medium text-slate-700">
                  Tên vật tư / thuốc *
                </label>
                <input
                  id="item-name"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="VD: Găng tay y tế không bột"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="item-category" className="block text-sm font-medium text-slate-700">
                    Phân loại
                  </label>
                  <input
                    id="item-category"
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="item-unit" className="block text-sm font-medium text-slate-700">
                    Đơn vị tính *
                  </label>
                  <input
                    id="item-unit"
                    required
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    placeholder="Hộp / Viên / Tuýp"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="item-min-stock" className="block text-sm font-medium text-slate-700">
                  Ngưỡng tồn kho tối thiểu
                </label>
                <input
                  id="item-min-stock"
                  type="number"
                  min={0}
                  value={itemMinStock}
                  onChange={(e) => setItemMinStock(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="item-desc" className="block text-sm font-medium text-slate-700">
                  Mô tả
                </label>
                <textarea
                  id="item-desc"
                  rows={2}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                >
                  Lưu vật tư
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECEIVE BATCH */}
      {batchModalOpen && selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="batch-modal-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 id="batch-modal-title" className="text-lg font-semibold text-slate-900">
                Nhập lô mới: {selectedItem.name}
              </h2>
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleReceiveBatch} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="batch-num" className="block text-sm font-medium text-slate-700">
                    Số lô *
                  </label>
                  <input
                    id="batch-num"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="VD: LOT-2026-01"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="batch-exp" className="block text-sm font-medium text-slate-700">
                    Hạn sử dụng *
                  </label>
                  <input
                    id="batch-exp"
                    type="date"
                    required
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="batch-qty" className="block text-sm font-medium text-slate-700">
                    Số lượng nhập ({selectedItem.unit}) *
                  </label>
                  <input
                    id="batch-qty"
                    type="number"
                    min={1}
                    required
                    value={batchQty}
                    onChange={(e) => setBatchQty(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="batch-cost" className="block text-sm font-medium text-slate-700">
                    Giá nhập (VNĐ)
                  </label>
                  <input
                    id="batch-cost"
                    type="number"
                    min={0}
                    value={batchCost}
                    onChange={(e) => setBatchCost(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="batch-ref" className="block text-sm font-medium text-slate-700">
                    Mã phiếu nhập
                  </label>
                  <input
                    id="batch-ref"
                    value={batchRef}
                    onChange={(e) => setBatchRef(e.target.value)}
                    placeholder="PN-001"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="batch-note" className="block text-sm font-medium text-slate-700">
                    Ghi chú
                  </label>
                  <input
                    id="batch-note"
                    value={batchNote}
                    onChange={(e) => setBatchNote(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Xác nhận nhập lô
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONSUME FEFO */}
      {consumeModalOpen && selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consume-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 id="consume-modal-title" className="text-lg font-semibold text-slate-900">
                Xuất kho FEFO: {selectedItem.name}
              </h2>
              <button
                type="button"
                onClick={() => setConsumeModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleConsumeFefo} className="mt-4 space-y-4">
              <div>
                <label htmlFor="consume-type" className="block text-sm font-medium text-slate-700">
                  Loại phiếu xuất
                </label>
                <select
                  id="consume-type"
                  value={consumeType}
                  onChange={(e) => setConsumeType(e.target.value as InventoryTransactionType)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="ProcedureExport">Xuất thủ thuật</option>
                  <option value="Disposal">Xuất hủy hỏng</option>
                  <option value="Adjustment">Điều chỉnh giảm</option>
                </select>
              </div>
              <div>
                <label htmlFor="consume-qty" className="block text-sm font-medium text-slate-700">
                  Số lượng xuất ({selectedItem.unit}) *
                </label>
                <input
                  id="consume-qty"
                  type="number"
                  min={1}
                  required
                  value={consumeQty}
                  onChange={(e) => setConsumeQty(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="consume-ref" className="block text-sm font-medium text-slate-700">
                  Mã tham chiếu
                </label>
                <input
                  id="consume-ref"
                  value={consumeRef}
                  onChange={(e) => setConsumeRef(e.target.value)}
                  placeholder="PX-001"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="consume-note" className="block text-sm font-medium text-slate-700">
                  Lý do / Ghi chú
                </label>
                <input
                  id="consume-note"
                  value={consumeNote}
                  onChange={(e) => setConsumeNote(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConsumeModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                >
                  Xuất kho ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
