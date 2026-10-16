"use client";

import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import type { ToothCondition, ToothConditionType, ToothSurface } from "@/types/patient";

interface ToothModalProps {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: number | null;
  toothName: string;
  initialCondition?: ToothCondition | null;
  onSave: (toothNumber: number, data: { condition: ToothConditionType; surfaces: ToothSurface[]; notes: string }) => Promise<void>;
}

const CONDITION_OPTIONS: { type: ToothConditionType; label: string; description: string; badgeColor: string }[] = [
  { type: "healthy", label: "Khỏe mạnh", description: "Răng bình thường, chưa can thiệp", badgeColor: "bg-slate-100 text-slate-700" },
  { type: "caries", label: "Sâu răng", description: "Tổn thương mất mô khoáng men/ngà", badgeColor: "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]" },
  { type: "filled", label: "Đã trám", description: "Đã phục hồi bằng Composite hoặc GIC", badgeColor: "bg-[var(--status-info-bg)] text-[var(--status-info-fg)]" },
  { type: "crown", label: "Bọc răng sứ", description: "Mão toàn sứ, Zirconia hoặc kim loại", badgeColor: "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]" },
  { type: "root_canal", label: "Điều trị tủy", description: "Đã nội nha bít ống tủy", badgeColor: "bg-purple-100 text-purple-800" },
  { type: "extracted", label: "Đã nhổ / Mất răng", description: "Răng đã bị nhổ hoặc mất bẩm sinh", badgeColor: "bg-neutral-200 text-neutral-800 line-through" },
  { type: "implant", label: "Cấy ghép Implant", description: "Trụ Implant phục hình thay thế chân răng", badgeColor: "bg-teal-100 text-teal-800" }
];

const SURFACES: { code: ToothSurface; label: string; fullTerm: string }[] = [
  { code: "O", label: "O - Nhai / Bờ cắn", fullTerm: "Occlusal / Incisal" },
  { code: "M", label: "M - Mặt gần", fullTerm: "Mesial (hướng về giữa)" },
  { code: "D", label: "D - Mặt xa", fullTerm: "Distal (hướng ra sau)" },
  { code: "B", label: "B - Mặt ngoài", fullTerm: "Buccal / Labial (hướng ra má/môi)" },
  { code: "L", label: "L - Mặt trong", fullTerm: "Lingual / Palatal (hướng lưỡi/vòm miệng)" }
];

export function ToothModal({
  isOpen,
  onClose,
  toothNumber,
  toothName,
  initialCondition,
  onSave
}: ToothModalProps) {
  const [condition, setCondition] = useState<ToothConditionType>("healthy");
  const [surfaces, setSurfaces] = useState<ToothSurface[]>([]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialCondition) {
      setCondition(initialCondition.condition);
      setSurfaces(initialCondition.surfaces || []);
      setNotes(initialCondition.notes || "");
    } else {
      setCondition("healthy");
      setSurfaces([]);
      setNotes("");
    }
  }, [initialCondition, isOpen]);

  if (!isOpen || toothNumber === null) return null;

  const toggleSurface = (code: ToothSurface) => {
    setSurfaces((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(toothNumber, {
        condition,
        surfaces,
        notes: notes.trim()
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetHealthy = async () => {
    setIsSaving(true);
    try {
      await onSave(toothNumber, {
        condition: "healthy",
        surfaces: [],
        notes: ""
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40"
        onClick={() => !isSaving && onClose()}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tooth-modal-title"
        className="relative z-10 w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] shadow-[var(--shadow-overlay)] p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-bold tabular-nums">
                Răng {toothNumber}
              </span>
              <h2 id="tooth-modal-title" className="text-[18px] font-semibold text-[var(--color-text)]">
                {toothName}
              </h2>
            </div>
            <p className="mt-1 text-[var(--text-xs)] text-[var(--color-text-muted)]">
              Ký hiệu FDI tiêu chuẩn quốc tế • Đăng ký thủ thuật & bệnh lý 5 mặt răng
            </p>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Đóng"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* 1. Chọn tình trạng răng */}
          <div>
            <label className="block text-[var(--text-sm)] font-semibold text-[var(--color-text)] mb-2">
              Tình trạng răng (bắt buộc)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONDITION_OPTIONS.map((opt) => {
                const isSelected = condition === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setCondition(opt.type)}
                    className={`flex items-start gap-2.5 p-2.5 text-left rounded-[var(--radius)] border transition cursor-pointer ${
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--status-info-bg)]/40 ring-1 ring-[var(--color-primary)]"
                        : "border-[var(--color-border)] hover:bg-[var(--color-bg)]"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                          : "border-[var(--color-border-input)] bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <div>
                      <p className="text-[var(--text-sm)] font-medium text-[var(--color-text)]">
                        {opt.label}
                      </p>
                      <p className="text-[var(--text-xs)] text-[var(--color-text-muted)]">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Mặt răng can thiệp (Chỉ hiện khi không phải Răng mất hoặc Khỏe mạnh) */}
          {condition !== "extracted" && condition !== "healthy" && (
            <div className="border-t border-[var(--color-border)] pt-3">
              <label className="block text-[var(--text-sm)] font-semibold text-[var(--color-text)] mb-1">
                Các mặt răng can thiệp (5 mặt giải phẫu)
              </label>
              <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] mb-2">
                Chọn các mặt bị sâu, trám hoặc cần chỉ định phục hình
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SURFACES.map((surf) => {
                  const isChecked = surfaces.includes(surf.code);
                  return (
                    <label
                      key={surf.code}
                      className={`flex items-center gap-2 p-2 rounded-[var(--radius)] border cursor-pointer select-none text-[var(--text-xs)] font-medium transition ${
                        isChecked
                          ? "border-[var(--color-primary)] bg-[var(--status-info-bg)] text-[var(--color-text)] font-semibold"
                          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSurface(surf.code)}
                        className="rounded border-[var(--color-border-input)] text-[var(--color-primary)] focus:ring-[var(--color-focus)]"
                      />
                      <span>{surf.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Ghi chú chẩn đoán lâm sàng */}
          <div className="border-t border-[var(--color-border)] pt-3">
            <label htmlFor="tooth-notes" className="block text-[var(--text-sm)] font-semibold text-[var(--color-text)] mb-1">
              Ghi chú chẩn đoán lâm sàng
            </label>
            <textarea
              id="tooth-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Trám xoang II Composite, theo dõi phản ứng tủy sau 2 tuần..."
              className="w-full px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleResetHealthy}
              className="px-3 py-1.5 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-xs)] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
            >
              Đặt lại Khỏe mạnh
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={onClose}
                className="px-4 py-2 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-sm)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition disabled:opacity-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? "Đang lưu..." : "Lưu tình trạng"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
