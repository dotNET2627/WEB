"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { reportService } from "@/services/report-service";
import type { FinancialReportDto } from "@/types/report";
import { InvoiceStatusBadge } from "@/features/billing/InvoiceStatusBadge";
import { formatDateTime, formatDate, formatVND } from "@/lib/format";

interface FinancialReportViewProps {
  clinicId: string;
}

type QuickDateFilter = "today" | "yesterday" | "last7days" | "thisMonth" | "custom";

export function FinancialReportView({ clinicId }: FinancialReportViewProps) {
  const [data, setData] = useState<FinancialReportDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date selection
  const [dateFilter, setDateFilter] = useState<QuickDateFilter>("today");
  const [fromDate, setFromDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Active Tab: transactions | invoices | debtors
  const [activeTab, setActiveTab] = useState<"transactions" | "invoices" | "debtors">("transactions");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");

  const setQuickRange = (range: QuickDateFilter) => {
    setDateFilter(range);
    const now = new Date();
    if (range === "today") {
      const todayStr = now.toISOString().split("T")[0];
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (range === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const str = yesterday.toISOString().split("T")[0];
      setFromDate(str);
      setToDate(str);
    } else if (range === "last7days") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      setFromDate(sevenDaysAgo.toISOString().split("T")[0]);
      setToDate(now.toISOString().split("T")[0]);
    } else if (range === "thisMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(firstDay.toISOString().split("T")[0]);
      setToDate(now.toISOString().split("T")[0]);
    }
  };

  const fetchReport = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    setError(null);

    // Convert fromDate (00:00:00) and toDate (23:59:59) to ISO
    const fromIso = `${fromDate}T00:00:00.000Z`;
    const toIso = `${toDate}T23:59:59.999Z`;

    try {
      const res = await reportService.getFinancialReport({
        clinicId,
        from: fromIso,
        to: toIso,
      });
      setData(res);
    } catch (err) {
      console.error(err);
      setError("Không thể tải báo cáo tài chính. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setLoading(false);
    }
  }, [clinicId, fromDate, toDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Filter transactions by payment method
  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    if (methodFilter === "ALL") return data.transactions;
    return data.transactions.filter(
      (t) => t.method.toLowerCase() === methodFilter.toLowerCase()
    );
  }, [data, methodFilter]);

  // Method ratios for visual bar
  const methodPercentages = useMemo(() => {
    if (!data || data.totalCollected === 0) return { cash: 0, transfer: 0, card: 0, insurance: 0 };
    return {
      cash: Math.round((data.cashCollected / data.totalCollected) * 100),
      transfer: Math.round((data.transferCollected / data.totalCollected) * 100),
      card: Math.round((data.cardCollected / data.totalCollected) * 100),
      insurance: Math.round((data.insuranceCollected / data.totalCollected) * 100),
    };
  }, [data]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Báo cáo tài chính & Sổ quỹ cuối ngày
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tổng hợp doanh thu thực thu, tiền mặt vs chuyển khoản VietQR, công nợ bệnh nhân chưa thu
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition-colors print:hidden"
        >
          <span>🖨️</span> In / Xuất báo cáo chốt ca
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "today", label: "Hôm nay" },
              { id: "yesterday", label: "Hôm qua" },
              { id: "last7days", label: "7 ngày qua" },
              { id: "thisMonth", label: "Tháng này" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setQuickRange(p.id as QuickDateFilter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  dateFilter === p.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date inputs */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setDateFilter("custom");
                setFromDate(e.target.value);
              }}
              className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-gray-400 font-medium">Đến:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setDateFilter("custom");
                setToDate(e.target.value);
              }}
              className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="mt-2 text-sm font-medium">Đang tổng hợp dữ liệu tài chính...</p>
        </div>
      ) : error || !data ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {error || "Không có dữ liệu"}
        </div>
      ) : (
        <>
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* 1. Total Revenue Collected */}
            <div className="rounded-2xl border border-blue-200 bg-linear-to-br from-blue-700 to-indigo-800 p-4 text-white shadow-md xl:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                  Tổng thực thu trong kỳ
                </span>
                <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-bold">
                  {data.totalTransactionsCount} giao dịch
                </span>
              </div>
              <p className="mt-2 text-3xl font-black tracking-tight">
                {formatVND(data.totalCollected)}
              </p>
              <p className="mt-1 text-xs text-blue-100/90">
                Thực tế đã nhận vào sổ quỹ phòng khám
              </p>
            </div>

            {/* 2. Cash on Hand */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                💵 Tiền mặt tại két
              </span>
              <p className="mt-2 text-xl font-black text-emerald-700">
                {formatVND(data.cashCollected)}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium">
                {methodPercentages.cash}% tổng thực thu
              </span>
            </div>

            {/* 3. VietQR / Bank Transfer */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                📲 Chuyển khoản VietQR
              </span>
              <p className="mt-2 text-xl font-black text-blue-700">
                {formatVND(data.transferCollected)}
              </p>
              <span className="text-[11px] text-blue-600 font-medium">
                {methodPercentages.transfer}% tổng thực thu
              </span>
            </div>

            {/* 4. Card POS */}
            <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
                💳 Quẹt thẻ POS
              </span>
              <p className="mt-2 text-xl font-black text-purple-700">
                {formatVND(data.cardCollected)}
              </p>
              <span className="text-[11px] text-purple-600 font-medium">
                {methodPercentages.card}% tổng thực thu
              </span>
            </div>

            {/* 5. Outstanding Debt */}
            <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-800">
                  ⚠️ Công nợ chưa thu
                </span>
                <span className="rounded bg-orange-200 px-1.5 py-0.5 text-[10px] font-bold text-orange-900">
                  {data.debtorsCount} BN nợ
                </span>
              </div>
              <p className="mt-2 text-xl font-black text-orange-700">
                {formatVND(data.totalOutstandingDebt)}
              </p>
              <span className="text-[11px] text-orange-600 font-medium">
                Chưa thanh toán hết
              </span>
            </div>
          </div>

          {/* Visual Payment Breakdown & Invoicing Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Visual ratio bar */}
            <div className="lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  Cơ cấu phương thức thanh toán
                </h3>
                <span className="text-xs text-gray-400">
                  {formatDate(fromDate)} – {formatDate(toDate)}
                </span>
              </div>

              {/* Stacked Progress Bar */}
              <div className="h-5 w-full rounded-full bg-gray-100 overflow-hidden flex shadow-inner">
                {data.totalCollected > 0 ? (
                  <>
                    <div
                      style={{ width: `${methodPercentages.cash}%` }}
                      className="bg-emerald-500 transition-all"
                      title={`Tiền mặt: ${formatVND(data.cashCollected)} (${methodPercentages.cash}%)`}
                    />
                    <div
                      style={{ width: `${methodPercentages.transfer}%` }}
                      className="bg-blue-600 transition-all"
                      title={`Chuyển khoản: ${formatVND(data.transferCollected)} (${methodPercentages.transfer}%)`}
                    />
                    <div
                      style={{ width: `${methodPercentages.card}%` }}
                      className="bg-purple-600 transition-all"
                      title={`Quẹt thẻ: ${formatVND(data.cardCollected)} (${methodPercentages.card}%)`}
                    />
                    <div
                      style={{ width: `${methodPercentages.insurance}%` }}
                      className="bg-teal-500 transition-all"
                      title={`Bảo hiểm: ${formatVND(data.insuranceCollected)} (${methodPercentages.insurance}%)`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-gray-200" />
                )}
              </div>

              {/* Legend with exact amounts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <span className="text-gray-500 block">Tiền mặt</span>
                    <span className="font-bold text-gray-900">{formatVND(data.cashCollected)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-600 shrink-0" />
                  <div>
                    <span className="text-gray-500 block">VietQR</span>
                    <span className="font-bold text-gray-900">{formatVND(data.transferCollected)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-purple-600 shrink-0" />
                  <div>
                    <span className="text-gray-500 block">Thẻ POS</span>
                    <span className="font-bold text-gray-900">{formatVND(data.cardCollected)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-teal-500 shrink-0" />
                  <div>
                    <span className="text-gray-500 block">Bảo hiểm</span>
                    <span className="font-bold text-gray-900">{formatVND(data.insuranceCollected)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoicing summary box */}
            <div className="lg:col-span-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                Hóa đơn xuất trong kỳ ({data.invoicesCount})
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Tổng giá trị hóa đơn xuất:</span>
                  <span className="font-bold text-gray-900">{formatVND(data.totalInvoiced)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 text-emerald-700">
                  <span>Đã thanh toán đủ (100%):</span>
                  <span className="font-semibold">{data.paidInFullCount} HĐ</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 text-orange-700">
                  <span>Thanh toán một phần:</span>
                  <span className="font-semibold">{data.partiallyPaidCount} HĐ</span>
                </div>
                <div className="flex justify-between py-1 text-gray-500">
                  <span>Chưa thanh toán:</span>
                  <span className="font-semibold">{data.unpaidCount} HĐ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Tabs */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
            {/* Tab navigation */}
            <div className="flex border-b border-gray-100 bg-gray-50/80 px-4 pt-3 gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("transactions")}
                className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
                  activeTab === "transactions"
                    ? "border-blue-600 bg-white text-blue-700 shadow-xs"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/70"
                }`}
              >
                <span>📖 Sổ quỹ thu tiền chi tiết</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-800">
                  {data.transactions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("invoices")}
                className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
                  activeTab === "invoices"
                    ? "border-blue-600 bg-white text-blue-700 shadow-xs"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/70"
                }`}
              >
                <span>🧾 Hóa đơn xuất trong kỳ</span>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-700">
                  {data.invoices.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("debtors")}
                className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
                  activeTab === "debtors"
                    ? "border-orange-600 bg-white text-orange-700 shadow-xs"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/70"
                }`}
              >
                <span>👥 Báo cáo công nợ bệnh nhân</span>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] text-orange-800">
                  {data.debtors.length}
                </span>
              </button>
            </div>

            {/* TAB 1: Sổ quỹ chi tiết (Transactions Log) */}
            {activeTab === "transactions" && (
              <div className="p-4 space-y-3">
                {/* Method filter chips */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">Lọc theo:</span>
                  {["ALL", "Cash", "Transfer", "Card", "Insurance"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethodFilter(m)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                        methodFilter === m
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {m === "ALL"
                        ? "Tất cả"
                        : m === "Cash"
                        ? "Tiền mặt"
                        : m === "Transfer"
                        ? "VietQR"
                        : m === "Card"
                        ? "Thẻ POS"
                        : "Bảo hiểm"}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Thời gian</th>
                        <th className="px-4 py-3 text-left">Mã HĐ</th>
                        <th className="px-4 py-3 text-left">Bệnh nhân</th>
                        <th className="px-4 py-3 text-center">Phương thức</th>
                        <th className="px-4 py-3 text-right">Số tiền thu</th>
                        <th className="px-4 py-3 text-left">Mã tham chiếu / Giao dịch</th>
                        <th className="px-4 py-3 text-left">Ghi chú đợt thu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-400">
                            Không có giao dịch thu tiền nào trong khoảng thời gian này
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {formatDateTime(tx.paidAt)}
                            </td>
                            <td className="px-4 py-3 font-semibold text-blue-600">
                              <Link href={`/invoices/${tx.invoiceId}`} className="hover:underline">
                                {tx.invoiceNumber}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-gray-900 font-medium">
                              {tx.patientName}
                              {tx.patientCode && (
                                <span className="ml-1 text-xs text-gray-400 font-mono">
                                  ({tx.patientCode})
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                                  tx.method.toLowerCase() === "cash"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : tx.method.toLowerCase() === "transfer"
                                    ? "bg-blue-100 text-blue-800"
                                    : tx.method.toLowerCase() === "card"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-teal-100 text-teal-800"
                                }`}
                              >
                                {tx.method.toLowerCase() === "cash"
                                  ? "💵 Tiền mặt"
                                  : tx.method.toLowerCase() === "transfer"
                                  ? "📲 VietQR"
                                  : tx.method.toLowerCase() === "card"
                                  ? "💳 Thẻ POS"
                                  : "🏥 Bảo hiểm"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-gray-900">
                              {formatVND(tx.amount)}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                              {tx.reference || "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {tx.note || "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Hóa đơn phát sinh trong kỳ */}
            {activeTab === "invoices" && (
              <div className="p-4">
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Mã HĐ</th>
                        <th className="px-4 py-3 text-left">Bệnh nhân</th>
                        <th className="px-4 py-3 text-left">Ngày giờ lập</th>
                        <th className="px-4 py-3 text-right">Tổng tiền</th>
                        <th className="px-4 py-3 text-right">Đã thanh toán</th>
                        <th className="px-4 py-3 text-right">Còn nợ</th>
                        <th className="px-4 py-3 text-center">Trạng thái</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.invoices.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-400">
                            Không có hóa đơn nào lập trong khoảng thời gian này
                          </td>
                        </tr>
                      ) : (
                        data.invoices.map((inv) => (
                          <tr key={inv.invoiceId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-blue-600">
                              <Link href={`/invoices/${inv.invoiceId}`} className="hover:underline">
                                {inv.invoiceNumber}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-gray-900 font-medium">
                              {inv.patientName}
                              {inv.patientCode && (
                                <span className="ml-1 text-xs text-gray-400 font-mono">
                                  ({inv.patientCode})
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {formatDateTime(inv.issuedAt)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                              {formatVND(inv.totalAmount)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                              {formatVND(inv.paidAmount)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {inv.outstandingAmount > 0 ? (
                                <span className="text-orange-600">{formatVND(inv.outstandingAmount)}</span>
                              ) : (
                                <span className="text-gray-400 font-normal">0 ₫</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <InvoiceStatusBadge status={inv.status as any} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                href={`/invoices/${inv.invoiceId}`}
                                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                              >
                                Xem
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: Báo cáo công nợ bệnh nhân */}
            {activeTab === "debtors" && (
              <div className="p-4 space-y-3">
                <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-3 flex justify-between items-center text-xs text-orange-900">
                  <span>
                    ⚠️ Danh sách bệnh nhân đang có công nợ chưa hoàn tất tại phòng khám ({data.debtors.length} bệnh nhân)
                  </span>
                  <span className="font-bold text-sm">
                    Tổng nợ: {formatVND(data.totalOutstandingDebt)}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Bệnh nhân</th>
                        <th className="px-4 py-3 text-left">Số điện thoại</th>
                        <th className="px-4 py-3 text-center">Số HĐ còn nợ</th>
                        <th className="px-4 py-3 text-right">Tổng tiền nợ</th>
                        <th className="px-4 py-3 text-left">Lần khám gần nhất</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.debtors.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400">
                            Không có bệnh nhân nào còn công nợ 🎉
                          </td>
                        </tr>
                      ) : (
                        data.debtors.map((d) => (
                          <tr key={d.patientId} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className="font-bold text-gray-900 block">{d.patientName}</span>
                              {d.patientCode && (
                                <span className="text-xs text-gray-400 font-mono">{d.patientCode}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                              {d.phoneNumber || "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800">
                                {d.unpaidInvoicesCount} HĐ
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-orange-700">
                              {formatVND(d.totalDebt)}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {formatDate(d.lastIssuedAt)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                href={`/invoices?patientId=${d.patientId}`}
                                className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100"
                              >
                                Xem hóa đơn nợ →
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
