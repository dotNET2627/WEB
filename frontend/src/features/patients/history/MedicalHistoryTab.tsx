"use client";

import React, { useState } from "react";
import { Plus, Trash2, AlertTriangle, ShieldAlert, Heart, Pill, Activity } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { patientService } from "@/services/patient-service";
import type { MedicalHistoryItem } from "@/types/patient";

interface MedicalHistoryTabProps {
  patientId: string;
  items: MedicalHistoryItem[];
  onItemsChange: (updated: MedicalHistoryItem[]) => void;
}

const COMMON_CONDITIONS = [
  { name: "Dị ứng Penicillin / Amoxicillin", type: "allergy", severity: "severe" as const, hint: "Nguy cơ sốc phản vệ cao" },
  { name: "Bệnh tim mạch / Hở van tim", type: "chronic", severity: "moderate" as const, hint: "Cần kháng sinh dự phòng nội tâm mạc" },
  { name: "Tiền sử Tăng huyết áp", type: "chronic", severity: "moderate" as const, hint: "Thận trọng khi dùng thuốc tê có Adrenaline" },
  { name: "Đái tháo đường (Tiểu đường)", type: "chronic", severity: "moderate" as const, hint: "Chậm lành thương, dễ nhiễm trùng" },
  { name: "Đang dùng thuốc chống đông máu", type: "medication", severity: "severe" as const, hint: "Nguy cơ chảy máu kéo dài khi nhổ răng" },
  { name: "Phụ nữ mang thai / Cho con bú", type: "other", severity: "moderate" as const, hint: "Hạn chế chụp X-quang và kê đơn nhóm an toàn" }
];

