"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { clinicService } from "@/services/clinic-service";
import type { Clinic } from "@/types/clinic";
import { Building2, ChevronDown, Check, Loader2, Lock, ShieldAlert } from "lucide-react";
import clsx from "clsx";

interface ClinicSwitcherProps {
  className?: string;
}

export function ClinicSwitcher({ className }: ClinicSwitcherProps) {
  const { user, switchClinic } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Phân biệt 2 cấp Admin:
  // 1. SuperAdmin (Quản trị toàn chuỗi): Được phép chuyển đổi giữa các phòng khám
  // 2. ClinicAdmin (Quản trị 1 chi nhánh): Cố định tại 1 chi nhánh được phân công, không được switch
  const isSuperAdmin = Boolean(
    user?.roles?.some((r) => r.toLowerCase() === "superadmin")
  );
  const isClinicAdmin = Boolean(
    user?.roles?.some((r) => r.toLowerCase() === "clinicadmin" || r.toLowerCase() === "branchadmin" || r.toLowerCase() === "manager")
  );

  const userId = user?.id;
  useEffect(() => {
    if (!userId) {
      setClinics([]);
      return;
    }

    let isMounted = true;
    setIsLoadingClinics(true);
    clinicService.getClinics({ pageSize: 50 })
      .then((res) => {
        if (isMounted) setClinics(res.items);
      })
      .catch(() => {
        if (isMounted) setClinics([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingClinics(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId, isOpen]);

  // Xử lý click ra ngoài để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Tìm chi nhánh hiện tại
  const currentClinic = clinics.find((c) => c.id === user?.activeClinicId);

  const handleSelectClinic = async (clinicId: string) => {
    if (clinicId === user?.activeClinicId || isSwitching) return;
    try {
      setIsSwitching(true);
      await switchClinic(clinicId);
      setIsOpen(false);
      // Reload trang để các module đồng bộ lại context mới
      window.location.reload();
    } catch (err) {
      console.error("Failed to switch clinic:", err);
      setIsSwitching(false);
    }
  };

  // TRƯỜNG HỢP 1: CLINIC ADMIN (Quản lý 1 chi nhánh) hoặc NHÂN VIÊN CƠ SỞ
  // => Khóa cố định tại chi nhánh được gán, KHÔNG cho phép chuyển sang chi nhánh khác
  if (!isSuperAdmin) {
    return (
      <div
        className={clsx(
          "inline-flex items-center gap-2.5 px-3 py-1.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] select-none",
          className
        )}
        title={
          isClinicAdmin
            ? "Tài khoản Quản trị Chi nhánh: Cố định tại cơ sở được phân công."
            : "Cơ sở làm việc được phân công."
        }
      >
        <div className="w-7 h-7 rounded bg-[var(--status-neutral-bg)] flex items-center justify-center text-[var(--color-text-muted)] shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-table)] font-semibold leading-tight line-clamp-1 max-w-[190px]">
              {currentClinic?.name || "Chi nhánh được gán"}
            </span>
            <Lock className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" aria-label="Cố định" />
          </div>
          <span className="text-[var(--text-xs)] text-[var(--color-text-muted)]">
            {isClinicAdmin ? "Quản lý 1 Chi nhánh" : "Cơ sở trực thuộc"}
          </span>
        </div>
      </div>
    );
  }

  // TRƯỜNG HỢP 2: SUPERADMIN (Quản trị toàn bộ chi nhánh)
  // => Cho phép bấm Dropdown chuyển đổi linh hoạt giữa các phòng khám trong chuỗi
  return (
    <div ref={dropdownRef} className={clsx("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] text-[var(--color-text)] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="w-7 h-7 rounded bg-[var(--status-info-bg)] flex items-center justify-center text-[var(--status-info-fg)] shrink-0">
          {isSwitching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[var(--text-table)] font-semibold leading-tight line-clamp-1 max-w-[210px]">
            {currentClinic?.name || (isLoadingClinics ? "Đang tải..." : "Chọn chi nhánh")}
          </span>
          <span className="text-[var(--text-xs)] text-[var(--color-primary)] font-medium">
            Toàn hệ thống chuỗi ▼
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] ml-1 shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 rounded-[var(--radius)] bg-white bg-[var(--color-surface)] border border-slate-200 border-[var(--color-border)] shadow-2xl z-50 py-1.5 focus:outline-none">
          <div className="px-3.5 py-2 border-b border-slate-200 border-[var(--color-border)] bg-slate-50 bg-[var(--color-bg)] flex items-center justify-between">
            <span className="text-[var(--text-xs)] font-semibold text-slate-800 text-[var(--color-text)] uppercase tracking-wider">
              Chuyển đổi phòng khám
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              SuperAdmin
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1 bg-white bg-[var(--color-surface)]">
            {clinics.map((clinic) => {
              const isSelected = clinic.id === user?.activeClinicId;
              return (
                <button
                  key={clinic.id}
                  type="button"
                  onClick={() => handleSelectClinic(clinic.id)}
                  disabled={isSwitching}
                  className={clsx(
                    "w-full px-3.5 py-2.5 text-left flex items-start justify-between gap-2 hover:bg-slate-50 hover:bg-[var(--color-bg)] transition cursor-pointer",
                    isSelected ? "bg-blue-50 bg-[var(--status-info-bg)]" : "bg-white"
                  )}
                >
                  <div className="flex flex-col">
                    <span
                      className={clsx(
                        "text-[var(--text-table)] font-medium",
                        isSelected ? "text-blue-900 text-[var(--status-info-fg)] font-semibold" : "text-slate-900 text-[var(--color-text)]"
                      )}
                    >
                      {clinic.name}
                    </span>
                    <span className="text-[var(--text-xs)] text-slate-500 text-[var(--color-text-muted)] line-clamp-1">
                      {clinic.address}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-700 text-[var(--status-info-fg)] shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          <div className="px-3.5 py-2 border-t border-slate-200 border-[var(--color-border)] bg-slate-50 bg-[var(--color-bg)] text-[11px] text-slate-600 text-[var(--color-text-muted)] flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Chỉ SuperAdmin mới được xem và chuyển đổi giữa các cơ sở.</span>
          </div>
        </div>
      )}
    </div>
  );
}
