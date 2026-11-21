"use client";

import type { AppointmentListItem } from "@/types/appointment";

interface Props {
  appointment: AppointmentListItem;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  Pending: "Chờ xác nhận",
  pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  confirmed: "Đã xác nhận",
  Completed: "Hoàn thành",
  completed: "Hoàn thành",
  Cancelled: "Đã huỷ",
  cancelled: "Đã huỷ",
  NoShow: "Vắng mặt",
  noShow: "Vắng mặt",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function AppointmentDetailModal({ appointment, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Chi tiết lịch hẹn</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <dl className="divide-y divide-slate-100 px-6 dark:divide-slate-800">
          <Row label="Trạng thái">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {STATUS_LABELS[appointment.status] ?? appointment.status}
            </span>
          </Row>
          {appointment.reason && <Row label="Lý do">{appointment.reason}</Row>}
          <Row label="Bắt đầu">{formatDateTime(appointment.startsAt)}</Row>
          {appointment.endsAt && <Row label="Kết thúc">{formatDateTime(appointment.endsAt)}</Row>}
          <Row label="Bệnh nhân">{appointment.patientName ?? appointment.patientId}</Row>
          <Row label="Bác sĩ">{appointment.doctorName ?? appointment.doctorId}</Row>
        </dl>

        <div className="flex justify-end gap-2 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3">
      <dt className="w-28 shrink-0 text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-800 dark:text-slate-200">{children}</dd>
    </div>
  );
}
