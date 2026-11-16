"use client";

import { useAuth } from "@/hooks/useAuth";
import { InvoiceListView } from "@/features/billing/InvoiceListView";

export default function InvoicesPage() {
  const { user } = useAuth();
  const clinicId =
    user?.activeClinicId ||
    user?.assignedClinicIds?.[0] ||
    "00000000-0000-0000-0000-000000000000";

  return <InvoiceListView clinicId={clinicId} />;
}
