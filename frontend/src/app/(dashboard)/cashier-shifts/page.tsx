"use client";

import { useAuth } from "@/hooks/useAuth";
import { CashierShiftView } from "@/features/billing/shifts/CashierShiftView";

export default function CashierShiftsPage() {
  const { user } = useAuth();
  const clinicId =
    user?.activeClinicId ||
    user?.assignedClinicIds?.[0] ||
    "00000000-0000-0000-0000-000000000000";

  const cashierId = user?.id || "00000000-0000-0000-0000-000000000000";
  const cashierName = user?.fullName || "Thu ngân";

  return (
    <CashierShiftView
      clinicId={clinicId}
      cashierId={cashierId}
      cashierName={cashierName}
    />
  );
}
