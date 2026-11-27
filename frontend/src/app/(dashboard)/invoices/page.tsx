"use client";

import { useAuth } from "@/hooks/useAuth";
import { InvoiceListView } from "@/features/billing/InvoiceListView";

export default function InvoicesPage() {
  const { user } = useAuth();
  const clinicId = user?.activeClinicId;

  if (!clinicId) {
    return <p className="text-sm text-slate-600">Chọn phòng khám để xem hóa đơn.</p>;
  }

  return <InvoiceListView key={clinicId} clinicId={clinicId} />;
}
