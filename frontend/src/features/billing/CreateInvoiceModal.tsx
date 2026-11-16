"use client";

import { useState } from "react";
import { invoiceService } from "@/services/invoice-service";
import type { CreateInvoiceLineRequest, CreateInvoiceRequest } from "@/types/invoice";
import { formatVND } from "@/lib/format";

interface CreateInvoiceModalProps {
  clinicId: string;
  patientId?: string;
  patientName?: string;
  appointmentId?: string;
  onClose: () => void;
  onSuccess: (invoiceId: string) => void;
}

interface LineItem extends CreateInvoiceLineRequest {
  _key: number;
}

type DiscountType = "none" | "percent" | "flat";

let _keyCounter = 0;
const nextKey = () => ++_keyCounter;

function emptyLine(): LineItem {
  return { _key: nextKey(), description: "", quantity: 1, unitPrice: 0 };
}

export function CreateInvoiceModal({
  clinicId,
  patientId = "",
  patientName = "",
  appointmentId,
  onClose,
  onSuccess,
}: CreateInvoiceModalProps) {
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subTotal = lines.reduce(
    (sum, l) => sum + l.quantity * l.unitPrice,
    0
  );
  const discountValue =
    discountType === "percent"
      ? Math.round(subTotal * (discountPercent / 100))
      : discountType === "flat"
      ? discountAmount
      : 0;
  const total = Math.max(0, subTotal - discountValue);

  function updateLine(key: number, patch: Partial<LineItem>) {
    setLines((prev) =>
      prev.map((l) => (l._key === key ? { ...l, ...patch } : l))
    );
  }

  function removeLine(key: number) {
    setLines((prev) => prev.filter((l) => l._key !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
      setError("Vui lòng thêm ít nhất một dịch vụ.");
      return;
    }
    if (lines.some((l) => !l.description.trim())) {
      setError("Vui lòng nhập mô tả cho tất cả dịch vụ.");
      return;
    }
    setLoading(true);
    setError(null);

    const body: CreateInvoiceRequest = {
      patientId,
      clinicId,
      appointmentId: appointmentId ?? null,
      notes: notes.trim() || null,
      discountPercent: discountType === "percent" ? discountPercent : 0,
      discountAmount: discountType === "flat" ? discountAmount : 0,
      lines: lines.map(({ _key: _k, ...rest }) => rest),
    };

    try {
      const { id } = await invoiceService.create(body);
      onSuccess(id);
    } catch (err) {
      console.error(err);
      setError("Không thể tạo hóa đơn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            🧾 Tạo hóa đơn mới
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            {/* Patient info */}
            {patientName && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
                👤 Bệnh nhân: <span className="font-semibold">{patientName}</span>
                {appointmentId && (
                  <span className="ml-3 text-blue-500">
                    · Lịch hẹn: {appointmentId.slice(0, 8)}...
                  </span>
                )}
              </div>
            )}

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Dịch vụ</h3>
                <button
                  type="button"
                  onClick={() => setLines((p) => [...p, emptyLine()])}
                  className="text-xs text-blue-600 hover:underline"
                >
                  + Thêm dịch vụ
                </button>
              </div>

              <div className="space-y-2">
                {lines.map((line, idx) => (
                  <div
                    key={line._key}
                    className="grid grid-cols-12 gap-2 items-start rounded-lg border border-gray-200 p-3"
                  >
                    {/* Description */}
                    <div className="col-span-5">
                      {idx === 0 && (
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Mô tả *
                        </label>
                      )}
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) =>
                          updateLine(line._key, { description: e.target.value })
                        }
                        placeholder="Tên dịch vụ..."
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                    {/* Tooth */}
                    <div className="col-span-2">
                      {idx === 0 && (
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Răng số
                        </label>
                      )}
                      <input
                        type="text"
                        value={line.toothNumber ?? ""}
                        onChange={(e) =>
                          updateLine(line._key, {
                            toothNumber: e.target.value || undefined,
                          })
                        }
                        placeholder="11, 12..."
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    {/* Qty */}
                    <div className="col-span-1">
                      {idx === 0 && (
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          SL
                        </label>
                      )}
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line._key, {
                            quantity: Math.max(1, Number(e.target.value)),
                          })
                        }
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    {/* Unit price */}
                    <div className="col-span-3">
                      {idx === 0 && (
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Đơn giá (₫)
                        </label>
                      )}
                      <input
                        type="number"
                        min={0}
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(line._key, {
                            unitPrice: Math.max(0, Number(e.target.value)),
                          })
                        }
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    {/* Remove */}
                    <div className={`col-span-1 flex ${idx === 0 ? "mt-5" : ""} justify-center`}>
                      <button
                        type="button"
                        onClick={() => removeLine(line._key)}
                        disabled={lines.length === 1}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg leading-none"
                        title="Xóa dòng"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Chiết khấu
              </h3>
              <div className="flex gap-3 mb-3">
                {(["none", "percent", "flat"] as DiscountType[]).map((t) => (
                  <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="discountType"
                      value={t}
                      checked={discountType === t}
                      onChange={() => setDiscountType(t)}
                      className="accent-blue-600"
                    />
                    {t === "none" ? "Không" : t === "percent" ? "Theo %" : "Số tiền cố định"}
                  </label>
                ))}
              </div>
              {discountType === "percent" && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) =>
                      setDiscountPercent(
                        Math.min(100, Math.max(0, Number(e.target.value)))
                      )
                    }
                    className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              )}
              {discountType === "flat" && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={discountAmount}
                    onChange={(e) =>
                      setDiscountAmount(Math.max(0, Number(e.target.value)))
                    }
                    className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-500">₫</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ghi chú thêm (tùy chọn)..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Preview totals */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>{formatVND(subTotal)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    Chiết khấu{" "}
                    {discountType === "percent" ? `(${discountPercent}%)` : ""}
                  </span>
                  <span>- {formatVND(discountValue)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-200 pt-2">
                <span>Tổng cộng</span>
                <span>{formatVND(total)}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-gray-100 px-6 py-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Đang tạo..." : "Tạo hóa đơn"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
