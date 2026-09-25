"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function PatientHeader() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout("/portal/login");
    } catch {
      setIsLoggingOut(false);
    }
  };

  const displayName = user?.fullName || "Bệnh nhân";
  const displayPhone = user?.phoneNumber || user?.email?.split("@")[0] || "";
  const displayCode = user?.patientCode || "BN-2026-8888";

  return (
    <header className="sticky top-0 z-30 border-b border-cyan-100 bg-white/90 px-4 py-3 shadow-xs backdrop-blur-md md:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        {/* Brand and Badge */}
        <Link href="/portal/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-800">
                Dental<span className="text-cyan-600">Care</span>
              </span>
              <span className="rounded-full bg-cyan-50 border border-cyan-200 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">
                Sổ Khám Bệnh
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Cổng Thông tin Y tế Bệnh nhân</p>
          </div>
        </Link>

        {/* Patient Profile & Logout */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden sm:block text-right">
            <div className="flex items-center justify-end gap-1.5">
              <p className="text-sm font-semibold text-slate-800">{displayName}</p>
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-mono font-medium text-emerald-700 border border-emerald-200">
                {displayCode}
              </span>
            </div>
            {displayPhone && (
              <p className="text-xs text-slate-400 font-mono">{displayPhone}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {isLoggingOut ? (
              <span>Đang thoát...</span>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Đăng xuất</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
