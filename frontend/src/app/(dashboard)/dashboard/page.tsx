"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  DollarSign,
  Package,
  ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

// Dữ liệu doanh thu 7 ngày gần nhất
const REVENUE_WEEK_DATA = [
  { day: "Thứ 2", revenue: 18500000, appointments: 24 },
  { day: "Thứ 3", revenue: 22000000, appointments: 28 },
  { day: "Thứ 4", revenue: 16800000, appointments: 21 },
  { day: "Thứ 5", revenue: 29400000, appointments: 35 },
  { day: "Thứ 6", revenue: 34200000, appointments: 40 },
  { day: "Thứ 7", revenue: 42500000, appointments: 48 },
  { day: "Chủ nhật", revenue: 26000000, appointments: 30 }
];

// Dữ liệu phân bố trạng thái lịch hẹn 6 tháng gần nhất
const APPOINTMENT_STATUS_DATA = [
  { month: "T5/26", completed: 520, cancelled: 42, noShow: 18 },
  { month: "T6/26", completed: 580, cancelled: 38, noShow: 15 },
  { month: "T7/26", completed: 640, cancelled: 45, noShow: 20 },
  { month: "T8/26", completed: 710, cancelled: 50, noShow: 19 },
  { month: "T9/26", completed: 790, cancelled: 48, noShow: 22 },
  { month: "T10/26", completed: 860, cancelled: 36, noShow: 14 }
];

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(amount);
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");

  return (
    <div className="space-y-6">
      {/* 1. Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-[var(--text-h1)] font-semibold text-[var(--color-text)] tracking-tight">
            Tổng quan Hoạt động Chi nhánh
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-muted)] mt-1">
            Theo dõi tiến độ khám chữa bệnh, lịch hẹn và doanh thu vận hành trong ngày.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/doctor/workspace"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
          >
            <span>Vào Bàn khám Bác sĩ</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 2. Hàng 4 thẻ số liệu hành động (Bấm được và dẫn tới danh sách đã lọc theo ADMIN_UI_RULES.md) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/appointments"
          className="p-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-blue-400 transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-xs)] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Lịch hẹn hôm nay
            </span>
            <div className="w-8 h-8 rounded bg-[var(--status-info-bg)] flex items-center justify-center text-[var(--status-info-fg)]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-[var(--color-text)] tabular-nums">48</p>
            <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] mt-0.5">
              12 ca chờ khám • 4 đang khám
            </p>
          </div>
        </Link>

        <Link
          href="/patients"
          className="p-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-blue-400 transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-xs)] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Bệnh nhân mới tuần này
            </span>
            <div className="w-8 h-8 rounded bg-[var(--status-success-bg)] flex items-center justify-center text-[var(--status-success-fg)]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-[var(--color-text)] tabular-nums">34</p>
            <p className="text-[var(--text-xs)] text-[var(--status-success-fg)] font-medium mt-0.5">
              Tăng 15% so với tuần trước
            </p>
          </div>
        </Link>

        <Link
          href="/invoices"
          className="p-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-blue-400 transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-xs)] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Doanh thu thực thu hôm nay
            </span>
            <div className="w-8 h-8 rounded bg-[var(--status-info-bg)] flex items-center justify-center text-[var(--status-info-fg)]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-[var(--color-text)] tabular-nums">42.500.000 ₫</p>
            <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] mt-0.5">
              Đã thu qua Tiền mặt & QR
            </p>
          </div>
        </Link>

        <Link
          href="/inventory"
          className="p-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-amber-400 transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-xs)] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Vật tư sắp hết mức an toàn
            </span>
            <div className="w-8 h-8 rounded bg-[var(--status-warning-bg)] flex items-center justify-center text-[var(--status-warning-fg)]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-[var(--status-warning-fg)] tabular-nums">3 mặt hàng</p>
            <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] mt-0.5">
              Thuốc tê Lidocaine, Kim tiêm
            </p>
          </div>
        </Link>
      </div>

      {/* 3. Phần Biểu đồ trực quan Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ Doanh thu */}
        <div className="p-5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-4">
            <div>
              <h2 className="text-[var(--text-table)] font-semibold text-[var(--color-text)]">
                Doanh thu và Số ca khám theo ngày
              </h2>
              <p className="text-[var(--text-xs)] text-[var(--color-text-muted)]">
                Thống kê 7 ngày gần nhất của chi nhánh
              </p>
            </div>
            <div className="flex items-center gap-1 bg-[var(--color-bg)] p-1 rounded border border-[var(--color-border)] text-[var(--text-xs)]">
              <button
                type="button"
                onClick={() => setTimeRange("week")}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  timeRange === "week" ? "bg-[var(--color-surface)] font-semibold shadow-xs" : "text-slate-600"
                }`}
              >
                7 Ngày
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("month")}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  timeRange === "month" ? "bg-[var(--color-surface)] font-semibold shadow-xs" : "text-slate-600"
                }`}
              >
                Tháng này
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_WEEK_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} />
                <YAxis
                  tickFormatter={(val) => `${val / 1_000_000}tr`}
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val: unknown) => [formatVND(Number(val)), "Doanh thu"]}
                  contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: 8, borderColor: "#CBD5E1", fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                <Bar dataKey="revenue" name="Doanh thu (VNĐ)" fill="#0E6B6B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ Trạng thái Lịch hẹn & Tỷ lệ hủy */}
        <div className="p-5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-4">
            <div>
              <h2 className="text-[var(--text-table)] font-semibold text-[var(--color-text)]">
                Xu hướng Lịch hẹn & Tỷ lệ Hủy lịch
              </h2>
              <p className="text-[var(--text-xs)] text-[var(--color-text-muted)]">
                So sánh số ca hoàn thành vs số ca hủy hẹn qua các tháng
              </p>
            </div>
            <span className="text-[var(--text-xs)] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              Tỷ lệ hủy: 4.1% (Tốt)
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={APPOINTMENT_STATUS_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: 8, borderColor: "#CBD5E1", fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Hoàn thành (ca)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="cancelled"
                  name="Đã hủy (ca)"
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Bảng số liệu thay thế (Accessible Data Table per WCAG 2.2 AA) */}
      <div className="p-5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <h2 className="text-[var(--text-table)] font-semibold text-[var(--color-text)] mb-3">
          Bảng số liệu chi tiết 7 ngày vừa qua
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[var(--text-sm)]">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--text-xs)] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider bg-[var(--color-bg)]">
                <th className="py-2.5 px-4">Ngày</th>
                <th className="py-2.5 px-4 text-right">Số ca khám</th>
                <th className="py-2.5 px-4 text-right">Doanh thu</th>
                <th className="py-2.5 px-4 text-center">Trạng thái vận hành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {REVENUE_WEEK_DATA.map((row) => (
                <tr key={row.day} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-4 font-medium text-[var(--color-text)]">{row.day}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{row.appointments} ca</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-emerald-800">
                    {formatVND(row.revenue)}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                      Bình thường
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
