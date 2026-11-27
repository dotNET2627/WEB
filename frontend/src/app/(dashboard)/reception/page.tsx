"use client";

import { useAuth } from "@/hooks/useAuth";
import { ReceptionView } from "@/features/reception/ReceptionView";

export default function ReceptionPage() {
  const { user } = useAuth();
  const clinicId = user?.activeClinicId;

  if (!clinicId) {
    return <p className="text-sm text-slate-600">Chọn phòng khám để xem lịch tiếp đón.</p>;
  }

  return <ReceptionView key={clinicId} clinicId={clinicId} />;
}
