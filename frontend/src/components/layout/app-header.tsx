"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ClinicSwitcher } from "@/components/layout/clinic-switcher";
import { LogOut, Shield } from "lucide-react";

export function AppHeader() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout("/login");
    } catch {
      setIsLoggingOut(false);
    }
  };

  const isSuperAdmin = Boolean(
    user?.roles?.some((r) => r.toLowerCase() === "superadmin")
  );
  const isClinicAdmin = Boolean(
    user?.roles?.some((r) => r.toLowerCase() === "clinicadmin" || r.toLowerCase() === "branchadmin" || r.toLowerCase() === "manager")
  );

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 md:px-6">
      {/* Trái: Clinic Switcher (Phân quyền: SuperAdmin đổi được, Clinic Admin cố định 1 chi nhánh) */}
      <div className="flex items-center gap-4">
        <ClinicSwitcher />
      </div>

      {/* Phải: Thông tin người dùng, Badge phân quyền & Nút Đăng xuất */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden sm:flex flex-col text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="text-[var(--text-table)] font-semibold text-[var(--color-text)]">
              {user?.fullName || "Nhân viên phòng khám"}
            </span>
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[var(--text-xs)] font-semibold bg-[var(--status-info-bg)] text-[var(--status-info-fg)]">
                <Shield className="w-3 h-3" />
                <span>SuperAdmin</span>
              </span>
            )}
            {isClinicAdmin && !isSuperAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[var(--text-xs)] font-semibold bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]">
                <span>Quản lý Cơ sở</span>
              </span>
            )}
          </div>
          <span className="text-[var(--text-xs)] text-[var(--color-text-muted)]">
            {user?.email || "staff@clinic.vn"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-1.5 text-[var(--text-sm)] font-medium text-[var(--color-text)] transition hover:bg-[var(--color-bg)] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          title="Đăng xuất khỏi hệ thống"
        >
          <LogOut className="w-4 h-4 text-[var(--color-text-muted)]" />
          <span className="hidden md:inline">{isLoggingOut ? "Đang thoát..." : "Đăng xuất"}</span>
        </button>
      </div>
    </header>
  );
}
