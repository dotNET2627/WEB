"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { receptionService } from "@/services/reception-service";
import type { TodayAppointment, AppointmentStatus } from "@/types/appointment";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; badge: string }
> = {
  Pending:    { label: "Chờ xác nhận", badge: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  Confirmed:  { label: "Đã xác nhận",  badge: "bg-blue-100 text-blue-800 border-blue-200" },
  CheckedIn:  { label: "Đã đến",       badge: "bg-teal-100 text-teal-800 border-teal-200" },
  InProgress: { label: "Đang khám",    badge: "bg-orange-100 text-orange-800 border-orange-200" },
  Completed:  { label: "Hoàn thành",   badge: "bg-green-100 text-green-800 border-green-200" },
  Cancelled:  { label: "Đã hủy",       badge: "bg-gray-100 text-gray-500 border-gray-200" },
  NoShow:     { label: "Vắng mặt",     badge: "bg-red-100 text-red-500 border-red-200" },
};

// ── Types ────────────────────────────────────────────────────────────────────
interface ActionButton {
  label: string;
  color: string;
  action: (id: string) => Promise<unknown>;
}

function getActions(status: AppointmentStatus): ActionButton[] {
  const actions: ActionButton[] = [];

  if (status === "Pending") {
    actions.push({
      label: "Xác nhận",
      color: "bg-blue-500 hover:bg-blue-600 text-white",
      action: receptionService.confirm,
    });
  }
  if (status === "Confirmed") {
    actions.push({
      label: "Check-in ✓",
      color: "bg-teal-500 hover:bg-teal-600 text-white",
      action: receptionService.checkIn,
    });
    actions.push({
      label: "Vắng mặt",
      color: "border border-red-300 text-red-500 hover:bg-red-50",
      action: receptionService.markNoShow,
    });
  }
  if (status === "CheckedIn") {
    actions.push({
      label: "Vào khám →",
      color: "bg-orange-500 hover:bg-orange-600 text-white",
      action: receptionService.startExam,
    });
    actions.push({
      label: "Vắng mặt",
      color: "border border-red-300 text-red-500 hover:bg-red-50",
      action: receptionService.markNoShow,
    });
  }
  if (status === "InProgress") {
    actions.push({
      label: "Hoàn thành ✓",
      color: "bg-green-500 hover:bg-green-600 text-white",
      action: receptionService.complete,
    });
  }

  return actions;
}

// ── Main component ────────────────────────────────────────────────────────────
export function ReceptionView({ clinicId }: { clinicId: string }) {
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [search, setSearch] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(
    async (date: string) => {
      try {
        setError(null);
        const data = await receptionService.getTodayAppointments(clinicId, date);
        setAppointments(data);
      } catch {
        setError("Không thể tải danh sách lịch hẹn. Thử lại sau.");
      } finally {
        setLoading(false);
      }
    },
    [clinicId]
  );

  useEffect(() => {
    setLoading(true);
    load(selectedDate);
    // Auto-refresh every 30s
    timerRef.current = setInterval(() => load(selectedDate), 30_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load, selectedDate]);

  const handleAction = async (id: string, action: (id: string) => Promise<unknown>) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await action(id);
      await load(selectedDate); // Refresh sau khi thay đổi
    } catch {
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  // Stats
  const stats = React.useMemo(() => ({
    total:      appointments.length,
    checkedIn:  appointments.filter((a) => a.status === "CheckedIn").length,
    inProgress: appointments.filter((a) => a.status === "InProgress").length,
    completed:  appointments.filter((a) => a.status === "Completed").length,
    waiting:    appointments.filter((a) => a.status === "Confirmed").length,
  }), [appointments]);

  // Filter by search
  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return appointments;
    return appointments.filter(
      (a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q)
    );
  }, [appointments, search]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🏥 Màn hình Tiếp đón</h1>
          <p className="text-sm text-slate-500">
            Cập nhật tự động mỗi 30 giây
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => load(selectedDate)}
            className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm shadow-sm hover:bg-slate-50 transition"
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Tổng cộng",   value: stats.total,      color: "text-slate-700" },
          { label: "Chờ đến",     value: stats.waiting,    color: "text-blue-600" },
          { label: "Đã đến",      value: stats.checkedIn,  color: "text-teal-600" },
          { label: "Đang khám",   value: stats.inProgress, color: "text-orange-600" },
          { label: "Hoàn thành",  value: stats.completed,  color: "text-green-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Tìm bệnh nhân hoặc bác sĩ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-slate-400">Đang tải...</div>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-100 p-6 text-center text-red-600">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-100 p-12 text-center text-slate-400">
          Không có lịch hẹn nào trong ngày này.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Giờ hẹn</th>
                <th className="px-4 py-3">Bệnh nhân</th>
                <th className="px-4 py-3">Bác sĩ</th>
                <th className="px-4 py-3">Dịch vụ</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((appt) => {
                const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.Pending;
                const actions = getActions(appt.status);
                const isBusy = busy[appt.id] ?? false;

                return (
                  <tr
                    key={appt.id}
                    className={`transition-colors ${
                      appt.status === "InProgress"
                        ? "bg-orange-50/40"
                        : appt.status === "CheckedIn"
                        ? "bg-teal-50/40"
                        : "hover:bg-slate-50/60"
                    }`}
                  >
                    {/* Time */}
                    <td className="px-4 py-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                      {format(parseISO(appt.startsAt), "HH:mm", { locale: vi })}
                      {appt.endsAt && (
                        <span className="ml-1 text-xs font-normal text-slate-400">
                          – {format(parseISO(appt.endsAt), "HH:mm", { locale: vi })}
                        </span>
                      )}
                      {appt.checkedInAt && (
                        <div className="text-xs text-teal-600 mt-0.5">
                          Check-in: {format(parseISO(appt.checkedInAt), "HH:mm")}
                        </div>
                      )}
                    </td>

                    {/* Patient */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{appt.patientName}</div>
                      {appt.reason && (
                        <div className="text-xs text-slate-400 truncate max-w-[160px]">{appt.reason}</div>
                      )}
                    </td>

                    {/* Doctor */}
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {appt.doctorName}
                    </td>

                    {/* Services */}
                    <td className="px-4 py-3 max-w-[200px]">
                      {appt.plannedServices.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {appt.plannedServices.slice(0, 2).map((s) => (
                            <span
                              key={s.serviceId}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                            >
                              {s.serviceName}
                            </span>
                          ))}
                          {appt.plannedServices.length > 2 && (
                            <span className="text-xs text-slate-400">
                              +{appt.plannedServices.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">–</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.badge}`}
                      >
                        {cfg.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isBusy ? (
                          <span className="text-xs text-slate-400">Đang xử lý...</span>
                        ) : (
                          actions.map((btn) => (
                            <button
                              key={btn.label}
                              disabled={isBusy}
                              onClick={() => handleAction(appt.id, btn.action)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${btn.color}`}
                            >
                              {btn.label}
                            </button>
                          ))
                        )}
                        {actions.length === 0 && (
                          <span className="text-xs text-slate-300">–</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
