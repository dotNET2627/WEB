"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { TreatmentPlan } from "@/types/treatment-plan";
import type {
  TreatmentStep,
  TreatmentStepStatus,
  CreateTreatmentStepRequest,
  UpdateTreatmentStepRequest
} from "@/types/treatment-step";
import type { DentalService } from "@/types/service";
import type { Doctor } from "@/types/doctor";
import { treatmentStepService } from "@/services/treatment-step-service";
import { dentalServiceApi } from "@/services/dental-service";
import { StepFormModal } from "./step-form-modal";
import {
  Kanban,
  GitCommit,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Circle,
  User,
  Sparkles,
  Layers,
  X
} from "lucide-react";

interface TreatmentStepsManagerProps {
  plan: TreatmentPlan;
  doctors: Doctor[];
  onClose: () => void;
}

const STATUS_COLUMNS: {
  status: TreatmentStepStatus;
  title: string;
  badgeClass: string;
  dotColor: string;
}[] = [
  {
    status: "NotStarted",
    title: "Chưa làm",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
    dotColor: "bg-slate-400"
  },
  {
    status: "InProgress",
    title: "Đang làm",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-300",
    dotColor: "bg-amber-500"
  },
  {
    status: "Completed",
    title: "Hoàn thành",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300",
    dotColor: "bg-emerald-500"
  }
];

