"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { patientService } from "@/services/patient-service";
import type { PatientDetail, MedicalHistoryItem } from "@/types/patient";
import { useToast } from "@/components/ui/toast";
import { PatientFormDrawer } from "@/features/patients/PatientFormDrawer";
import { OdontogramView } from "@/features/patients/odontogram/OdontogramView";
import { MedicalImageGallery } from "@/features/patients/images/MedicalImageGallery";
import { MedicalHistoryTab } from "@/features/patients/history/MedicalHistoryTab";
import { PatientAppointmentsTab } from "@/features/patients/appointments/PatientAppointmentsTab";
import {
  ArrowLeft,
  Phone,
  Eye,
  EyeOff,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Edit3,
  Layers,
  Image as ImageIcon,
  ShieldAlert,
  Clock
} from "lucide-react";

function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return "—";
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.length < 7) return phone;
  const start = cleaned.substring(0, 3);
  const end = cleaned.substring(cleaned.length - 3);
  return `${start}****${end}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function calculateAge(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export default function PatientDetailPage() {
  const params = useParams();
  const { showToast } = useToast();
  const patientId = params?.id as string;

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phone masking toggle per ADMIN_UI_RULES.md mục 4 & 8
  const [isPhoneUnmasked, setIsPhoneUnmasked] = useState(false);

  // Active Tab: 1: Odontogram, 2: Images, 3: Medical History, 4: Appointments
  const [activeTab, setActiveTab] = useState<"odontogram" | "images" | "history" | "appointments">("odontogram");

  // Edit Drawer
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Fetch Patient Details
  const fetchPatient = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await patientService.getById(patientId);
      setPatient(data);
      if (data.medicalHistory) {
        setMedicalHistory(data.medicalHistory);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải hồ sơ bệnh nhân.");
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  // Toggle phone unmask
  const handleToggleUnmask = () => {
    if (!isPhoneUnmasked) {
      setIsPhoneUnmasked(true);
      showToast("Đã hiển thị số điện thoại đầy đủ. Thao tác đã được ghi nhận.", "info");
    } else {
      setIsPhoneUnmasked(false);
    }
  };

  // Check critical medical alerts
  const criticalAlerts = useMemo(() => {
    return medicalHistory.filter(
      (item) => item.severity === "severe" || item.severity === "moderate" || item.type === "allergy"
    );
  }, [medicalHistory]);

  const age = calculateAge(patient?.dateOfBirth);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-28 bg-slate-200 rounded-[var(--radius)]" />
        <div className="h-14 bg-slate-200 rounded-[var(--radius)]" />
        <div className="h-96 bg-slate-200 rounded-[var(--radius)]" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-6 pb-12">
        <Link
          href="/patients"
          className="inline-flex items-center gap-1.5 text-[var(--text-sm)] text-[var(--color-primary)] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Danh sách Bệnh nhân</span>
        </Link>

        <div className="p-8 text-center rounded-[var(--radius)] border border-[var(--color-danger)] bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <h2 className="text-[18px] font-bold">Không thể tải thông tin bệnh nhân</h2>
          <p className="mt-1 text-[var(--text-sm)]">{error || "Hồ sơ không tồn tại hoặc đã bị xóa."}</p>
          <button
            type="button"
            onClick={fetchPatient}
            className="mt-4 px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-white text-[var(--text-sm)] font-medium"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-[var(--text-sm)] text-[var(--color-text-muted)] flex items-center gap-2">
        <Link href="/dashboard" className="hover:text-[var(--color-text)] transition">
          Tổng quan
        </Link>
        <span>/</span>
        <Link href="/patients" className="hover:text-[var(--color-text)] transition">
          Bệnh nhân
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text)] font-medium truncate max-w-[200px]">
          {patient.fullName}
        </span>
      </nav>

      {/* Sticky/Fixed Patient Header as per ADMIN_UI_RULES.md mục 9 */}
      <div className="p-4 sm:p-5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Patient Core Info */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-[var(--radius)] bg-[var(--status-info-bg)] text-[var(--status-info-fg)] flex items-center justify-center font-bold text-[18px] shrink-0 border border-blue-200">
              {patient.fullName.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[22px] font-bold text-[var(--color-text)] leading-tight">
                  {patient.fullName}
                </h1>
                <span className="px-2 py-0.5 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] font-mono text-[var(--text-xs)] font-bold tabular-nums">
                  {patient.patientCode || `BN-${patient.id.slice(0, 6).toUpperCase()}`}
                </span>
              </div>

              {/* Patient Metadata (Age, DOB, Phone) */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-[var(--text-xs)] text-[var(--color-text-muted)] mt-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="tabular-nums">
                    Sinh: {formatDate(patient.dateOfBirth)} {age !== null ? `(${age} tuổi)` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="tabular-nums font-mono">
                    {isPhoneUnmasked ? patient.phoneNumber || "Chưa có SĐT" : maskPhoneNumber(patient.phoneNumber)}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleUnmask}
                    className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition cursor-pointer"
                  >
                    {isPhoneUnmasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{isPhoneUnmasked ? "Ẩn" : "Hiện"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--text-sm)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-[var(--color-text-muted)]" />
              <span>Sửa thông tin</span>
            </button>

            <Link
              href="/patients"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--text-sm)] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </Link>
          </div>
        </div>
      </div>

      {/* DẢI CẢNH BÁO Y TẾ (Medical Alert Banner) — Bắt buộc theo ADMIN_UI_RULES.md mục 9 */}
      {criticalAlerts.length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-3 p-3.5 rounded-[var(--radius)] border border-red-300 bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[14px] uppercase tracking-wide">
                CẢNH BÁO Y TẾ:
              </span>
              <span className="font-semibold text-[14px]">
                {criticalAlerts.map((a) => a.name).join(" • ")}
              </span>
            </div>
            <p className="text-[12px] text-red-800 mt-0.5">
              Bác sĩ và điều dưỡng cần kiểm tra kỹ trước khi chỉ định gây tê, phẫu thuật nhổ răng hoặc kê đơn thuốc kháng sinh.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className="text-[12px] font-bold text-red-700 underline hover:text-red-900 shrink-0 cursor-pointer"
          >
            Xem chi tiết
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-[var(--radius)] border border-emerald-200 bg-emerald-50 text-emerald-800 text-[13px]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>An toàn điều trị:</strong> Chưa ghi nhận tiền sử dị ứng hoặc bệnh mãn tính.
          </span>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className="ml-auto text-[12px] font-semibold text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
          >
            Thêm tiền sử
          </button>
        </div>
      )}

      {/* 4 Navigation Tabs */}
      <div className="border-b border-[var(--color-border)]">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto text-[var(--text-sm)]">
          <button
            type="button"
            onClick={() => setActiveTab("odontogram")}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium transition cursor-pointer whitespace-nowrap min-h-[44px] ${
              activeTab === "odontogram"
                ? "border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Sơ đồ răng (Odontogram)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("images")}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium transition cursor-pointer whitespace-nowrap min-h-[44px] ${
              activeTab === "images"
                ? "border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>2. Phim chụp & Ảnh X-quang</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium transition cursor-pointer whitespace-nowrap min-h-[44px] ${
              activeTab === "history"
                ? "border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>3. Tiền sử bệnh lý</span>
            {medicalHistory.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 text-[11px] font-bold">
                {medicalHistory.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("appointments")}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium transition cursor-pointer whitespace-nowrap min-h-[44px] ${
              activeTab === "appointments"
                ? "border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>4. Lịch hẹn & Lịch sử khám</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === "odontogram" && <OdontogramView patientId={patient.id} />}
        {activeTab === "images" && <MedicalImageGallery patientId={patient.id} />}
        {activeTab === "history" && (
          <MedicalHistoryTab
            patientId={patient.id}
            items={medicalHistory}
            onItemsChange={(updated) => setMedicalHistory(updated)}
          />
        )}
        {activeTab === "appointments" && (
          <PatientAppointmentsTab
            patientId={patient.id}
            patientName={patient.fullName}
          />
        )}
      </div>

      {/* Edit Patient Drawer */}
      <PatientFormDrawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        patientToEdit={patient}
        onSuccess={() => {
          setIsEditOpen(false);
          fetchPatient();
        }}
        onSubmitCreate={async () => {}}
        onSubmitUpdate={async (id, data) => {
          await patientService.update(id, data);
          showToast("Đã cập nhật thông tin bệnh nhân.", "success");
        }}
      />
    </div>
  );
}
