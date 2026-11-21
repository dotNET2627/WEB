"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { Doctor, WorkScheduleItem, UpdateDoctorRequest, AssignWorkScheduleRequest } from "@/types/doctor";
import { doctorService } from "@/services/doctor-service";
import { Drawer } from "@/components/ui/drawer";
import { FormField } from "@/components/ui/form-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { User, Calendar, Plus, Trash2, Clock, AlertTriangle } from "lucide-react";
import clsx from "clsx";

export interface DoctorDetailDrawerProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onDoctorUpdated: (updated: Doctor) => void;
}

const DAYS = [
  { value: 1, label: "Thứ Hai" },
  { value: 2, label: "Thứ Ba" },
  { value: 3, label: "Thứ Tư" },
  { value: 4, label: "Thứ Năm" },
  { value: 5, label: "Thứ Sáu" },
  { value: 6, label: "Thứ Bảy" },
  { value: 7, label: "Chủ Nhật" }
];

const SPECIALTIES = [
  "Răng Tổng quát",
  "Chỉnh nha - Niềng răng",
  "Cấy ghép Implant",
  "Phục hình Răng sứ",
  "Nha chu & Điều trị tủy",
  "Phẫu thuật trong miệng",
  "Nha khoa Trẻ em"
];

export function DoctorDetailDrawer({
  doctor,
  isOpen,
  onClose,
  onDoctorUpdated
}: DoctorDetailDrawerProps) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"profile" | "schedules">("profile");

  // Tab 1 state: Profile
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [specialty, setSpecialty] = useState("");
  const [biography, setBiography] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Tab 2 state: Schedules
  const [schedules, setSchedules] = useState<WorkScheduleItem[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Deletion confirm dialog
  const [scheduleToDelete, setScheduleToDelete] = useState<WorkScheduleItem | null>(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);

  // Populate data when doctor changes
  useEffect(() => {
    if (doctor) {
      setMedicalLicenseNumber(doctor.medicalLicenseNumber || "");
      setYearsOfExperience(doctor.yearsOfExperience || 0);
      setSpecialty(doctor.specialty || SPECIALTIES[0]);
      setBiography(doctor.biography || "");
      setSchedules(doctor.workSchedules || []);
      setProfileErrors({});
      setScheduleError(null);
    }
  }, [doctor]);

  // Load fresh schedules when switching to schedules tab
  useEffect(() => {
    if (doctor && activeTab === "schedules" && isOpen) {
      setIsLoadingSchedules(true);
      doctorService
        .getDoctorSchedules(doctor.id)
        .then((items) => {
          setSchedules(items);
        })
        .catch(() => {
          // Fall back to doctor.workSchedules
        })
        .finally(() => {
          setIsLoadingSchedules(false);
        });
    }
  }, [doctor, activeTab, isOpen]);

  // Group schedules by day of week (1..7)
  const schedulesByDay = useMemo(() => {
    const map = new Map<number, WorkScheduleItem[]>();
    for (let d = 1; d <= 7; d++) {
      map.set(d, []);
    }
    for (const item of schedules) {
      const list = map.get(item.dayOfWeek) || [];
      list.push(item);
      map.set(item.dayOfWeek, list);
    }
    // Sort each day's schedules by startTime
    for (const [d, list] of map.entries()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
      map.set(d, list);
    }
    return map;
  }, [schedules]);

  // Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;

    const errors: Record<string, string> = {};
    if (!medicalLicenseNumber.trim()) {
      errors.medicalLicenseNumber = "Số chứng chỉ hành nghề không được để trống.";
    }
    if (yearsOfExperience < 0) {
      errors.yearsOfExperience = "Số năm kinh nghiệm không thể âm.";
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setProfileErrors({});
    setIsSavingProfile(true);

    try {
      const payload: UpdateDoctorRequest = {
        medicalLicenseNumber: medicalLicenseNumber.trim(),
        yearsOfExperience: Number(yearsOfExperience),
        specialty: specialty.trim() || undefined,
        biography: biography.trim() || undefined
      };

      const updated = await doctorService.updateDoctor(doctor.id, payload);
      onDoctorUpdated(updated);
      showToast("Đã lưu thông tin chuyên môn bác sĩ thành công.", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi khi lưu thông tin bác sĩ.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Add work schedule
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;

    setScheduleError(null);

    // Validation: End time > Start time
    if (startTime >= endTime) {
      setScheduleError("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }

    // Pre-validation: Overlap check on client side
    const existingDaySchedules = schedulesByDay.get(selectedDay) || [];
    const hasOverlap = existingDaySchedules.some(
      (item) => startTime < item.endTime && endTime > item.startTime
    );

    if (hasOverlap) {
      setScheduleError(`Ca trực mới bị trùng với ca đã có trong ${DAYS.find((d) => d.value === selectedDay)?.label}.`);
      return;
    }

    setIsAddingSchedule(true);
    try {
      const payload: AssignWorkScheduleRequest = {
        dayOfWeek: selectedDay,
        startTime,
        endTime
      };

      const updatedList = await doctorService.assignWorkSchedule(doctor.id, payload);
      setSchedules(updatedList);

      // Update parent doctor item
      onDoctorUpdated({
        ...doctor,
        workSchedules: updatedList
      });

      const dayName = DAYS.find((d) => d.value === selectedDay)?.label;
      showToast(`Đã thêm ca trực ${dayName} (${startTime} - ${endTime}).`, "success");
    } catch (err: unknown) {
      setScheduleError(err instanceof Error ? err.message : "Lỗi khi gán ca trực.");
    } finally {
      setIsAddingSchedule(false);
    }
  };

  // Delete schedule
  const handleConfirmDeleteSchedule = async () => {
    if (!doctor || !scheduleToDelete) return;

    setIsDeletingSchedule(true);
    try {
      const updatedList = await doctorService.removeWorkSchedule(doctor.id, {
        dayOfWeek: scheduleToDelete.dayOfWeek,
        startTime: scheduleToDelete.startTime,
        endTime: scheduleToDelete.endTime
      });

      setSchedules(updatedList);
      onDoctorUpdated({
        ...doctor,
        workSchedules: updatedList
      });

      const dayName = DAYS.find((d) => d.value === scheduleToDelete.dayOfWeek)?.label;
      showToast(`Đã hủy ca trực ${dayName} (${scheduleToDelete.startTime} - ${scheduleToDelete.endTime}).`, "success");
      setScheduleToDelete(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi khi hủy ca trực.", "error");
    } finally {
      setIsDeletingSchedule(false);
    }
  };

  if (!doctor) return null;

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={doctor.doctorName || "Hồ sơ Bác sĩ"}
        description={`Mã CCHN: ${doctor.medicalLicenseNumber || "Chưa cấp"} • ${doctor.email || ""}`}
        width="wide"
      >
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-[var(--color-border)] gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={clsx(
                "inline-flex items-center gap-2 px-4 py-2.5 text-[var(--text-sm)] font-medium border-b-2 transition cursor-pointer -mb-px",
                activeTab === "profile"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <User className="w-4 h-4" />
              <span>Chuyên môn & CCHN</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("schedules")}
              className={clsx(
                "inline-flex items-center gap-2 px-4 py-2.5 text-[var(--text-sm)] font-medium border-b-2 transition cursor-pointer -mb-px",
                activeTab === "schedules"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <Calendar className="w-4 h-4" />
              <span>Ca trực tuần hoàn ({schedules.length})</span>
            </button>
          </div>

          {/* TAB 1: Profile form */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <FormField
                label="Số chứng chỉ hành nghề (CCHN)"
                required
                id="doc-cchn"
                error={profileErrors.medicalLicenseNumber}
                hint="Được cấp bởi Bộ Y tế hoặc Sở Y tế (ví dụ: 012345/BYT-CCHN)"
              >
                <input
                  id="doc-cchn"
                  type="text"
                  value={medicalLicenseNumber}
                  onChange={(e) => setMedicalLicenseNumber(e.target.value)}
                  className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                />
              </FormField>

              <FormField
                label="Chuyên khoa chính"
                required
                id="doc-specialty"
                hint="Lĩnh vực điều trị chuyên sâu của bác sĩ tại phòng khám"
              >
                <select
                  id="doc-specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] cursor-pointer"
                >
                  {SPECIALTIES.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Số năm kinh nghiệm"
                required
                id="doc-exp"
                error={profileErrors.yearsOfExperience}
                hint="Kinh nghiệm khám chữa bệnh chuyên khoa"
              >
                <input
                  id="doc-exp"
                  type="number"
                  min="0"
                  max="60"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                  className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                />
              </FormField>

              <FormField
                label="Giới thiệu tiểu sử & Bằng cấp"
                id="doc-bio"
                hint="Tóm tắt quá trình đào tạo, chứng chỉ chuyên sâu trong và ngoài nước"
              >
                <textarea
                  id="doc-bio"
                  rows={4}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                />
              </FormField>

              <div className="pt-3 border-t border-[var(--color-border)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-sm)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfile ? "Đang lưu..." : "Lưu thông tin chuyên môn"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Work Schedules */}
          {activeTab === "schedules" && (
            <div className="space-y-6">
              {/* Form thêm ca trực nhanh */}
              <form
                onSubmit={handleAddSchedule}
                className="p-4 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg)] space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[var(--color-primary)]" />
                  <h3 className="text-[var(--text-sm)] font-semibold text-[var(--color-text)]">
                    Gán ca trực tuần hoàn mới
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="sched-day" className="block text-[var(--text-xs)] font-medium text-[var(--color-text)] mb-1">
                      Thứ trong tuần
                    </label>
                    <select
                      id="sched-day"
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] cursor-pointer"
                    >
                      {DAYS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="sched-start" className="block text-[var(--text-xs)] font-medium text-[var(--color-text)] mb-1">
                      Giờ bắt đầu
                    </label>
                    <input
                      id="sched-start"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                    />
                  </div>

                  <div>
                    <label htmlFor="sched-end" className="block text-[var(--text-xs)] font-medium text-[var(--color-text)] mb-1">
                      Giờ kết thúc
                    </label>
                    <input
                      id="sched-end"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                    />
                  </div>
                </div>

                {scheduleError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-[var(--radius)] bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] text-[var(--text-xs)] font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{scheduleError}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isAddingSchedule}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAddingSchedule ? "Đang gán..." : "Thêm ca này"}</span>
                  </button>
                </div>
              </form>

              {/* Ma trận 7 ngày */}
              <div className="space-y-3">
                <h3 className="text-[var(--text-sm)] font-semibold text-[var(--color-text)]">
                  Lịch trực theo các ngày trong tuần
                </h3>

                {isLoadingSchedules ? (
                  <div className="space-y-2">
                    {Array.from({ length: 7 }).map((_, idx) => (
                      <div key={idx} className="h-10 bg-slate-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {DAYS.map((day) => {
                      const daySchedules = schedulesByDay.get(day.value) || [];

                      return (
                        <div
                          key={day.value}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] gap-2"
                        >
                          <div className="sm:w-28 font-medium text-[var(--text-sm)] text-[var(--color-text)]">
                            {day.label}
                          </div>

                          <div className="flex-1 flex flex-wrap items-center gap-2">
                            {daySchedules.length === 0 ? (
                              <span className="text-[var(--text-xs)] text-[var(--color-text-muted)] italic">
                                Không có ca trực
                              </span>
                            ) : (
                              daySchedules.map((sch, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius)] bg-[var(--status-info-bg)] text-[var(--status-info-fg)] text-[var(--text-xs)] font-medium tabular-nums border border-blue-200/50"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    {sch.startTime} – {sch.endTime}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setScheduleToDelete(sch)}
                                    aria-label={`Hủy ca ${day.label} ${sch.startTime}-${sch.endTime}`}
                                    className="p-0.5 text-[var(--status-info-fg)] hover:text-red-700 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* Confirm Deletion Dialog as per ADMIN_UI_RULES.md mục 6 */}
      <ConfirmDialog
        isOpen={!!scheduleToDelete}
        onClose={() => setScheduleToDelete(null)}
        onConfirm={handleConfirmDeleteSchedule}
        title="Hủy ca trực của bác sĩ"
        description={`Bạn có chắc chắn muốn hủy ca trực ${
          DAYS.find((d) => d.value === scheduleToDelete?.dayOfWeek)?.label
        } (${scheduleToDelete?.startTime} - ${scheduleToDelete?.endTime}) của Bác sĩ ${
          doctor.doctorName || ""
        }?`}
        confirmLabel="Hủy ca trực"
        cancelLabel="Giữ ca trực"
        isDestructive={true}
        isLoading={isDeletingSchedule}
      />
    </>
  );
}
