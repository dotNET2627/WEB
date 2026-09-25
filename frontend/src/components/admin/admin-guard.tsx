"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isSuperAdmin = Boolean(
    user &&
      (user.roles?.includes("SuperAdmin") ||
        user.roles?.some((r) => r.toLowerCase() === "superadmin"))
  );

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      router.replace("/admin/login?error=unauthorized");
    }
  }, [isLoading, isSuperAdmin, router]);

  // Hiển thị giao diện Skeleton Loading trong lúc kiểm tra phiên và phân quyền
  if (isLoading || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
            <svg className="h-7 w-7 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white">Đang xác thực quyền Quản trị...</h2>
          <p className="mt-2 text-sm text-slate-400">
            Hệ thống đang kiểm tra danh tính và vai trò SuperAdmin của tài khoản.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-full bg-indigo-500 origin-left animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
