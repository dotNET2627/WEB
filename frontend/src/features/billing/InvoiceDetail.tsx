"use client";

import { useState } from "react";
import type { InvoiceDto } from "@/types/invoice";
import { PAYMENT_METHOD_LABELS } from "@/types/invoice";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { invoiceService } from "@/services/invoice-service";
import { formatVND } from "@/lib/format";

interface InvoiceDetailProps {
  invoice: InvoiceDto;
  onRefresh?: () => void;
  onCancel?: () => void;
}

export function InvoiceDetail({
  invoice,
  onRefresh,
  onCancel,
}: InvoiceDetailProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const canPay =
    invoice.status === "Unpaid" || invoice.status === "PartiallyPaid";
  const canCancel =
    invoice.status === "Unpaid" || invoice.status === "PartiallyPaid";

  async function handleCancel() {
    if (!confirm("Bạn có chắc muốn hủy hóa đơn này?")) return;
    setCancelling(true);
    try {
      await invoiceService.cancel(invoice.id);
      onCancel?.();
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert("Không thể hủy hóa đơn. Vui lòng thử lại.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              {invoice.invoiceNumber}
            </h2>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Bệnh nhân:{" "}
            <span className="font-medium text-gray-700">
              {invoice.patientName}
            </span>{" "}
            &nbsp;·&nbsp; Ngày:{" "}
            {new Date(invoice.issuedAt).toLocaleDateString("vi-VN")}
          </p>
          {invoice.appointmentId && (
            <p className="text-xs text-gray-400 mt-0.5">
              Lịch hẹn: {invoice.appointmentId}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {canPay && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              💳 Ghi nhận thanh toán
            </button>
          )}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {cancelling ? "Đang hủy..." : "Hủy hóa đơn"}
            </button>
          )}
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <span className="font-medium">Ghi chú:</span> {invoice.notes}
        </div>
      )}

      {/* Line items */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Dịch vụ
        </h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Mô tả
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">
                  Răng số
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">
                  SL
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">
                  Đơn giá
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">
                  Thành tiền
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {invoice.lines.map((line, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{line.description}</td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {line.toothNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {line.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatVND(line.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatVND(line.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Tạm tính</span>
            <span>{formatVND(invoice.subTotal)}</span>
          </div>
          {invoice.discountValue > 0 && (
            <div className="flex justify-between text-green-600">
              <span>
                Chiết khấu
                {invoice.discountPercent > 0
                  ? ` (${invoice.discountPercent}%)`
                  : ""}
              </span>
              <span>- {formatVND(invoice.discountValue)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
            <span>Tổng cộng</span>
            <span>{formatVND(invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Đã thanh toán</span>
            <span className="text-green-600">{formatVND(invoice.paidAmount)}</span>
          </div>
          {invoice.outstandingAmount > 0 && (
            <div className="flex justify-between rounded-lg bg-orange-50 px-3 py-2 font-semibold text-orange-700">
              <span>Còn lại</span>
              <span>{formatVND(invoice.outstandingAmount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment history */}
      {invoice.payments.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Lịch sử thanh toán
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Ngày
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Phương thức
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    Số tiền
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Mã tham chiếu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {invoice.payments.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(p.paidAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {PAYMENT_METHOD_LABELS[
                        p.method as keyof typeof PAYMENT_METHOD_LABELS
                      ] ?? p.method}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatVND(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.reference ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <RecordPaymentModal
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          patientName={invoice.patientName}
          outstandingAmount={invoice.outstandingAmount}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
