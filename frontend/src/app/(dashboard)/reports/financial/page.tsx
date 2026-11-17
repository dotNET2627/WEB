"use client";

import { useAuth } from "@/hooks/useAuth";
import { FinancialReportView } from "@/features/reports/FinancialReportView";

export default function FinancialReportPage() {
  const { user } = useAuth();
  const clinicId =
    user?.activeClinicId ||
    user?.assignedClinicIds?.[0] ||
    "00000000-0000-0000-0000-000000000000";

  return <FinancialReportView clinicId={clinicId} />;
}
