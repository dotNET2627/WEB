"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { clinicService } from "@/services/clinic-service";
import type { Clinic, UpdateClinicRequest } from "@/types/clinic";
import { FormField } from "@/components/ui/form-field";
import { StatusTag } from "@/components/ui/status-tag";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Building2, Save, RefreshCw, AlertCircle, Copy, Clock, Power } from "lucide-react";

interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Thứ Hai" },
  { key: "tuesday", label: "Thứ Ba" },
  { key: "wednesday", label: "Thứ Tư" },
  { key: "thursday", label: "Thứ Năm" },
  { key: "friday", label: "Thứ Sáu" },
  { key: "saturday", label: "Thứ Bảy" },
  { key: "sunday", label: "Chủ Nhật" }
];

export default function ClinicsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");

  // Opening hours state
  const [schedules, setSchedules] = useState<Record<string, DaySchedule>>({
    monday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
    tuesday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
    wednesday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
    thursday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
    friday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
    saturday: { isOpen: true, openTime: "08:00", closeTime: "17:30" },
    sunday: { isOpen: false, openTime: "08:00", closeTime: "12:00" }
  });

  // Toggle active confirmation
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parseOpeningHours = useCallback((openingHours?: Record<string, string> | null) => {
    if (!openingHours) return;
    setSchedules((prev) => {
      const nextSchedules = { ...prev };
      for (const day of DAYS_OF_WEEK) {
        const val = openingHours[day.key];
        if (val && val !== "Đóng cửa" && val.includes("-")) {
          const [open, close] = val.split("-").map((t) => t.trim());
          nextSchedules[day.key] = {
            isOpen: true,
            openTime: open || "08:00",
            closeTime: close || "20:00"
          };
        } else if (val === "Đóng cửa") {
          nextSchedules[day.key] = {
            isOpen: false,
            openTime: "08:00",
            closeTime: "20:00"
          };
        }
      }
      return nextSchedules;
    });
  }, []);

  const loadClinicData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const validActiveClinicId =
        user?.activeClinicId && user.activeClinicId !== "00000000-0000-0000-0000-000000000000"
          ? user.activeClinicId
          : undefined;

      let targetClinicId = validActiveClinicId;
      if (!targetClinicId) {
        const res = await clinicService.getClinics({ pageSize: 1 });
        if (res.items.length > 0) {
          targetClinicId = res.items[0].id;
        }
      }

      if (!targetClinicId) {
        setError("Chưa xác định được phòng khám hiện tại.");
        return;
      }

      const data = await clinicService.getClinicById(targetClinicId);
      setClinic(data);
      setName(data.name || "");
      setAddress(data.address || "");
      setPhoneNumber(data.phoneNumber || "");
      setEmail(data.email || "");
      setDescription(data.description || "");
      setLogo(data.logo || "");
      parseOpeningHours(data.openingHours);
      setIsDirty(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu chi nhánh.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.activeClinicId, parseOpeningHours]);

  useEffect(() => {
    if (!isAuthLoading) {
      loadClinicData();
    }
  }, [loadClinicData, isAuthLoading]);

  // Unload warning if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleCopyMondayToWeekdays = () => {
    const mon = schedules.monday;
    setSchedules((prev) => ({
      ...prev,
      tuesday: { ...mon },
      wednesday: { ...mon },
      thursday: { ...mon },
      friday: { ...mon }
    }));
    setIsDirty(true);
    showToast("Đã áp dụng giờ Thứ Hai cho các ngày Thứ Ba đến Thứ Sáu.", "info");
  };

  const handleScheduleChange = (
    dayKey: string,
    field: keyof DaySchedule,
    value: boolean | string
  ) => {
    setSchedules((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }));
    setIsDirty(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Tên phòng khám không được để trống.";
    }
    if (!address.trim()) {
      newErrors.address = "Địa chỉ cơ sở không được để trống.";
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Định dạng email không hợp lệ (ví dụ: contact@phongkham.vn).";
    }

    for (const day of DAYS_OF_WEEK) {
      const sch = schedules[day.key];
      if (sch.isOpen && sch.openTime >= sch.closeTime) {
        newErrors[`schedule_${day.key}`] = `${day.label}: Giờ mở cửa phải trước giờ đóng cửa.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !clinic) return;

    setIsSaving(true);
    try {
      const openingHoursRecord: Record<string, string> = {};
      for (const day of DAYS_OF_WEEK) {
        const sch = schedules[day.key];
        openingHoursRecord[day.key] = sch.isOpen ? `${sch.openTime}-${sch.closeTime}` : "Đóng cửa";
      }

      const payload: UpdateClinicRequest = {
        name: name.trim(),
        address: address.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        description: description.trim() || undefined,
        logo: logo.trim() || undefined,
        openingHours: openingHoursRecord
      };

      const updated = await clinicService.updateClinic(clinic.id, payload);
      setClinic(updated);
      setIsDirty(false);
      showToast("Đã lưu thông tin chi nhánh thành công.", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi khi lưu thông tin chi nhánh.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!clinic) return;
    setIsTogglingStatus(true);
    try {
      if (clinic.isActive) {
        await clinicService.deactivateClinic(clinic.id);
        setClinic({ ...clinic, isActive: false });
        showToast("Đã chuyển trạng thái cơ sở sang Tạm ngừng hoạt động.", "warning");
      } else {
        await clinicService.activateClinic(clinic.id);
        setClinic({ ...clinic, isActive: true });
        showToast("Đã kích hoạt lại hoạt động cho chi nhánh.", "success");
      }
      setIsStatusDialogOpen(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi khi thay đổi trạng thái chi nhánh.", "error");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[720px]">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-slate-200 rounded animate-pulse" />
        <div className="space-y-4 pt-4">
          <div className="h-10 bg-slate-200 rounded animate-pulse" />
          <div className="h-10 bg-slate-200 rounded animate-pulse" />
          <div className="h-24 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="max-w-[720px] p-8 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-surface)] text-center space-y-4">
        <div className="inline-flex p-3 bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] rounded-[var(--radius)]">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--color-text)]">Không thể tải thông tin phòng khám</h2>
        <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">{error ?? "Dữ liệu không tồn tại."}</p>
        <button
          type="button"
          onClick={loadClinicData}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-bg)] transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[var(--text-sm)] text-[var(--color-text-muted)] flex items-center gap-2">
        <Link href="/dashboard" className="hover:text-[var(--color-text)] transition">
          Tổng quan
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text)] font-medium">Chi nhánh</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-semibold text-[var(--color-text)] leading-tight">
              Quản lý Chi nhánh & Cơ sở
            </h1>
            <StatusTag variant={clinic.isActive ? "success" : "neutral"}>
              {clinic.isActive ? "Đang hoạt động" : "Tạm ngừng hoạt động"}
            </StatusTag>
          </div>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-muted)]">
            Cấu hình thông tin địa chỉ, liên hệ và khung giờ hoạt động định kỳ của cơ sở hiện tại.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsStatusDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-sm)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
          >
            <Power className="w-4 h-4 text-[var(--color-text-muted)]" />
            <span>{clinic.isActive ? "Tạm ngừng cơ sở" : "Kích hoạt cơ sở"}</span>
          </button>
        </div>
      </div>

      {/* Main Single-column Form (max 720px per ADMIN_UI_RULES.md mục 2) */}
      <form onSubmit={handleSubmit} className="max-w-[720px] space-y-6">
        {/* Section 1: Thông tin cơ bản */}
        <div className="border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-surface)] p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border)]">
            <Building2 className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="text-[18px] font-semibold text-[var(--color-text)]">
              Thông tin liên hệ & Cơ sở
            </h2>
          </div>

          <FormField
            label="Tên cơ sở / Chi nhánh"
            required
            id="clinic-name"
            error={errors.name}
            hint="Ví dụ: DentalCare Central - Cơ sở Quận 1"
          >
            <input
              id="clinic-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </FormField>

          <FormField
            label="Địa chỉ chi nhánh"
            required
            id="clinic-address"
            error={errors.address}
            hint="Địa chỉ cụ thể, số nhà, đường, phường, quận/huyện, tỉnh/thành phố"
          >
            <input
              id="clinic-address"
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Số điện thoại hotline"
              id="clinic-phone"
              error={errors.phoneNumber}
              hint="Ví dụ: 028 3822 1999"
            >
              <input
                id="clinic-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
              />
            </FormField>

            <FormField
              label="Email tiếp nhận thông tin"
              id="clinic-email"
              error={errors.email}
              hint="Ví dụ: cskh@dentalcare.vn"
            >
              <input
                id="clinic-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
              />
            </FormField>
          </div>

          <FormField
            label="Mô tả chuyên môn & Tiện ích"
            id="clinic-description"
            hint="Thông tin giới thiệu về trang thiết bị y tế và dịch vụ nổi bật của chi nhánh"
          >
            <textarea
              id="clinic-description"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </FormField>

          <FormField
            label="Đường dẫn ảnh Logo chi nhánh"
            id="clinic-logo"
            hint="URL ảnh biểu trưng chính thức (JPG, PNG, SVG)"
          >
            <input
              id="clinic-logo"
              type="text"
              value={logo}
              onChange={(e) => {
                setLogo(e.target.value);
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </FormField>
        </div>

        {/* Section 2: Khung giờ mở cửa định kỳ */}
        <div className="border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-surface)] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="text-[18px] font-semibold text-[var(--color-text)]">
                Khung giờ hoạt động định kỳ
              </h2>
            </div>

            <button
              type="button"
              onClick={handleCopyMondayToWeekdays}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-xs)] font-medium text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition cursor-pointer self-start sm:self-auto"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Áp dụng giờ Thứ Hai cho T3 – T6</span>
            </button>
          </div>

          <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">
            Khung giờ này sẽ hiển thị cho bệnh nhân khi đặt lịch hẹn trực tuyến và tra cứu cơ sở.
          </p>

          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => {
              const sch = schedules[day.key];
              const dayError = errors[`schedule_${day.key}`];

              return (
                <div
                  key={day.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)]"
                >
                  <div className="flex items-center gap-3 sm:w-36">
                    <input
                      id={`day-open-${day.key}`}
                      type="checkbox"
                      checked={sch.isOpen}
                      onChange={(e) => handleScheduleChange(day.key, "isOpen", e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-focus)] cursor-pointer"
                    />
                    <label htmlFor={`day-open-${day.key}`} className="text-[var(--text-sm)] font-medium text-[var(--color-text)] cursor-pointer">
                      {day.label}
                    </label>
                  </div>

                  {sch.isOpen ? (
                    <div className="flex items-center gap-2 tabular-nums">
                      <input
                        type="time"
                        aria-label={`Giờ mở cửa ${day.label}`}
                        value={sch.openTime}
                        onChange={(e) => handleScheduleChange(day.key, "openTime", e.target.value)}
                        className="px-2.5 py-1 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                      />
                      <span className="text-[var(--color-text-muted)] text-[var(--text-sm)]">đến</span>
                      <input
                        type="time"
                        aria-label={`Giờ đóng cửa ${day.label}`}
                        value={sch.closeTime}
                        onChange={(e) => handleScheduleChange(day.key, "closeTime", e.target.value)}
                        className="px-2.5 py-1 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                      />
                    </div>
                  ) : (
                    <span className="text-[var(--text-sm)] text-[var(--color-text-muted)] italic">
                      Đóng cửa / Nghỉ khám
                    </span>
                  )}

                  {dayError && (
                    <p className="text-[var(--text-xs)] text-[var(--color-danger)] font-medium w-full sm:w-auto">
                      {dayError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Bottom Action Bar as per ADMIN_UI_RULES.md mục 5 */}
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 shadow-[var(--shadow-overlay)]">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-[var(--text-sm)] text-[var(--color-text-muted)]">
              {isDirty ? (
                <span className="text-[var(--status-warning-fg)] font-medium">
                  Có thay đổi chưa lưu
                </span>
              ) : (
                <span>Dữ liệu đã được đồng bộ</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!isDirty || isSaving}
                onClick={loadClinicData}
                className="px-4 py-2 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-sm)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition disabled:opacity-40 cursor-pointer"
              >
                Hủy thay đổi
              </button>

              <button
                type="submit"
                disabled={!isDirty || isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Confirm Status Change Dialog */}
      <ConfirmDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        onConfirm={handleToggleStatus}
        title={clinic.isActive ? "Tạm ngừng hoạt động chi nhánh" : "Kích hoạt lại hoạt động chi nhánh"}
        description={
          clinic.isActive
            ? `Bạn có chắc chắn muốn chuyển cơ sở "${clinic.name}" sang trạng thái tạm ngừng hoạt động? Bệnh nhân sẽ không thể đặt lịch hẹn trực tuyến tại cơ sở này trong thời gian tạm ngừng.`
            : `Kích hoạt lại cơ sở "${clinic.name}" để cho phép tiếp nhận bệnh nhân và đặt lịch hẹn khám?`
        }
        confirmLabel={clinic.isActive ? "Tạm ngừng chi nhánh" : "Kích hoạt chi nhánh"}
        cancelLabel="Hủy bỏ"
        isDestructive={clinic.isActive}
        isLoading={isTogglingStatus}
      />
    </div>
  );
}
