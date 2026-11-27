"use client";

import { useAuth } from "@/hooks/useAuth";
import { CashierShiftView } from "@/features/billing/shifts/CashierShiftView";

export default function CashierShiftsPage() {
  const { user } = useAuth();
  const clinicId = user?.activeClinicId;
  if (!user || !clinicId) {
    return <p className="text-sm text-slate-600">Chọn phòng khám để quản lý ca thu ngân.</p>;
  }

  const cashierId = user.id;
  const cashierName = user.fullName || "Thu ngân";

  return (
    <CashierShiftView
      key={clinicId}
      clinicId={clinicId}
      cashierId={cashierId}
      cashierName={cashierName}
    />
  );
}
