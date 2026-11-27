"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { invoiceService } from "@/services/invoice-service";
import type { InvoiceStatus, InvoiceSummaryDto } from "@/types/invoice";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { CreateInvoiceModal } from "./CreateInvoiceModal";
import { formatDate, formatVND } from "@/lib/format";

interface InvoiceListViewProps {
  clinicId: string;
}

export function InvoiceListView({ clinicId }: InvoiceListViewProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<{
    id: string;
    invoiceNumber: string;
    patientName: string;
    outstandingAmount: number;
  } | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await invoiceService.list({
        clinicId,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setInvoices(data);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách hóa đơn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [clinicId, fromDate, toDate]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Filter client-side by search term and status
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        !searchTerm.trim() ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.patientName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalAmount = filteredInvoices.reduce((s, i) => s + i.totalAmount, 0);
    const paidAmount = filteredInvoices.reduce((s, i) => s + i.paidAmount, 0);
    const outstandingAmount = filteredInvoices.reduce(
      (s, i) => s + i.outstandingAmount,
      0
    );
    return {
      count: filteredInvoices.length,
      totalAmount,
      paidAmount,
      outstandingAmount,
    };
  }, [filteredInvoices]);

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hóa đơn & Thanh toán
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý hóa đơn dịch vụ, thanh toán và công nợ bệnh nhân
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <span>+</span> Tạo hóa đơn mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Tổng số hóa đơn
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.count}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Doanh thu
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatVND(stats.totalAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Đã thanh toán
          </p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {formatVND(stats.paidAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Chưa thanh toán / Nợ
          </p>
          <p className="mt-1 text-2xl font-bold text-orange-600">
            {formatVND(stats.outstandingAmount)}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Tìm theo mã HĐ hoặc tên bệnh nhân..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Unpaid">Chưa thanh toán</option>
              <option value="PartiallyPaid">Thanh toán một phần</option>
              <option value="Paid">Đã thanh toán</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              title="Từ ngày"
              className="w-1/2 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              title="Đến ngày"
              className="w-1/2 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Invoice Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Mã HĐ
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Bệnh nhân
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Ngày lập
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                Tổng tiền
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                Đã thu
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                Còn lại
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <p className="mt-2 text-sm">Đang tải danh sách hóa đơn...</p>
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Không tìm thấy hóa đơn nào
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-blue-600">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-gray-900 font-medium">
                    {inv.patientName}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">
                    {formatDate(inv.issuedAt)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                    {formatVND(inv.totalAmount)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-green-600 font-medium">
                    {formatVND(inv.paidAmount)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium">
                    {inv.outstandingAmount > 0 ? (
                      <span className="text-orange-600">
                        {formatVND(inv.outstandingAmount)}
                      </span>
                    ) : (
                      <span className="text-gray-400">0 ₫</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(inv.status === "Unpaid" ||
                        inv.status === "PartiallyPaid") && (
                        <button
                          onClick={() =>
                            setPaymentTarget({
                              id: inv.id,
                              invoiceNumber: inv.invoiceNumber,
                              patientName: inv.patientName,
                              outstandingAmount: inv.outstandingAmount,
                            })
                          }
                          className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          💳 Thu tiền
                        </button>
                      )}
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          clinicId={clinicId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newId) => {
            setShowCreateModal(false);
            fetchInvoices();
            router.push(`/invoices/${newId}`);
          }}
        />
      )}

      {/* Record Payment Modal */}
      {paymentTarget && (
        <RecordPaymentModal
          invoiceId={paymentTarget.id}
          invoiceNumber={paymentTarget.invoiceNumber}
          patientName={paymentTarget.patientName}
          outstandingAmount={paymentTarget.outstandingAmount}
          onClose={() => setPaymentTarget(null)}
          onSuccess={() => {
            setPaymentTarget(null);
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
}
