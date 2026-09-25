"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function PatientGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isPatient = Boolean(
    user &&
      (user.roles?.includes("Patient") ||
        user.roles?.some((r) => r.toLowerCase() === "patient"))
  );

  useEffect(() => {
    if (!isLoading && !isPatient) {
      router.replace("/portal/login?error=unauthorized");
    }
  }, [isLoading, isPatient, router]);

  if (isLoading || !isPatient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50/60 via-white to-blue-50/50 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-sm rounded-3xl border border-cyan-100 bg-white/95 p-8 shadow-xl shadow-cyan-100/50 backdrop-blur-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600">
            <svg className="h-7 w-7 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-800">Đang mở Sổ Khám Bệnh Điện Tử...</h2>
          <p className="mt-1.5 text-xs text-slate-500">
            Hệ thống đang đồng bộ dữ liệu bệnh nhân và lịch hẹn nha khoa của bạn.
          </p>
          <div className="mt-5 flex justify-center">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-cyan-100">
              <div className="h-full w-full bg-cyan-500 origin-left animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
