"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { shiftService } from "@/services/shift-service";
import type { CashierShiftDto, CashierShiftSummaryDto } from "@/types/shift";
import { formatDateTime, formatVND } from "@/lib/format";

interface CashierShiftViewProps {
  clinicId: string;
  cashierId: string;
  cashierName: string;
}

export function CashierShiftView({
  clinicId,
  cashierId,
  cashierName,
}: CashierShiftViewProps) {
  const [currentShift, setCurrentShift] = useState<CashierShiftDto | null>(null);
  const [pastShifts, setPastShifts] = useState<CashierShiftSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Open shift modal
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState<number>(1000000); // 1,000,000 VND default
  const [openNotes, setOpenNotes] = useState("");
  const [submittingOpen, setSubmittingOpen] = useState(false);

  // Close shift form inputs
  const [actualCash, setActualCash] = useState<number>(0);
  const [actualTransfer, setActualTransfer] = useState<number>(0);
  const [actualCard, setActualCard] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState("");
  const [submittingClose, setSubmittingClose] = useState(false);
  const [closeSuccess, setCloseSuccess] = useState(false);

  const fetchCurrentShift = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    setError(null);
    try {
      const active = await shiftService.getCurrent({ clinicId, cashierId });
      setCurrentShift(active);

      if (active) {
        // Pre-fill inputs with expected amounts for cashier ease
        setActualCash(active.expectedTotalCash);
        setActualTransfer(active.systemTransferAmount);
        setActualCard(active.systemCardAmount);
      }

      // Fetch history
      const history = await shiftService.list({ clinicId });
      setPastShifts(history);
    } catch (err) {
      console.error(err);
      setError("Không thể tải thông tin ca làm việc. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [clinicId, cashierId]);

  useEffect(() => {
    fetchCurrentShift();
  }, [fetchCurrentShift]);

  // Differences calculation
  const cashDifference = useMemo(() => {
    if (!currentShift) return 0;
    return actualCash - currentShift.expectedTotalCash;
  }, [actualCash, currentShift]);

  const transferDifference = useMemo(() => {
    if (!currentShift) return 0;
    return actualTransfer - currentShift.systemTransferAmount;
  }, [actualTransfer, currentShift]);

  const cardDifference = useMemo(() => {
    if (!currentShift) return 0;
    return actualCard - currentShift.systemCardAmount;
  }, [actualCard, currentShift]);

  async function handleOpenShift(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingOpen(true);
    setError(null);
    try {
      await shiftService.open({
        clinicId,
        cashierId,
        cashierName,
        openingCash: openingCashInput,
        notes: openNotes.trim() || undefined,
      });
      setShowOpenModal(false);
      fetchCurrentShift();
    } catch (err) {
      console.error(err);
      setError("Không thể mở ca làm việc. Vui lòng thử lại.");
    } finally {
      setSubmittingOpen(false);
    }
  }

  async function handleCloseShift(e: React.FormEvent) {
    e.preventDefault();
    if (!currentShift) return;

    if (!confirm("Bạn có chắc chắn muốn chốt ca làm việc này? Sau khi chốt ca sẽ không thể sửa đổi số liệu.")) {
      return;
    }

    setSubmittingClose(true);
    setError(null);
    try {
      await shiftService.close(currentShift.id, {
        actualCash,
        actualTransfer,
        actualCard,
        notes: closeNotes.trim() || undefined,
      });
      setCloseSuccess(true);
      fetchCurrentShift();
    } catch (err) {
      console.error(err);
      setError("Không thể chốt ca làm việc. Vui lòng thử lại.");
    } finally {
      setSubmittingClose(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Chốt ca làm việc thu ngân cuối ngày
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý ca làm việc, kiểm đếm tiền mặt két, đối soát VietQR/POS và bàn giao ca
          </p>
        </div>

        {!currentShift && !loading && (
          <button
            onClick={() => setShowOpenModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <span>▶</span> Mở ca làm việc mới
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {closeSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between">
          <span>✓ Đã chốt ca làm việc thành công! Số liệu đã được lưu trữ vào sổ quỹ.</span>
          <button
            onClick={() => setCloseSuccess(false)}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="mt-2 text-sm font-medium">Đang tải thông tin ca làm việc...</p>
        </div>
      ) : currentShift ? (
        /* ACTIVE SHIFT RECONCILIATION PANEL */
        <div className="rounded-2xl border-2 border-blue-300 bg-white shadow-md overflow-hidden">
          {/* Header of Active Shift */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-blue-100 bg-linear-to-r from-blue-700 to-indigo-800 px-6 py-4 text-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
                  Ca đang hoạt động
                </span>
                <span className="font-mono text-sm font-black bg-white/20 rounded px-2 py-0.5">
                  {currentShift.shiftNumber}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1">
                Thu ngân: <span className="font-bold text-white">{currentShift.cashierName}</span>
                &nbsp;·&nbsp; Mở lúc: {formatDateTime(currentShift.startedAt)}
              </p>
            </div>

            <div className="mt-3 sm:mt-0 text-left sm:text-right">
              <span className="text-xs text-blue-200 block">Tiền mặt đầu ca trong két:</span>
              <span className="text-lg font-black text-white">{formatVND(currentShift.openingCash)}</span>
            </div>
          </div>

          <form onSubmit={handleCloseShift} className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3">
                Đối soát số tiền thực nhận với hệ thống (Audit & Reconciliation)
              </h3>

              {/* Table of Reconciliation */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-bold text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">Phương thức</th>
                      <th className="px-4 py-3 text-right">Hệ thống ghi nhận</th>
                      <th className="px-4 py-3 text-right">Số tiền thực tế kiểm đếm (₫)</th>
                      <th className="px-4 py-3 text-center">Chênh lệch đối soát</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* 1. Cash */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-emerald-800">
                        💵 Tiền mặt két
                        <span className="block text-[11px] text-gray-400 font-normal">
                          (Đầu ca {formatVND(currentShift.openingCash)} + Thu {formatVND(currentShift.systemCashAmount)})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {formatVND(currentShift.expectedTotalCash)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          value={actualCash}
                          onChange={(e) => setActualCash(Number(e.target.value))}
                          className="w-40 rounded-lg border border-gray-300 px-3 py-1.5 text-right font-bold text-gray-900 focus:border-blue-500 focus:outline-none"
                          required
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {cashDifference === 0 ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs text-emerald-800">
                            ✓ Khớp 100%
                          </span>
                        ) : cashDifference > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-800">
                            Thừa +{formatVND(cashDifference)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-800">
                            Thiếu {formatVND(cashDifference)}
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* 2. Transfer / VietQR */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-blue-800">
                        📲 Chuyển khoản VietQR
                        <span className="block text-[11px] text-gray-400 font-normal">
                          Đối soát trên thông báo / app ngân hàng
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {formatVND(currentShift.systemTransferAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          value={actualTransfer}
                          onChange={(e) => setActualTransfer(Number(e.target.value))}
                          className="w-40 rounded-lg border border-gray-300 px-3 py-1.5 text-right font-bold text-gray-900 focus:border-blue-500 focus:outline-none"
                          required
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {transferDifference === 0 ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs text-emerald-800">
                            ✓ Khớp 100%
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-800">
                            Lệch {formatVND(transferDifference)}
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* 3. Card POS */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-purple-800">
                        💳 Quẹt thẻ máy POS
                        <span className="block text-[11px] text-gray-400 font-normal">
                          Tổng kết trên biên lai chốt ca máy POS
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {formatVND(currentShift.systemCardAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          value={actualCard}
                          onChange={(e) => setActualCard(Number(e.target.value))}
                          className="w-40 rounded-lg border border-gray-300 px-3 py-1.5 text-right font-bold text-gray-900 focus:border-blue-500 focus:outline-none"
                          required
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {cardDifference === 0 ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs text-emerald-800">
                            ✓ Khớp 100%
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-800">
                            Lệch {formatVND(cardDifference)}
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* 4. Insurance */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-teal-800">
                        🏥 Bảo hiểm chi trả
                        <span className="block text-[11px] text-gray-400 font-normal">
                          Bảo lãnh viện phí đã duyệt quyết toán
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {formatVND(currentShift.systemInsuranceAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 font-medium">
                        — (Quyết toán)
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 text-xs">
                        Tự động cấn trừ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Handover Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Giải trình chênh lệch / Ghi chú bàn giao ca cho người kế tiếp
              </label>
              <textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                rows={2}
                placeholder="VD: Tiền mặt khớp 100%. Bàn giao lại 1.000.000đ tiền lẻ cho ca tối. Nộp về thủ quỹ 2.500.000đ..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Submit Close Shift */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-xs text-gray-500 italic">
                * Sau khi chốt ca, hệ thống sẽ khóa sổ thu chi ca này và lưu vào báo cáo tài chính.
              </span>

              <button
                type="submit"
                disabled={submittingClose}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submittingClose ? "Đang xử lý..." : "🔒 Xác nhận chốt ca làm việc"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* NO SHIFT OPEN BANNER */
        <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/70 p-12 text-center space-y-3">
          <span className="text-4xl block">🕒</span>
          <h2 className="text-lg font-bold text-gray-800">
            Hiện tại chưa có ca làm việc nào đang mở
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Vui lòng mở ca làm việc mới trước khi tiếp nhận các khoản thu tiền viện phí tại quầy lễ tân / thu ngân.
          </p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <span>▶</span> Mở ca làm việc mới ngay
          </button>
        </div>
      )}

      {/* PAST SHIFTS TABLE */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-gray-900">
          Lịch sử các ca làm việc gần đây
        </h3>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Mã ca</th>
                <th className="px-4 py-3 text-left">Thu ngân</th>
                <th className="px-4 py-3 text-left">Bắt đầu</th>
                <th className="px-4 py-3 text-left">Kết thúc</th>
                <th className="px-4 py-3 text-right">Tiền đầu ca</th>
                <th className="px-4 py-3 text-right">Tổng thu HT</th>
                <th className="px-4 py-3 text-right">Tiền mặt thực đếm</th>
                <th className="px-4 py-3 text-center">Chênh lệch</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pastShifts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    Chưa có ca làm việc nào được ghi nhận
                  </td>
                </tr>
              ) : (
                pastShifts.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      {s.shiftNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {s.cashierName}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDateTime(s.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {s.closedAt ? formatDateTime(s.closedAt) : "Đang mở..."}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-700">
                      {formatVND(s.openingCash)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {formatVND(s.systemTotalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {s.actualCashAmount !== null && s.actualCashAmount !== undefined
                        ? formatVND(s.actualCashAmount)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {s.cashDifference === null || s.cashDifference === undefined ? (
                        <span className="text-gray-400 font-normal">—</span>
                      ) : s.cashDifference === 0 ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                          Khớp
                        </span>
                      ) : s.cashDifference > 0 ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                          +{formatVND(s.cashDifference)}
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                          {formatVND(s.cashDifference)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                          s.status === "Open"
                            ? "bg-blue-100 text-blue-800 animate-pulse"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {s.status === "Open" ? "Đang mở" : "Đã chốt ca"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OPEN SHIFT MODAL */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 bg-linear-to-r from-blue-700 to-indigo-800 px-6 py-4 text-white">
              <h2 className="text-base font-bold">Mở ca làm việc mới</h2>
              <button
                onClick={() => setShowOpenModal(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Thu ngân phụ trách ca
                </label>
                <input
                  type="text"
                  value={cashierName}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Tiền mặt đầu ca trong két (để thối tiền) (₫) *
                </label>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base font-bold text-gray-900 focus:border-blue-500 focus:outline-none"
                  required
                />
                <div className="flex gap-1.5 mt-2">
                  {[500000, 1000000, 2000000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setOpeningCashInput(v)}
                      className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      {formatVND(v)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Ghi chú mở ca (tùy chọn)
                </label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  placeholder="VD: Ca sáng (8h - 17h)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="flex-1 rounded-xl border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingOpen}
                  className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submittingOpen ? "Đang mở..." : "Xác nhận mở ca"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
