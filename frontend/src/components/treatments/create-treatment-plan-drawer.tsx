"use client";

import React, { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { FormField } from "@/components/ui/form-field";
import { treatmentPlanService } from "@/services/treatment-plan-service";
import type { CreateTreatmentPlanRequest } from "@/types/treatment-plan";
import type { Doctor } from "@/types/doctor";
import { useToast } from "@/components/ui/toast";

interface CreateTreatmentPlanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
  doctors?: Doctor[];
  onSuccess: () => void;
}

export function CreateTreatmentPlanDrawer({
  isOpen,
  onClose,
  patientId,
  patientName,
  doctors = [],
  onSuccess
}: CreateTreatmentPlanDrawerProps) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    estimatedCost: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    doctorId: "",
    notes: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) {
      errs.name = "Vui lòng nhập tên phác đồ điều trị.";
    }
    const cost = Number(formData.estimatedCost);
    if (isNaN(cost) || cost < 0) {
      errs.estimatedCost = "Chi phí dự kiến phải là số lớn hơn hoặc bằng 0.";
    }
    if (!formData.startDate) {
      errs.startDate = "Vui lòng chọn ngày bắt đầu.";
    }
    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      errs.endDate = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: CreateTreatmentPlanRequest = {
        name: formData.name.trim(),
        estimatedCost: Number(formData.estimatedCost) || 0,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        doctorId: formData.doctorId ? formData.doctorId : null,
        notes: formData.notes.trim() || null
      };

      await treatmentPlanService.create(patientId, payload);
      showToast("Khởi tạo phác đồ điều trị thành công!", "success");
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        name: "",
        estimatedCost: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        doctorId: "",
        notes: ""
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tạo phác đồ.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo Phác Đồ Điều Trị Dài Hạn"
      description={`Khởi tạo kế hoạch điều trị cho bệnh nhân: ${patientName || "Đang chọn"}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <FormField label="Tên phác đồ điều trị" required error={errors.name}>
          <input
            type="text"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="VD: Niềng răng mắc cài kim loại, Trồng răng Implant..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </FormField>

        <FormField label="Bác sĩ phụ trách" hint="Tùy chọn">
          <select
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={formData.doctorId}
            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
          >
            <option value="">-- Chọn bác sĩ phụ trách --</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.doctorName || doc.email || "Bác sĩ"} ({doc.specialty || "Nha sĩ"})
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Chi phí dự kiến (VNĐ)" required error={errors.estimatedCost}>
          <input
            type="number"
            min="0"
            step="10000"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="VD: 25000000"
            value={formData.estimatedCost}
            onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Ngày bắt đầu" required error={errors.startDate}>
            <input
              type="date"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </FormField>

          <FormField label="Ngày kết thúc dự kiến" error={errors.endDate}>
            <input
              type="date"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </FormField>
        </div>

        <FormField label="Ghi chú & Lộ trình tổng quan" hint="Tùy chọn">
          <textarea
            rows={4}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Mô tả mục tiêu điều trị, tình trạng ban đầu, ghi chú lưu ý..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </FormField>

        <div className="mt-4 flex justify-end gap-3 border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Đang lưu..." : "Tạo phác đồ"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
