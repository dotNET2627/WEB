import React from "react";
import { PatientGuard } from "@/components/portal/patient-guard";
import { PatientShell } from "@/components/portal/patient-shell";

export default function PatientDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PatientGuard>
      <PatientShell>{children}</PatientShell>
    </PatientGuard>
  );
}
