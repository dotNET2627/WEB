"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Plus, Clock, User } from "lucide-react";
import { StatusTag } from "@/components/ui/status-tag";
import type { PatientAppointmentRecord } from "@/types/patient";

interface PatientAppointmentsTabProps {
  patientId: string;
  patientName: string;
}

export function PatientAppointmentsTab({
  patientId,
  patientName
}: PatientAppointmentsTabProps) {
  // Demo clinical records for the patient
  const [appointments] = useState<PatientAppointmentRecord[]>([
    {
      id: "apt-1",
      appointmentDate: "16/10/2026 09:30",
      doctorName: "BS. CKI Trần Minh Đức",
      serviceName: "Khám tổng quát & Điều trị tủy răng 16",
      status: "in_progress",
      diagnosisNotes: "Đặt Ca(OH)2 băng thuốc ống tủy lần 1, hẹn tái khám sau 7 ngày"
    },
    {
      id: "apt-2",
      appointmentDate: "02/10/2026 14:00",
      doctorName: "BS. Nguyễn Thị Mai",
      serviceName: "Cạo vôi răng & Đánh bóng 2 hàm",
      status: "completed",
      diagnosisNotes: "Vôi răng độ 2, viêm nướu nhẹ viền nướu hàm dưới. Đã vệ sinh sạch sẽ"
    },
    {
      id: "apt-3",
      appointmentDate: "15/08/2025 10:15",
      doctorName: "BS. Lê Hoàng Nam",
      serviceName: "Trám răng thẩm mỹ Composite răng 26",
      status: "completed",
      diagnosisNotes: "Trám xoang I mặt nhai bằng Z350 XT, khớp cắn ổn định"
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="text-[18px] font-semibold text-[var(--color-text)]">
              Lịch sử khám & Lịch hẹn điều trị
            </h3>
            <span className="px-2 py-0.5 rounded-[var(--radius)] bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] text-[var(--text-xs)] font-medium tabular-nums">
              {appointments.length} lần khám
            </span>
          </div>
          <p className="mt-1 text-[var(--text-xs)] text-[var(--color-text-muted)]">
            Theo dõi tiến trình các buổi điều trị, bác sĩ phụ trách và diễn tiến lâm sàng của bệnh nhân {patientName}.
          </p>
        </div>

        <Link
          href={`/appointments?patientId=${patientId}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-xs)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Đặt lịch hẹn mới</span>
        </Link>
      </div>

      {/* Timeline List of Appointments */}
      <div className="space-y-3">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className="p-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs hover:border-[var(--color-primary)] transition space-y-2.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[var(--text-sm)] font-bold text-[var(--color-text)] tabular-nums">
                  <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>{apt.appointmentDate}</span>
                </div>
                <StatusTag
                  variant={
                    apt.status === "completed"
                      ? "success"
                      : apt.status === "in_progress"
                      ? "warning"
                      : apt.status === "cancelled"
                      ? "neutral"
                      : "info"
                  }
                >
                  {apt.status === "completed"
                    ? "Đã hoàn thành"
                    : apt.status === "in_progress"
                    ? "Đang điều trị"
                    : apt.status === "cancelled"
                    ? "Đã hủy"
                    : "Đã lên lịch"}
                </StatusTag>
              </div>

              <div className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--color-text-muted)]">
                <User className="w-3.5 h-3.5" />
                <span className="font-medium text-[var(--color-text)]">{apt.doctorName}</span>
              </div>
            </div>

            <div>
              <h4 className="text-[15px] font-semibold text-[var(--color-text)]">
                {apt.serviceName}
              </h4>
              {apt.diagnosisNotes && (
                <p className="mt-1 text-[13px] text-[var(--color-text-muted)] bg-[var(--color-bg)] p-2.5 rounded-[var(--radius)]">
                  <strong className="text-[var(--color-text)] font-semibold">Chẩn đoán / Thủ thuật:</strong>{" "}
                  {apt.diagnosisNotes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
