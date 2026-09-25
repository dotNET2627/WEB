"use client";

import React from "react";
import { PatientHeader } from "./patient-header";

export function PatientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans">
      <PatientHeader />
      <main className="flex-1 py-6 px-4 md:px-6">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      {/* Patient Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-4 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>&copy; {new Date().getFullYear()} DentalCare Clinic System - Sổ Khám Bệnh Điện Tử</p>
          <p className="flex items-center gap-1.5 text-cyan-700 font-medium">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Tổng đài Hỗ trợ Bệnh nhân: <span className="font-bold font-mono">1900 6868</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