export function MedicalHistoryTab({
  patientId,
  items = [],
  onItemsChange
}: MedicalHistoryTabProps) {
  const safeItems = Array.isArray(items) ? items : [];
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"allergy" | "chronic" | "medication" | "other">("allergy");
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe">("moderate");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Vui lòng nhập tên dị ứng hoặc bệnh nền.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await patientService.addMedicalHistory(patientId, {
        name: name.trim(),
        type,
        severity,
        notes: notes.trim() || undefined
      });
      onItemsChange([created, ...safeItems]);
      showToast("Đã bổ sung tiền sử bệnh lý vào hồ sơ.", "success");
      setIsAdding(false);
      setName("");
      setNotes("");
    } catch {
      showToast("Lỗi khi thêm tiền sử bệnh lý.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, itemName: string) => {
    if (!confirm(`Xác nhận xóa "${itemName}" khỏi hồ sơ bệnh lý?`)) return;
    try {
      await patientService.deleteMedicalHistory(patientId, id);
      onItemsChange(await patientService.getMedicalHistory(patientId));
      showToast(`Đã xóa "${itemName}".`, "success");
    } catch {
      showToast("Lỗi khi xóa mục bệnh lý.", "error");
    }
  };

  const handleQuickAdd = (cond: typeof COMMON_CONDITIONS[0]) => {
    setName(cond.name);
    setType(cond.type as "allergy" | "chronic" | "medication" | "other");
    setSeverity(cond.severity);
    setNotes(cond.hint);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[var(--color-danger)]" />
            <h3 className="text-[18px] font-semibold text-[var(--color-text)]">
              Tiền sử bệnh lý & Cảnh báo an toàn y khoa
            </h3>
          </div>
          <p className="mt-1 text-[var(--text-xs)] text-[var(--color-text-muted)]">
            Dữ liệu dị ứng thuốc, bệnh lý toàn thân và đơn thuốc đặc trị đang dùng (quy tắc an toàn bệnh nhân trước thẩm mỹ).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-xs)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm cảnh báo bệnh lý</span>
        </button>
      </div>

      {/* Quick Add presets bar */}
      <div className="p-3.5 rounded-[var(--radius)] border border-slate-200 bg-slate-50/70 space-y-2">
        <span className="text-[12px] font-semibold text-slate-700 block">
          Gợi ý bệnh lý nha khoa cần lưu ý:
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {COMMON_CONDITIONS.map((cond) => (
            <button
              key={cond.name}
              type="button"
              onClick={() => handleQuickAdd(cond)}
              className="px-2.5 py-1 rounded-[var(--radius)] border border-slate-300 bg-white hover:bg-slate-100 text-[12px] text-slate-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3 text-slate-500" />
              <span>{cond.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add New Condition Form Modal/Inline */}
      {isAdding && (
        <div className="p-4 rounded-[var(--radius)] border border-[var(--color-primary)] bg-[var(--color-surface)] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
            <h4 className="text-[15px] font-semibold text-[var(--color-text)]">
              Ghi nhận tiền sử bệnh lý mới
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-[var(--text-xs)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Hủy
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <FormField label="Tên dị ứng hoặc bệnh mãn tính" required id="cond-name">
                  <input
                    id="cond-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ví dụ: Dị ứng Penicillin, Huyết áp cao..."
                    className="w-full px-3 py-1.5 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                  />
                </FormField>
              </div>

              <div>
                <FormField label="Phân nhóm" required id="cond-type">
                  <select
                    id="cond-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as typeof type)}
                    className="w-full px-3 py-1.5 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] cursor-pointer"
                  >
                    <option value="allergy">Dị ứng thuốc / thức ăn</option>
                    <option value="chronic">Bệnh toàn thân (Tim mạch/Tiểu đường)</option>
                    <option value="medication">Thuốc đặc trị đang dùng</option>
                    <option value="other">Yếu tố khác (Mang thai...)</option>
                  </select>
                </FormField>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <FormField label="Mức độ nguy cơ" required id="cond-severity">
                  <select
                    id="cond-severity"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as typeof severity)}
                    className="w-full px-3 py-1.5 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] cursor-pointer"
                  >
                    <option value="mild">Nhẹ (Theo dõi thông thường)</option>
                    <option value="moderate">Trung bình (Thận trọng can thiệp)</option>
                    <option value="severe">Nặng / Nguy hiểm (Chống chỉ định)</option>
                  </select>
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField label="Lưu ý lâm sàng / Hướng xử lý" id="cond-notes">
                  <input
                    id="cond-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ví dụ: Chống chỉ định gây tê có co mạch, dùng Erythromycin thay thế..."
                    className="w-full px-3 py-1.5 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                  />
                </FormField>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-[var(--text-xs)] border border-[var(--color-border)] rounded-[var(--radius)] hover:bg-[var(--color-bg)]"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-[var(--text-xs)] rounded-[var(--radius)] bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-hover)]"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu vào hồ sơ"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of Registered Conditions */}
      {safeItems.length === 0 ? (
        <div className="p-8 text-center rounded-[var(--radius)] border border-dashed border-emerald-300 bg-emerald-50/50">
          <Activity className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h4 className="text-[15px] font-semibold text-emerald-900">
            Chưa ghi nhận tiền sử dị ứng hoặc bệnh mãn tính
          </h4>
          <p className="text-[var(--text-xs)] text-emerald-700 mt-1">
            Bác sĩ hoặc lễ tân đã đối soát nhưng không phát hiện tiền sử bất lợi. Bấm nút phía trên nếu phát sinh ghi chú mới.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {safeItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-[var(--radius)] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.severity === "severe"
                  ? "border-red-300 bg-red-50/60"
                  : item.severity === "moderate"
                  ? "border-amber-300 bg-amber-50/60"
                  : "border-slate-300 bg-slate-50/60"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-full shrink-0 ${
                    item.severity === "severe"
                      ? "bg-red-100 text-red-700"
                      : item.severity === "moderate"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.type === "allergy" ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : item.type === "chronic" ? (
                    <Heart className="w-5 h-5" />
                  ) : (
                    <Pill className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-[15px] font-bold text-[var(--color-text)]">
                      {item.name}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        item.severity === "severe"
                          ? "bg-red-200 text-red-900"
                          : item.severity === "moderate"
                          ? "bg-amber-200 text-amber-900"
                          : "bg-slate-200 text-slate-800"
                      }`}
                    >
                      {item.severity === "severe"
                        ? "Nguy cơ cao"
                        : item.severity === "moderate"
                        ? "Nguy cơ vừa"
                        : "Nhẹ"}
                    </span>
                    <span className="text-[12px] text-[var(--color-text-muted)]">
                      ({item.type === "allergy" ? "Dị ứng" : item.type === "chronic" ? "Bệnh nền" : "Dược phẩm"})
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-[13px] text-[var(--color-text)] mt-1 font-medium">
                      Lưu ý: {item.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(item.id, item.name)}
                  aria-label={`Xóa cảnh báo ${item.name}`}
                  className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-100 rounded transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
