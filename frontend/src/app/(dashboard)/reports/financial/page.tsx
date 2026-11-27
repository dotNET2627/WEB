"use client";

import { useAuth } from "@/hooks/useAuth";
import { FinancialReportView } from "@/features/reports/FinancialReportView";

export default function FinancialReportPage() {
  const { user } = useAuth();
  const clinicId = user?.activeClinicId;

  if (!clinicId) {
    return <p className="text-sm text-slate-600">Chọn phòng khám để xem báo cáo tài chính.</p>;
  }

  return <FinancialReportView key={clinicId} clinicId={clinicId} />;
}
