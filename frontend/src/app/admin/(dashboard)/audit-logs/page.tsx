"use client";

import React, { useState } from "react";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  ip: string;
  severity: "info" | "warning" | "critical";
  status: "success" | "failure";
}

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: "log-1",
    timestamp: "24/09/2026 14:02:18",
    actor: "admin@clinic.vn",
    role: "SuperAdmin",
    action: "AUTH_LOGIN_SUCCESS",
    target: "Cổng Quản trị SuperAdmin Portal",
    ip: "14.238.12.85 (Hồ Chí Minh)",
    severity: "info",
    status: "success",
  },
  {
    id: "log-2",
    timestamp: "24/09/2026 13:58:45",
    actor: "le.tan@clinic.vn",
    role: "Receptionist",
    action: "AUTH_LOGIN_FAILED",
    target: "Cổng Clinic Portal - Sai mật khẩu lần 3",
    ip: "118.69.182.14 (Hà Nội)",
    severity: "warning",
    status: "failure",
  },
  {
    id: "log-3",
    timestamp: "24/09/2026 13:30:10",
    actor: "admin@clinic.vn",
    role: "SuperAdmin",
    action: "TOKEN_REVOKE_MANUAL",
    target: "Thu hồi Refresh Token của user duc.pham@clinic.vn",
    ip: "14.238.12.85 (Hồ Chí Minh)",
    severity: "critical",
    status: "success",
  },
  {
    id: "log-4",
    timestamp: "24/09/2026 12:45:00",
    actor: "toan.nguyen@clinic.vn",
    role: "Doctor",
    action: "CLINIC_SWITCH_CONTEXT",
    target: "Chuyển làm việc sang Chi nhánh Cầu Giấy (CLI-HAN-01)",
    ip: "115.79.20.104 (Hà Nội)",
    severity: "info",
    status: "success",
  },
  {
    id: "log-5",
    timestamp: "24/09/2026 11:15:22",
    actor: "System Scheduler",
    role: "SystemDaemon",
    action: "BACKUP_SNAPSHOT_CREATED",
    target: "MongoDB Primary Database /dental_management",
    ip: "127.0.0.1 (Localhost)",
    severity: "info",
    status: "success",
  },
  {
    id: "log-6",
    timestamp: "24/09/2026 09:20:11",
    actor: "minh.tran@clinic.vn",
    role: "Doctor",
    action: "EXPORT_PATIENT_RECORDS",
    target: "Xuất dữ liệu 50 hồ sơ bệnh án sang định dạng mã hóa",
    ip: "14.161.45.22 (Hà Nội)",
    severity: "warning",
    status: "success",
  },
];

export default function AdminAuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || log.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Nhật ký Kiểm toán & Bảo mật</h1>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-950/70 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
              Audit Logs
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Truy vết mọi hành vi và sự kiện an ninh bất biến (Immutable Audit Stream).
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("Xuất file báo cáo kiểm toán CSV/JSON")}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white active:scale-[0.98] cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Xuất dữ liệu kiểm toán</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo người thực hiện, loại hành động, IP nguồn hoặc mục tiêu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="info">Thông tin (Info)</option>
            <option value="warning">Cảnh báo (Warning)</option>
            <option value="critical">Nghiêm trọng (Critical)</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Người thực hiện</th>
                <th className="px-6 py-4">Mã hành động</th>
                <th className="px-6 py-4">Mục tiêu tác động</th>
                <th className="px-6 py-4">Địa chỉ IP nguồn</th>
                <th className="px-6 py-4">Mức độ</th>
                <th className="px-6 py-4 text-right">Kết quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="transition hover:bg-slate-800/40">
                  <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-6 py-4 font-sans">
                    <p className="font-semibold text-white">{log.actor}</p>
                    <span className="text-[10px] text-indigo-400 font-mono">[{log.role}]</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-slate-800 px-2 py-1 text-slate-200 font-semibold border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-sans text-slate-300 max-w-xs truncate">{log.target}</td>
                  <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{log.ip}</td>
                  <td className="px-6 py-4 font-sans">
                    {log.severity === "critical" && (
                      <span className="inline-flex rounded-full border border-red-500/40 bg-red-950/60 px-2 py-0.5 text-[11px] font-semibold text-red-400">
                        Critical
                      </span>
                    )}
                    {log.severity === "warning" && (
                      <span className="inline-flex rounded-full border border-amber-500/40 bg-amber-950/60 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                        Warning
                      </span>
                    )}
                    {log.severity === "info" && (
                      <span className="inline-flex rounded-full border border-blue-500/40 bg-blue-950/60 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
                        Info
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-sans">
                    {log.status === "success" ? (
                      <span className="text-emerald-400 font-medium">Thành công</span>
                    ) : (
                      <span className="text-red-400 font-medium">Thất bại</span>
                    )}
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
