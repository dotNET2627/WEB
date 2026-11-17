"use client";

import { useAuth } from "@/hooks/useAuth";
import { InsuranceClaimListView } from "@/features/insurance/InsuranceClaimListView";

export default function InsurancePage() {
  const { user } = useAuth();
  const clinicId =
    user?.activeClinicId ||
    user?.assignedClinicIds?.[0] ||
    "00000000-0000-0000-0000-000000000000";

  return <InsuranceClaimListView clinicId={clinicId} />;
}
