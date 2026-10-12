"use client";

import { useAuth } from "@/hooks/useAuth";
import { ReceptionView } from "@/features/reception/ReceptionView";

export default function ReceptionPage() {
  const { user } = useAuth();
  const clinicId =
    user?.activeClinicId ||
    user?.assignedClinicIds?.[0] ||
    "00000000-0000-0000-0000-000000000000";

  return <ReceptionView clinicId={clinicId} />;
}
