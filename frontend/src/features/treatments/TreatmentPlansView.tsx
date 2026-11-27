"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { treatmentPlanService } from "@/services/treatment-plan-service";
import { doctorService } from "@/services/doctor-service";
import { patientService } from "@/services/patient-service";
import type { TreatmentPlan } from "@/types/treatment-plan";
import type { PatientListItem } from "@/types/patient";
import type { Doctor } from "@/types/doctor";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusTag } from "@/components/ui/status-tag";
import { CreateTreatmentPlanDrawer } from "@/components/treatments/create-treatment-plan-drawer";
import { TreatmentStepsManager } from "@/components/treatments/treatment-steps-manager";
import { Plus, ClipboardList, User, Layers } from "lucide-react";

export function TreatmentPlansView() {
  const { user } = useAuth();
  const clinicId = user?.activeClinicId;

  if (!clinicId) {
    return <p className="text-sm text-slate-600">Chọn phòng khám ở thanh điều hướng để xem phác đồ điều trị.</p>;
  }

  return <ClinicTreatmentPlansView key={clinicId} />;
}

function ClinicTreatmentPlansView() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activePlanForSteps, setActivePlanForSteps] = useState<TreatmentPlan | null>(null);

  // Load danh sách bệnh nhân và bác sĩ ban đầu
  useEffect(() => {
    async function loadInitData() {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          patientService.getPage(1, 50),
          doctorService.getDoctors({ pageSize: 50 })
        ]);
        if (patientsRes?.items && patientsRes.items.length > 0) {
          setPatients(patientsRes.items);
          setSelectedPatientId(patientsRes.items[0].id);
        }
        if (doctorsRes?.items) {
          setDoctors(doctorsRes.items);
        }
      } catch (err) {
        console.error("Lỗi tải danh sách ban đầu:", err);
      }
    }
    loadInitData();
  }, []);

  // Load danh sách phác đồ khi chọn bệnh nhân
  const loadPlans = useCallback(async () => {
    if (!selectedPatientId) return;
    setLoading(true);
    try {
      const data = await treatmentPlanService.getByPatientId(selectedPatientId);
      setPlans(data || []);
    } catch (err) {
      console.error("Lỗi tải phác đồ điều trị:", err);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const getDoctorName = (doctorId?: string | null) => {
    if (!doctorId) return "Chưa chỉ định";
    const doc = doctors.find((d) => d.id === doctorId);
    return doc ? (doc.doctorName || doc.email || "Bác sĩ") : doctorId;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "InProgress":
        return { label: "Đang điều trị", variant: "info" as const };
      case "Completed":
        return { label: "Hoàn thành", variant: "success" as const };
      case "Paused":
        return { label: "Tạm dừng", variant: "warning" as const };
      case "Cancelled":
        return { label: "Đã hủy", variant: "danger" as const };
      default:
        return { label: status, variant: "neutral" as const };
    }
  };

  const columns: Column<TreatmentPlan>[] = [
    {
      key: "name",
      header: "Tên phác đồ điều trị",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">{row.name}</div>
          {row.notes && <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.notes}</div>}
        </div>
      )
    },
    {
      key: "doctorId",
      header: "Bác sĩ phụ trách",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span>{getDoctorName(row.doctorId)}</span>
        </div>
      )
    },
    {
      key: "estimatedCost",
      header: "Chi phí dự kiến",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {row.estimatedCost.toLocaleString("vi-VN")} đ
        </span>
      )
    },
    {
      key: "startDate",
      header: "Thời gian dự kiến",
      render: (row) => (
        <div className="text-xs text-slate-600">
          <div>Từ: {new Date(row.startDate).toLocaleDateString("vi-VN")}</div>
          {row.endDate && <div>Đến: {new Date(row.endDate).toLocaleDateString("vi-VN")}</div>}
        </div>
      )
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => {
        const { label, variant } = getStatusVariant(row.status);
        return <StatusTag variant={variant}>{label}</StatusTag>;
      }
    },
    {
      key: "actions",
      header: "Giai đoạn & Tiến trình",
      render: (row) => (
        <button
          onClick={() => setActivePlanForSteps(row)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition shadow-2xs"
        >
          <Layers className="h-3.5 w-3.5 text-blue-600" />
          Xem Giai Đoạn (Kanban/Timeline)
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            Quản Lý Phác Đồ Điều Trị Dài Hạn
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lập kế hoạch phác đồ, theo dõi chi phí dự kiến và tiến độ điều trị theo từng hồ sơ bệnh nhân.
          </p>
        </div>

        <button
          onClick={() => setIsDrawerOpen(true)}
          disabled={!selectedPatientId}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <Plus className="h-4 w-4" />
          Tạo Phác Đồ Mới
        </button>
      </div>

      {/* Patient Selector Filter */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Chọn Hồ Sơ Bệnh Nhân:
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full sm:max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none"
          >
            {patients.length === 0 ? (
              <option value="">Không có bệnh nhân nào</option>
            ) : (
              patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.patientCode ? `[${p.patientCode}] ` : ""}{p.fullName} {p.phoneNumber ? `(${p.phoneNumber})` : ""}
                </option>
              ))
            )}
          </select>

          {selectedPatient && (
            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span>Mã BN: <strong className="text-slate-800">{selectedPatient.patientCode || "N/A"}</strong></span>
              <span>SĐT: <strong className="text-slate-800">{selectedPatient.phoneNumber || "Chưa có"}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
        <DataTable
          columns={columns}
          data={plans}
          isLoading={loading}
          keyExtractor={(row) => row.id}
          emptyTitle="Chưa có phác đồ điều trị"
          emptyDescription="Bệnh nhân này chưa có phác đồ điều trị dài hạn nào. Hãy tạo mới phác đồ đầu tiên!"
        />
      </div>

      {/* Drawer Create Form */}
      {selectedPatientId && (
        <CreateTreatmentPlanDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          patientId={selectedPatientId}
          patientName={selectedPatient?.fullName}
          doctors={doctors}
          onSuccess={loadPlans}
        />
      )}

      {/* Modal Quản lý Hạng mục & Giai đoạn Điều trị (Kanban / Timeline) */}
      {activePlanForSteps && (
        <TreatmentStepsManager
          plan={activePlanForSteps}
          doctors={doctors}
          onClose={() => setActivePlanForSteps(null)}
        />
      )}
    </div>
  );
}
