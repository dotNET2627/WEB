"use client";

import { useAuth } from "@/hooks/useAuth";
import { InsuranceClaimListView } from "@/features/insurance/InsuranceClaimListView";

export default function InsurancePage() {
  const { user } = useAuth();
  const clinicId = user?.activeClinicId;

  if (!clinicId) {
    return <p className="text-sm text-slate-600">Chọn phòng khám để xem hồ sơ bảo hiểm.</p>;
  }

  return <InsuranceClaimListView key={clinicId} clinicId={clinicId} />;
}
