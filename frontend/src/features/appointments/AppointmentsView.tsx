"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AppointmentCalendar } from "./AppointmentCalendar";
import { AppointmentDetailModal } from "./AppointmentDetailModal";
import { appointmentService } from "@/services/appointment-service";
import type { AppointmentListItem } from "@/types/appointment";

// Mock doctors list – replace with a real /api/v1/doctors endpoint when available
const MOCK_DOCTORS = [
  { id: "", name: "Tất cả bác sĩ" },
];

export function AppointmentsView() {
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Keep current date range so we can re-fetch after reschedule
  const rangeRef = useRef<{ from: Date; to: Date } | null>(null);

  const fetchAppointments = useCallback(
    async (from: Date, to: Date, doctorId?: string) => {
      setError(null);
      try {
        const data = await appointmentService.getByDateRange(from, to, doctorId || undefined);
        setAppointments(data);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
        setError("Không thể tải danh sách lịch hẹn. Vui lòng thử lại.");
        setAppointments([]);
      }
    },
    []
  );

  // Called by FullCalendar whenever the visible date range changes (view switch / nav)
  const handleDateRangeChange = useCallback(
    (from: Date, to: Date) => {
      rangeRef.current = { from, to };
      startTransition(() => {
        void fetchAppointments(from, to, selectedDoctorId);
      });
    },
    [fetchAppointments, selectedDoctorId]
  );

  // Re-fetch when doctor filter changes
  useEffect(() => {
    if (!rangeRef.current) return;
    const { from, to } = rangeRef.current;
    startTransition(() => {
      void fetchAppointments(from, to, selectedDoctorId);
    });
  }, [selectedDoctorId, fetchAppointments]);

  // Called when user drops an event – reschedule via API, return false to revert
  const handleEventDrop = useCallback(
    async (id: string, startsAt: Date, endsAt: Date | null): Promise<boolean> => {
      try {
        await appointmentService.reschedule(id, {
          startsAt: startsAt.toISOString(),
          endsAt: endsAt?.toISOString() ?? null,
        });
        // Optimistic update already applied by FullCalendar; also refresh from server
        if (rangeRef.current) {
          void fetchAppointments(rangeRef.current.from, rangeRef.current.to, selectedDoctorId);
        }
        return true;
      } catch (err) {
        console.error("Reschedule failed", err);
        return false; // triggers revert in AppointmentCalendar
      }
    },
    [fetchAppointments, selectedDoctorId]
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Lịch hẹn</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quản lý lịch khám, bác sĩ, dịch vụ dự kiến và trạng thái tiếp đón.
          </p>
        </div>

        {/* Doctor filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="doctor-filter" className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Bác sĩ:
          </label>
          <select
            id="doctor-filter"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            {MOCK_DOCTORS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading / error banners */}
      {isPending && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          Đang tải lịch hẹn…
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Calendar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <AppointmentCalendar
          appointments={appointments}
          onDateRangeChange={handleDateRangeChange}
          onEventDrop={handleEventDrop}
          onEventClick={setSelectedAppointment}
        />
      </div>

      {/* Detail modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}
