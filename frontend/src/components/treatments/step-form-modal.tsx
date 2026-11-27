"use client";

import React, { useState, useEffect } from "react";
import type { TreatmentStep, CreateTreatmentStepRequest, UpdateTreatmentStepRequest } from "@/types/treatment-step";
import type { DentalService } from "@/types/service";
import type { Doctor } from "@/types/doctor";
import { X, Check } from "lucide-react";

interface StepFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTreatmentStepRequest | UpdateTreatmentStepRequest) => Promise<void>;
  initialStep?: TreatmentStep | null;
  services: DentalService[];
  doctors: Doctor[];
  nextOrderIndex?: number;
}

export function StepFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialStep,
  services,
  doctors,
  nextOrderIndex = 0
}: StepFormModalProps) {
  const [stepName, setStepName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [toothNumber, setToothNumber] = useState("");
  const [cost, setCost] = useState<number>(0);
  const [orderIndex, setOrderIndex] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialStep) {
      setStepName(initialStep.stepName);
      setServiceId(initialStep.serviceId || "");
      setDoctorId(initialStep.doctorId || "");
      setToothNumber(initialStep.toothNumber || "");
      setCost(initialStep.cost || 0);
      setOrderIndex(initialStep.orderIndex || 0);
      setNotes(initialStep.notes || "");
    } else {
      setStepName("");
      setServiceId("");
      setDoctorId("");
      setToothNumber("");
      setCost(0);
      setOrderIndex(nextOrderIndex);
      setNotes("");
    }
    setError(null);
  }, [initialStep, nextOrderIndex, isOpen]);

  // Tự động điền tên và giá nếu chọn dịch vụ
  const handleServiceChange = (id: string) => {
    setServiceId(id);
    const selected = services.find((s) => s.id === id);
    if (selected) {
      if (!stepName) setStepName(selected.name);
      if (cost === 0) setCost(selected.unitPrice || 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepName.trim()) {
      setError("Vui lòng nhập tên hạng mục điều trị.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        stepName: stepName.trim(),
        serviceId: serviceId || null,
        doctorId: doctorId || null,
        toothNumber: toothNumber.trim() || null,
        cost: Number(cost) || 0,
        orderIndex: Number(orderIndex) || 0,
        notes: notes.trim() || null
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu hạng mục.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-slate-900">
            {initialStep ? "Chỉnh Sửa Hạng Mục Điều Trị" : "Thêm Hạng Mục / Giai Đoạn Mới"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Liên kết dịch vụ (Tùy chọn)
            </label>
            <select
              value={serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Chọn dịch vụ có sẵn --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.unitPrice.toLocaleString("vi-VN")} đ)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên hạng mục điều trị <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Cạo vôi răng, Nhổ răng khôn số 8, Gắn mắc cài..."
              value={stepName}
              onChange={(e) => setStepName(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bác sĩ phụ trách
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Chọn bác sĩ --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.doctorName || d.email || "Bác sĩ"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vị trí răng
              </label>
              <input
                type="text"
                placeholder="VD: 18, 28, Hàm trên, Toàn hàm..."
                value={toothNumber}
                onChange={(e) => setToothNumber(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chi phí hạng mục (đ)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thứ tự giai đoạn (Order)
              </label>
              <input
                type="number"
                min="0"
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú lâm sàng / Hướng dẫn
            </label>
            <textarea
              rows={2}
              placeholder="VD: Bệnh nhân ê buốt nhẹ, tái khám sau 2 tuần..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <Check className="h-4 w-4" />
              {submitting ? "Đang lưu..." : initialStep ? "Cập Nhật" : "Thêm Hạng Mục"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
