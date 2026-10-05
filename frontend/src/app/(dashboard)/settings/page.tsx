"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { Sliders, Lock, Bell, Shield, Save } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Density preference
  const [tableDensity, setTableDensity] = useState<"default" | "compact">("default");

  // Screen lock timeout
  const [lockTimeoutMinutes, setLockTimeoutMinutes] = useState<number>(5);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");

  // Sound notifications
  const [appointmentSound, setAppointmentSound] = useState(true);
  const [checkInSound, setCheckInSound] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDensity = localStorage.getItem("admin_table_density") as "default" | "compact" | null;
      if (savedDensity) setTableDensity(savedDensity);

      const savedTimeout = localStorage.getItem("admin_lock_timeout");
      if (savedTimeout) setLockTimeoutMinutes(Number(savedTimeout));

      const savedApptSound = localStorage.getItem("admin_appt_sound");
      if (savedApptSound !== null) setAppointmentSound(savedApptSound === "true");

      const savedCheckInSound = localStorage.getItem("admin_checkin_sound");
      if (savedCheckInSound !== null) setCheckInSound(savedCheckInSound === "true");
    }
  }, []);

  const handleSavePreferences = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_table_density", tableDensity);
      localStorage.setItem("admin_lock_timeout", lockTimeoutMinutes.toString());
      localStorage.setItem("admin_appt_sound", appointmentSound.toString());
      localStorage.setItem("admin_checkin_sound", checkInSound.toString());
    }
    showToast("Đã lưu thiết lập tùy chọn thành công.", "success");
  };

  const handleManualLock = () => {
    setIsScreenLocked(true);
    setUnlockPassword("");
    setUnlockError("");
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockPassword.trim()) {
      setUnlockError("Vui lòng nhập mật khẩu xác nhận.");
      return;
    }
    // Simple unlock simulation
    setIsScreenLocked(false);
    setUnlockPassword("");
    setUnlockError("");
    showToast("Đã mở khóa màn hình làm việc.", "info");
  };

  return (
    <>
      <div className="space-y-6 max-w-4xl pb-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-[var(--text-sm)] text-[var(--color-text-muted)] flex items-center gap-2">
          <Link href="/dashboard" className="hover:text-[var(--color-text)] transition">
            Tổng quan
          </Link>
          <span>/</span>
          <span className="text-[var(--color-text)] font-medium">Thiết lập</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border)] pb-4">
          <div>
            <h1 className="text-[24px] font-semibold text-[var(--color-text)] leading-tight">
              Thiết lập hệ thống & Cá nhân
            </h1>
            <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-muted)]">
              Tùy chỉnh mật độ hiển thị bảng dữ liệu, cấu hình tự động khóa màn hình và thông báo làm việc.
            </p>
          </div>

          <button
            type="button"
            onClick={handleManualLock}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-sm)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer self-start sm:self-auto"
          >
            <Lock className="w-4 h-4 text-[var(--color-text-muted)]" />
            <span>Khóa màn hình ngay</span>
          </button>
        </div>

        {/* Section 1: Mật độ hiển thị bảng */}
        <div className="border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-surface)] p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border)]">
            <Sliders className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="text-[18px] font-semibold text-[var(--color-text)]">
              Mật độ hiển thị Bảng dữ liệu (DataTable)
            </h2>
          </div>

          <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">
            Chiều cao hàng hiển thị trong các danh sách bệnh nhân, bác sĩ và lịch hẹn theo quy tắc UI quản lý.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <label
              className={`flex items-start gap-3 p-3.5 rounded-[var(--radius)] border text-left transition cursor-pointer ${
                tableDensity === "default"
                  ? "border-[var(--color-primary)] bg-[var(--status-info-bg)]"
                  : "border-[var(--color-border)] hover:bg-[var(--color-bg)]"
              }`}
            >
              <input
                type="radio"
                name="tableDensity"
                checked={tableDensity === "default"}
                onChange={() => setTableDensity("default")}
                className="mt-1 w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-focus)] cursor-pointer"
              />
              <div>
                <p className="text-[var(--text-sm)] font-semibold text-[var(--color-text)]">
                  Tiêu chuẩn (48px)
                </p>
                <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] mt-0.5">
                  Khoảng cách thoáng, đọc nhanh, thích hợp cho màn hình tiêu chuẩn và tablet.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3.5 rounded-[var(--radius)] border text-left transition cursor-pointer ${
                tableDensity === "compact"
                  ? "border-[var(--color-primary)] bg-[var(--status-info-bg)]"
                  : "border-[var(--color-border)] hover:bg-[var(--color-bg)]"
              }`}
            >
              <input
                type="radio"
                name="tableDensity"
                checked={tableDensity === "compact"}
                onChange={() => setTableDensity("compact")}
                className="mt-1 w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-focus)] cursor-pointer"
              />
              <div>
                <p className="text-[var(--text-sm)] font-semibold text-[var(--color-text)]">
                  Gọn (36px)
                </p>
                <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] mt-0.5">
                  Mật độ cao, hiển thị tối đa số dòng dữ liệu trên một trang mà không cần cuộn.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Section 2: Khóa màn hình & Bảo mật tại quầy */}
        <div className="border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-surface)] p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border)]">
            <Shield className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="text-[18px] font-semibold text-[var(--color-text)]">
              Bảo mật dữ liệu & Tự động khóa màn hình
            </h2>
          </div>

          <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">
            Bảo vệ thông tin sức khỏe bệnh nhân khi nhân viên rời khỏi quầy lễ tân hoặc vị trí làm việc.
          </p>

          <div className="max-w-md space-y-2">
            <label htmlFor="lock-timeout" className="block text-[var(--text-sm)] font-medium text-[var(--color-text)]">
              Thời gian tự động khóa sau khi không thao tác:
            </label>
            <select
              id="lock-timeout"
              value={lockTimeoutMinutes}
              onChange={(e) => setLockTimeoutMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] cursor-pointer"
            >
              <option value={3}>3 phút không thao tác</option>
              <option value={5}>5 phút không thao tác (Khuyến nghị)</option>
              <option value={10}>10 phút không thao tác</option>
              <option value={15}>15 phút không thao tác</option>
            </select>
          </div>

          {/* User Session Info Card */}
          <div className="mt-4 p-4 rounded-[var(--radius)] bg-[var(--color-bg)] border border-[var(--color-border)] space-y-2 text-[var(--text-sm)]">
            <p className="font-semibold text-[var(--color-text)]">Phiên làm việc hiện tại</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[var(--color-text-muted)] text-[var(--text-xs)]">
              <div>
                Tài khoản: <span className="font-medium text-[var(--color-text)]">{user?.fullName || "—"}</span>
              </div>
              <div>
                Email: <span className="font-medium text-[var(--color-text)]">{user?.email || "—"}</span>
              </div>
              <div>
                Vai trò: <span className="font-medium text-[var(--color-text)]">{user?.roles?.join(", ") || "Staff"}</span>
              </div>
              <div>
                Cơ sở ID: <span className="font-mono text-[var(--color-text)]">{user?.activeClinicId || "Chưa gắn"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Cấu hình Âm thanh Thông báo */}
        <div className="border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-surface)] p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border)]">
            <Bell className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="text-[18px] font-semibold text-[var(--color-text)]">
              Thông báo âm thanh vận hành
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)]">
              <div>
                <p className="text-[var(--text-sm)] font-medium text-[var(--color-text)]">
                  Lịch hẹn mới đặt trực tuyến
                </p>
                <p className="text-[var(--text-xs)] text-[var(--color-text-muted)]">
                  Phát âm thanh thông báo khi bệnh nhân đặt lịch hẹn khám thành công trên cổng Portal.
                </p>
              </div>
              <input
                type="checkbox"
                checked={appointmentSound}
                onChange={(e) => setAppointmentSound(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-focus)] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)]">
              <div>
                <p className="text-[var(--text-sm)] font-medium text-[var(--color-text)]">
                  Bệnh nhân check-in tại quầy
                </p>
                <p className="text-[var(--text-xs)] text-[var(--color-text-muted)]">
                  Báo chuông khi lễ tân quét mã tiếp nhận bệnh nhân vào phòng chờ.
                </p>
              </div>
              <input
                type="checkbox"
                checked={checkInSound}
                onChange={(e) => setCheckInSound(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-focus)] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSavePreferences}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu tất cả thiết lập</span>
          </button>
        </div>
      </div>

      {/* Screen Lock Overlay Modal as per ADMIN_UI_RULES.md mục 8 */}
      {isScreenLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] shadow-[var(--shadow-overlay)] p-6 space-y-4 text-center">
            <div className="mx-auto inline-flex p-3 rounded-[var(--radius)] bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-[18px] font-semibold text-[var(--color-text)]">
                Màn hình đang khóa
              </h2>
              <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] mt-1">
                Nội dung làm việc đã được bảo vệ. Vui lòng nhập mật khẩu tài khoản {user?.fullName || "của bạn"} để tiếp tục.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-3 text-left">
              <input
                type="password"
                placeholder="Nhập mật khẩu xác nhận..."
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                className="w-full px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
              />

              {unlockError && (
                <p className="text-[var(--text-xs)] text-[var(--color-danger)] font-medium">
                  {unlockError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
              >
                Mở khóa làm việc
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
