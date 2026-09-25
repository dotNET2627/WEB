"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AdminHeaderProps {
  onOpenMobile?: () => void;
}

export function AdminHeader({ onOpenMobile }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout("/admin/login");
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 md:px-6 backdrop-blur-md">
      {/* Left Area: Mobile Menu Trigger + Breadcrumb */}
      <div className="flex items-center gap-3">
        {onOpenMobile && (
          <button
            type="button"
            onClick={onOpenMobile}
            className="lg:hidden rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
            aria-label="Mở danh mục quản trị"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="hidden sm:block">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Root Admin</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Control Central</span>
          </div>
        </div>
      </div>

      {/* Right Area: User Info + SuperAdmin Badge + Logout Button */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* User Profile Summary */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-white">
              {user?.fullName || "Quản trị viên Cấp cao"}
            </p>
            <p className="text-xs text-slate-400">{user?.email || "admin@clinic.vn"}</p>
          </div>

          {/* SuperAdmin Role Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-950/80 px-3 py-1 text-xs font-semibold text-indigo-300 shadow-sm">
            <svg className="h-3.5 w-3.5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
                clipRule="evenodd"
              />
            </svg>
            SuperAdmin
          </span>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-red-500/50 hover:bg-red-950/30 hover:text-red-300 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          {isLoggingOut ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin text-slate-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Đang thoát...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Đăng xuất</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
