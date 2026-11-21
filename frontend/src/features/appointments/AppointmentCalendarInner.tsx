"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type View,
  type CalendarProps,
} from "react-big-calendar";
import withDragAndDrop, {
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { vi } from "date-fns/locale";
import type { AppointmentListItem } from "@/types/appointment";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: AppointmentListItem;
  isDraggable: boolean;
}

// ─── date-fns localizer ──────────────────────────────────────────────────────
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: vi }),
  getDay,
  locales: { vi },
});

// ─── Drag-and-drop calendar ───────────────────────────────────────────────────
const DragAndDropCalendar = withDragAndDrop<CalEvent, object>(
  Calendar as unknown as React.ComponentType<CalendarProps<CalEvent, object>>
);

// ─── Status colours ───────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  pending: "#f59e0b",
  Confirmed: "#3b82f6",
  confirmed: "#3b82f6",
  Completed: "#10b981",
  completed: "#10b981",
  Cancelled: "#6b7280",
  cancelled: "#6b7280",
  NoShow: "#ef4444",
  noShow: "#ef4444",
};

const DRAGGABLE_STATUSES = new Set(["Pending", "pending", "Confirmed", "confirmed"]);

function toCalEvent(a: AppointmentListItem): CalEvent {
  const start = new Date(a.startsAt);
  const end = a.endsAt ? new Date(a.endsAt) : new Date(start.getTime() + 30 * 60_000);
  return {
    id: a.id,
    title: a.reason || `Lịch hẹn – ${a.doctorName ?? a.doctorId.slice(0, 8)}`,
    start,
    end,
    resource: a,
    isDraggable: DRAGGABLE_STATUSES.has(a.status),
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface AppointmentCalendarInnerProps {
  appointments: AppointmentListItem[];
  onDateRangeChange: (from: Date, to: Date) => void;
  onEventDrop: (id: string, startsAt: Date, endsAt: Date | null) => Promise<boolean>;
  onEventClick: (appointment: AppointmentListItem) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AppointmentCalendarInner({
  appointments,
  onDateRangeChange,
  onEventDrop,
  onEventClick,
}: AppointmentCalendarInnerProps) {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  const events = useMemo(() => appointments.map(toCalEvent), [appointments]);

  // Notify parent whenever the visible range changes
  const handleRangeChange = useCallback(
    (range: Date[] | { start: Date; end: Date }) => {
      if (Array.isArray(range)) {
        onDateRangeChange(range[0], range[range.length - 1]);
      } else {
        onDateRangeChange(range.start, range.end);
      }
    },
    [onDateRangeChange]
  );

  // Drag & drop handler
  const handleEventDrop = useCallback(
    async ({ event, start, end }: EventInteractionArgs<CalEvent>) => {
      if (!event.isDraggable) return;
      const ok = await onEventDrop(event.id, new Date(start), end ? new Date(end) : null);
      // react-big-calendar applies the move optimistically; if the API call
      // fails we force a re-render by toggling date (simplest revert strategy)
      if (!ok) setDate((d) => new Date(d));
    },
    [onEventDrop]
  );

  const eventPropGetter = useCallback((event: CalEvent) => {
    const color = STATUS_COLORS[event.resource.status] ?? "#64748b";
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: "#fff",
        borderRadius: "6px",
        opacity: event.isDraggable ? 1 : 0.7,
        cursor: event.isDraggable ? "grab" : "default",
      },
    };
  }, []);

  const messages = {
    today: "Hôm nay",
    previous: "‹",
    next: "›",
    month: "Tháng",
    week: "Tuần",
    day: "Ngày",
    agenda: "Danh sách",
    date: "Ngày",
    time: "Giờ",
    event: "Lịch hẹn",
    noEventsInRange: "Không có lịch hẹn trong khoảng này.",
    showMore: (total: number) => `+${total} khác`,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
        {[
          { label: "Chờ xác nhận", color: "#f59e0b" },
          { label: "Đã xác nhận", color: "#3b82f6" },
          { label: "Hoàn thành", color: "#10b981" },
          { label: "Vắng mặt", color: "#ef4444" },
          { label: "Đã huỷ", color: "#6b7280" },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
        <span className="ml-2 text-slate-400">(Kéo-thả để đổi giờ)</span>
      </div>

      {/* react-big-calendar */}
      <div style={{ height: 680 }}>
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          view={view}
          date={date}
          onView={(v: View) => setView(v)}
          onNavigate={(d: Date) => setDate(d)}
          onRangeChange={handleRangeChange}
          onEventDrop={handleEventDrop}
          onSelectEvent={(event: CalEvent) => onEventClick(event.resource)}
          eventPropGetter={eventPropGetter}
          draggableAccessor={(event: CalEvent) => event.isDraggable}
          messages={messages}
          culture="vi"
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          step={15}
          timeslots={4}
          min={new Date(0, 0, 0, 7, 0)}
          max={new Date(0, 0, 0, 20, 0)}
          formats={{
            timeGutterFormat: "HH:mm",
            eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
              `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`,
          }}
          popup
          resizable
        />
      </div>
    </div>
  );
}
