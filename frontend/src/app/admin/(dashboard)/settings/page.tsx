"use client";

import React, { useState } from "react";

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [accessTokenExpiry, setAccessTokenExpiry] = useState("15");
  const [refreshTokenExpiry, setRefreshTokenExpiry] = useState("7");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Cấu hình Hệ thống Toàn diện</h1>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-950/70 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
              System Core
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Thiết lập chính sách an ninh bảo mật, cơ sở dữ liệu MongoDB và chu kỳ bảo trì hệ thống.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/80 px-4 py-2 text-xs font-semibold text-emerald-400 animate-in fade-in">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Đã lưu cấu hình thành công!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Security & JWT Policy */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Chính sách An ninh & JWT Refresh Token
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Tuân thủ chuẩn OWASP ASVS v4.0 với cơ chế xoay vòng Refresh Token (Token Rotation)
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Thời hạn Access Token (Phút)
              </label>
              <input
                type="number"
                value={accessTokenExpiry}
                onChange={(e) => setAccessTokenExpiry(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">Khuyến nghị: 15 phút để giảm thiểu rủi ro khi lộ token.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Thời hạn Refresh Token (Ngày)
              </label>
              <input
                type="number"
                value={refreshTokenExpiry}
                onChange={(e) => setRefreshTokenExpiry(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">Thời hạn token dài hạn lưu trong HttpOnly Cookie.</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Băm một chiều SHA-256 cho Refresh Token</span>
              <span className="text-emerald-400 font-semibold">Đã kích hoạt</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Tự động hủy toàn bộ Token khi phát hiện tái sử dụng (Reuse Detection)</span>
              <span className="text-emerald-400 font-semibold">Đã kích hoạt</span>
            </div>
          </div>
        </div>

        {/* Section 2: Database Connection */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7zm0 5c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3m-16-5c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3" />
              </svg>
              Cơ sở Dữ liệu Phân tán (MongoDB)
            </h2>
            <p className="text-xs text-slate-400 mt-1">Thông số kết nối cơ sở dữ liệu tập trung</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Chuỗi kết nối (Connection String)
            </label>
            <input
              type="text"
              readOnly
              value="mongodb://clinic_admin:••••••••••••@cluster0.mongodb.net/dental_management?replicaSet=rs0"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 font-mono text-xs text-slate-400 focus:outline-none select-all"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>Trạng thái kết nối: <strong className="text-emerald-400 font-semibold">Ổn định</strong></span>
            <span>Tự động sao lưu: <strong className="text-slate-200">03:00 AM mỗi ngày</strong></span>
          </div>
        </div>

        {/* Section 3: Maintenance Mode */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Chế độ Bảo trì Hệ thống (Maintenance Mode)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Khi kích hoạt, chỉ có tài khoản SuperAdmin mới được phép đăng nhập. Tất cả các chi nhánh sẽ nhận thông báo bảo trì.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-blue-500 active:scale-[0.98] cursor-pointer"
          >
            Lưu thay đổi cấu hình
          </button>
        </div>
      </form>
    </div>
  );
}