export function TreatmentStepsManager({ plan, doctors, onClose }: TreatmentStepsManagerProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "timeline">("kanban");
  const [steps, setSteps] = useState<TreatmentStep[]>([]);
  const [services, setServices] = useState<DentalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<TreatmentStep | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stepsRes, servicesRes] = await Promise.all([
        treatmentStepService.getByPlanId(plan.id),
        dentalServiceApi.getActiveServices().catch(() => [])
      ]);
      setSteps(stepsRes.data || []);
      setServices(servicesRes || []);
    } catch (err) {
      console.error("Lỗi tải danh sách giai đoạn điều trị:", err);
    } finally {
      setLoading(false);
    }
  }, [plan.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateOrUpdate = async (
    payload: CreateTreatmentStepRequest | UpdateTreatmentStepRequest
  ) => {
    if (editingStep) {
      await treatmentStepService.update(plan.id, editingStep.id, payload as UpdateTreatmentStepRequest);
    } else {
      await treatmentStepService.create(plan.id, payload as CreateTreatmentStepRequest);
    }
    await loadData();
  };

  const handleChangeStatus = async (stepId: string, newStatus: TreatmentStepStatus) => {
    // Optimistic update
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, status: newStatus } : s))
    );
    try {
      await treatmentStepService.changeStatus(plan.id, stepId, newStatus);
      await loadData();
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      loadData();
    }
  };

  const handleDelete = async (stepId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa hạng mục điều trị này không?")) return;
    try {
      await treatmentStepService.delete(plan.id, stepId);
      await loadData();
    } catch (err) {
      console.error("Lỗi xóa hạng mục:", err);
    }
  };

  const getDoctorName = (doctorId?: string | null) => {
    if (!doctorId) return "Chưa chỉ định";
    const doc = doctors.find((d) => d.id === doctorId);
    return doc ? (doc.doctorName || doc.email || "Bác sĩ") : "Bác sĩ";
  };

  const getServiceName = (serviceId?: string | null) => {
    if (!serviceId) return null;
    const s = services.find((srv) => srv.id === serviceId);
    return s ? s.name : null;
  };

  // Tính toán tổng số bước hoàn thành
  const completedCount = steps.filter((s) => s.status === "Completed").length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
  const totalCost = steps.reduce((sum, s) => sum + (s.cost || 0), 0);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-2 sm:p-6 backdrop-blur-xs">
      <div className="flex h-full max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] px-6 py-4 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
                Phác đồ
              </span>
              <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
              <span>Tiến độ: <strong className="text-blue-600">{completedCount}/{steps.length} bước ({progressPercent}%)</strong></span>
              <span>Tổng chi phí giai đoạn: <strong className="text-slate-800">{totalCost.toLocaleString("vi-VN")} đ</strong></span>
              <span>Dự kiến: <strong className="text-slate-800">{plan.estimatedCost.toLocaleString("vi-VN")} đ</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* View Switcher Toggle */}
            <div className="flex rounded-lg border border-[var(--border)] bg-white p-1 shadow-xs">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === "kanban"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Kanban className="h-3.5 w-3.5" />
                Kanban
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === "timeline"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <GitCommit className="h-3.5 w-3.5" />
                Timeline
              </button>
            </div>

            <button
              onClick={() => {
                setEditingStep(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              Thêm Giai Đoạn
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="rounded-full bg-blue-50 p-4 text-blue-600 mb-3">
                <Layers className="h-8 w-8" />
              </div>
              <p className="font-medium text-slate-800">Chưa có hạng mục / giai đoạn điều trị nào</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Bấm vào nút &quot;Thêm Giai Đoạn&quot; để bắt đầu xây dựng từng bước điều trị cho phác đồ này.
              </p>
            </div>
          ) : viewMode === "kanban" ? (
            /* KANBAN VIEW */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
              {STATUS_COLUMNS.map((col) => {
                const columnSteps = steps.filter((s) => s.status === col.status);
                return (
                  <div
                    key={col.status}
                    className="flex flex-col rounded-xl border border-[var(--border)] bg-slate-100/60 p-4 min-h-[480px]"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                        <span className="font-bold text-sm text-slate-800">{col.title}</span>
                      </div>
                      <span className="rounded-full bg-white border border-[var(--border)] px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {columnSteps.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {columnSteps.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">
                          Chưa có hạng mục ở cột này
                        </div>
                      ) : (
                        columnSteps.map((step) => {
                          const serviceTitle = getServiceName(step.serviceId);
                          return (
                            <div
                              key={step.id}
                              className="group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs hover:shadow-md transition space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition">
                                  {step.stepName}
                                </h3>
                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                                  <button
                                    onClick={() => {
                                      setEditingStep(step);
                                      setIsModalOpen(true);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                                    title="Sửa"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(step.id)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    title="Xóa"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {serviceTitle && (
                                <div className="text-xs text-blue-600 font-medium bg-blue-50/70 rounded px-2 py-0.5 inline-block">
                                  {serviceTitle}
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                                <div>
                                  <span className="text-slate-400">Răng: </span>
                                  <span className="font-medium text-slate-800">
                                    {step.toothNumber ? `R${step.toothNumber}` : "Toàn hàm"}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-slate-900">
                                    {step.cost.toLocaleString("vi-VN")} đ
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <User className="h-3 w-3 text-slate-400" />
                                <span className="truncate">{getDoctorName(step.doctorId)}</span>
                              </div>

                              {step.notes && (
                                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 italic line-clamp-2">
                                  &quot;{step.notes}&quot;
                                </div>
                              )}

                              {/* Action Quick Move buttons */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                {col.status !== "NotStarted" ? (
                                  <button
                                    onClick={() =>
                                      handleChangeStatus(
                                        step.id,
                                        col.status === "Completed" ? "InProgress" : "NotStarted"
                                      )
                                    }
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800"
                                    title="Chuyển lùi giai đoạn"
                                  >
                                    <ArrowLeft className="h-3 w-3" />
                                    Lùi
                                  </button>
                                ) : (
                                  <div />
                                )}

                                {col.status !== "Completed" && (
                                  <button
                                    onClick={() =>
                                      handleChangeStatus(
                                        step.id,
                                        col.status === "NotStarted" ? "InProgress" : "Completed"
                                      )
                                    }
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                                    title="Chuyển tiếp giai đoạn"
                                  >
                                    {col.status === "NotStarted" ? "Bắt đầu làm" : "Hoàn thành"}
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TIMELINE VIEW */
            <div className="max-w-3xl mx-auto py-4">
              <div className="relative border-l-2 border-blue-200 ml-4 pl-6 space-y-8">
                {steps.map((step, idx) => {
                  const isDone = step.status === "Completed";
                  const isDoing = step.status === "InProgress";
                  return (
                    <div key={step.id} className="relative group">
                      {/* Step Indicator Dot */}
                      <span
                        className={`absolute -left-[35px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition shadow-xs ${
                          isDone
                            ? "bg-emerald-500 text-white"
                            : isDoing
                            ? "bg-amber-500 text-white ring-4 ring-amber-100"
                            : "bg-white border-2 border-slate-300 text-slate-500"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : isDoing ? (
                          <Clock className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          idx + 1
                        )}
                      </span>

                      {/* Card Content */}
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs hover:shadow-md transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-slate-900">{step.stepName}</h3>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  isDone
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : isDoing
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {isDone ? "Hoàn thành" : isDoing ? "Đang tiến hành" : "Chưa làm"}
                              </span>
                            </div>
                            {step.toothNumber && (
                              <div className="text-xs text-slate-500 mt-1">
                                Vị trí răng: <strong className="text-slate-700">{step.toothNumber}</strong>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingStep(step);
                                setIsModalOpen(true);
                              }}
                              className="rounded-lg border border-[var(--border)] p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(step.id)}
                              className="rounded-lg border border-[var(--border)] p-1.5 text-rose-500 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 mt-3">
                          <div>
                            <span className="text-slate-400">Bác sĩ: </span>
                            <span className="font-medium text-slate-800">{getDoctorName(step.doctorId)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Chi phí: </span>
                            <span className="font-semibold text-slate-900">
                              {step.cost.toLocaleString("vi-VN")} đ
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Trạng thái đổi: </span>
                            <select
                              value={step.status}
                              onChange={(e) =>
                                handleChangeStatus(step.id, e.target.value as TreatmentStepStatus)
                              }
                              className="ml-1 rounded border border-slate-200 px-2 py-0.5 text-xs font-medium focus:outline-none"
                            >
                              <option value="NotStarted">Chưa làm</option>
                              <option value="InProgress">Đang làm</option>
                              <option value="Completed">Hoàn thành</option>
                            </select>
                          </div>
                        </div>

                        {step.notes && (
                          <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-100">
                            <strong>Ghi chú:</strong> {step.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step Form Modal (Create / Edit) */}
      <StepFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialStep={editingStep}
        services={services}
        doctors={doctors}
        nextOrderIndex={steps.length}
      />
    </div>
  );
}
