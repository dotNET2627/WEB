"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

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

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-white px-4 md:px-6">
      <div>
        <p className="text-sm font-medium">Phòng khám nha khoa</p>
        <p className="text-xs text-[var(--muted)]">
          {user?.fullName ? `${user.fullName} (${user.email})` : "Workspace mặc định"}
        </p>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
      >
        {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
      </button>
    </header>
  );
}

