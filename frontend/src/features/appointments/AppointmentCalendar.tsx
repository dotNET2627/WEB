"use client";

/**
 * Lazy-loads the calendar with SSR disabled.
 * react-big-calendar relies on browser APIs (drag-and-drop, DOM measurements)
 * that are not available on the server, so we use next/dynamic + ssr:false.
 */
import dynamic from "next/dynamic";
import type { AppointmentListItem } from "@/types/appointment";

const AppointmentCalendarInner = dynamic(
  () =>
    import("./AppointmentCalendarInner").then((mod) => mod.AppointmentCalendarInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Đang tải lịch…
      </div>
    ),
  }
);

interface Props {
  appointments: AppointmentListItem[];
  onDateRangeChange: (from: Date, to: Date) => void;
  onEventDrop: (id: string, startsAt: Date, endsAt: Date | null) => Promise<boolean>;
  onEventClick: (appointment: AppointmentListItem) => void;
}

export function AppointmentCalendar(props: Props) {
  return <AppointmentCalendarInner {...props} />;
}
