"use client";

import { useEffect, useState } from "react";
import { insuranceService } from "@/services/insurance-service";
import type { InsuranceClaimDto } from "@/types/insurance";
import { InsuranceStatusBadge, InsuranceTypeBadge } from "./InsuranceStatusBadge";
import { formatDate, formatDateTime, formatVND } from "@/lib/format";

interface InsuranceClaimDetailModalProps {
  claimId: string;
  onClose: () => void;
  onRefresh?: () => void;
}

export function InsuranceClaimDetailModal({
  claimId,
  onClose,
  onRefresh,
}: InsuranceClaimDetailModalProps) {
  const [claim, setClaim] = useState<InsuranceClaimDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [approveAmount, setApproveAmount] = useState<number>(0);
  const [approveNotes, setApproveNotes] = useState("");

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [showPaidForm, setShowPaidForm] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const fetchClaim = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await insuranceService.getById(claimId);
      setClaim(data);
      setApproveAmount(data.claimAmount);
    } catch (err) {
      console.error(err);
      setError("Không thể tải thông tin hồ sơ bảo hiểm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaim();
  }, [claimId]);

  async function handleApprove(e: React.FormEvent) {
    e.preventDefault();
    if (approveAmount <= 0) {
      alert("Số tiền duyệt phải lớn hơn 0");
      return;
    }
    setSubmitting(true);
    try {
      await insuranceService.updateStatus(claimId, {
        action: "Approve",
        approvedAmount: approveAmount,
        notes: approveNotes.trim() || undefined,
      });
      setShowApproveForm(false);
      fetchClaim();
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert("Lỗi phê duyệt hồ sơ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối.");
      return;
    }
    setSubmitting(true);
    try {
      await insuranceService.updateStatus(claimId, {
        action: "Reject",
        reason: rejectReason.trim(),
      });
      setShowRejectForm(false);
      fetchClaim();
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert("Lỗi từ chối hồ sơ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePaid(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await insuranceService.updateStatus(claimId, {
        action: "Paid",
        reference: paymentRef.trim() || undefined,
      });
      setShowPaidForm(false);
      fetchClaim();
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert("Lỗi ghi nhận thanh toán. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl flex flex-col my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">
              Hồ sơ bảo hiểm: {claim?.claimNumber || "..."}
            </h2>
            {claim && <InsuranceStatusBadge status={claim.status} />}
            {claim && <InsuranceTypeBadge type={claim.insuranceType} />}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-2 text-sm">Đang tải chi tiết hồ sơ bảo hiểm...</p>
          </div>
        ) : error || !claim ? (
          <div className="p-8 text-center text-red-600">{error || "Không tìm thấy hồ sơ"}</div>
        ) : (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
            {/* General Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4 text-sm">
              <div>
                <span className="text-xs text-gray-400 block font-medium">Bệnh nhân</span>
                <span className="font-bold text-gray-900">{claim.patientName}</span>
                {claim.patientCode && (
                  <span className="text-xs text-gray-500 ml-1">({claim.patientCode})</span>
                )}
              </div>

              <div>
                <span className="text-xs text-gray-400 block font-medium">Đơn vị bảo hiểm</span>
                <span className="font-bold text-blue-700">{claim.providerName}</span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block font-medium">Số thẻ bảo hiểm</span>
                <span className="font-mono font-bold text-gray-800">{claim.cardNumber}</span>
              </div>

              {claim.policyNumber && (
                <div>
                  <span className="text-xs text-gray-400 block font-medium">Số hợp đồng</span>
                  <span className="font-mono text-gray-700">{claim.policyNumber}</span>
                </div>
              )}

              {claim.coverageRate && (
                <div>
                  <span className="text-xs text-gray-400 block font-medium">Tỷ lệ bảo hiểm chi trả</span>
                  <span className="font-semibold text-emerald-700">{claim.coverageRate}%</span>
                </div>
              )}

              <div>
                <span className="text-xs text-gray-400 block font-medium">Ngày nộp hồ sơ</span>
                <span className="text-gray-700">{formatDateTime(claim.submittedAt)}</span>
              </div>

              {claim.doctorName && (
                <div>
                  <span className="text-xs text-gray-400 block font-medium">Bác sĩ chỉ định</span>
                  <span className="font-medium text-gray-800">{claim.doctorName}</span>
                </div>
              )}

              {claim.invoiceNumber && (
                <div>
                  <span className="text-xs text-gray-400 block font-medium">Hóa đơn liên kết</span>
                  <span className="font-semibold text-blue-600">{claim.invoiceNumber}</span>
                </div>
              )}

              {claim.diagnosis && (
                <div className="sm:col-span-2 md:col-span-3">
                  <span className="text-xs text-gray-400 block font-medium">Chẩn đoán</span>
                  <span className="text-gray-800 italic">{claim.diagnosis}</span>
                </div>
              )}
            </div>

            {/* Notes / Reason if any */}
            {claim.rejectReason && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <span className="font-bold">Lý do từ chối:</span> {claim.rejectReason}
              </div>
            )}
            {claim.notes && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <span className="font-bold">Ghi chú duyệt/thanh toán:</span> {claim.notes}
              </div>
            )}

            {/* Items Table */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-2">
                Danh sách dịch vụ / thủ thuật bồi thường
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-4 py-3 text-left">Dịch vụ</th>
                      <th className="px-3 py-3 text-center">Răng số</th>
                      <th className="px-3 py-3 text-right">SL</th>
                      <th className="px-4 py-3 text-right">Đơn giá</th>
                      <th className="px-4 py-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {claim.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-medium">{item.description}</td>
                        <td className="px-3 py-3 text-center text-gray-500">{item.toothNumber || "—"}</td>
                        <td className="px-3 py-3 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatVND(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatVND(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Tổng tiền yêu cầu:</span>
                  <span className="font-bold text-gray-900">{formatVND(claim.claimAmount)}</span>
                </div>
                <div className="flex justify-between text-blue-700">
                  <span>Bảo hiểm chi trả:</span>
                  <span className="font-extrabold text-base">{formatVND(claim.approvedAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-orange-700 font-bold">
                  <span>Bệnh nhân tự chi trả:</span>
                  <span>{formatVND(claim.patientPayAmount)}</span>
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            {claim.status === "Processing" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Thẩm định & Xử lý hồ sơ bảo hiểm
                </p>

                {/* Approve Form */}
                {showApproveForm ? (
                  <form onSubmit={handleApprove} className="space-y-3 bg-white p-4 rounded-xl border border-blue-200">
                    <h4 className="text-sm font-bold text-blue-900">Duyệt chi trả bảo hiểm</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Số tiền bảo hiểm chấp thuận chi trả (₫) *
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={claim.claimAmount}
                          value={approveAmount}
                          onChange={(e) => setApproveAmount(Number(e.target.value))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Ghi chú phê duyệt (tùy chọn)
                        </label>
                        <input
                          type="text"
                          value={approveNotes}
                          onChange={(e) => setApproveNotes(e.target.value)}
                          placeholder="VD: Duyệt đúng tuyến 80% theo danh mục BHYT"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowApproveForm(false)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submitting ? "Đang xử lý..." : "Xác nhận duyệt"}
                      </button>
                    </div>
                  </form>
                ) : showRejectForm ? (
                  <form onSubmit={handleReject} className="space-y-3 bg-white p-4 rounded-xl border border-red-200">
                    <h4 className="text-sm font-bold text-red-900">Từ chối bồi thường bảo hiểm</h4>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Lý do từ chối *
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={2}
                        placeholder="VD: Thẻ hết hạn sử dụng / Dịch vụ không thuộc danh mục bảo lãnh..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                        required
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowRejectForm(false)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {submitting ? "Đang xử lý..." : "Xác nhận từ chối"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowApproveForm(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
                    >
                      ✓ Duyệt chi trả bảo hiểm
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      ✕ Từ chối bồi thường
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* When Approved -> Allow marking as Paid */}
            {claim.status === "Approved" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Thanh toán bảo lãnh & Quyết toán bồi thường
                </p>

                {showPaidForm ? (
                  <form onSubmit={handlePaid} className="space-y-3 bg-white p-4 rounded-xl border border-emerald-200">
                    <h4 className="text-sm font-bold text-emerald-900">
                      Xác nhận nhận tiền bảo hiểm chi trả ({formatVND(claim.approvedAmount)})
                    </h4>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Mã giao dịch / Mã tham chiếu ngân hàng (tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="VD: FT2611... hoặc mã chuyển khoản bảo hiểm"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    {claim.invoiceId && (
                      <p className="text-xs text-blue-600">
                        ℹ️ Hệ thống sẽ tự động ghi nhận thanh toán {formatVND(claim.approvedAmount)} vào hóa đơn {claim.invoiceNumber || "liên kết"}.
                      </p>
                    )}
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowPaidForm(false)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {submitting ? "Đang xử lý..." : "Xác nhận đã nhận tiền"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPaidForm(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                  >
                    💰 Xác nhận đã nhận tiền bảo hiểm ({formatVND(claim.approvedAmount)})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
