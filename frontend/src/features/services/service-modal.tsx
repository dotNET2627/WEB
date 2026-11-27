"use client";

import { useEffect, useState } from "react";
import { dentalServiceApi } from "@/services/dental-service";
import type { DentalService, ServiceCategory } from "@/types/service";

interface ServiceModalProps {
  isOpen: boolean;
  serviceToEdit?: DentalService | null;
  categories: ServiceCategory[];
  onClose: () => void;
  onSuccess: () => void;
  onOpenAddCategory?: () => void;
}

const COMMON_UNITS = ["Lần", "Răng", "Hàm", "Liệu trình", "Chiếc", "Ca"];

export function ServiceModal({
  isOpen,
  serviceToEdit,
  categories,
  onClose,
  onSuccess,
  onOpenAddCategory
}: ServiceModalProps) {
  const isEditing = Boolean(serviceToEdit);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<string>("");
  const [unit, setUnit] = useState<string>("Lần");
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState<number>(30);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceToEdit) {
      setCode(serviceToEdit.code);
      setName(serviceToEdit.name);
      setUnitPrice(serviceToEdit.unitPrice);
      setCategoryId(serviceToEdit.categoryId ?? "");
      setUnit(serviceToEdit.unit ?? "Lần");
      setEstimatedDurationMinutes(serviceToEdit.estimatedDurationMinutes ?? 30);
      setDescription(serviceToEdit.description ?? "");
      setIsActive(serviceToEdit.isActive);
    } else {
      setCode("");
      setName("");
      setUnitPrice(100000);
      setCategoryId(categories.length > 0 ? categories[0].id : "");
      setUnit("Lần");
      setEstimatedDurationMinutes(30);
      setDescription("");
      setIsActive(true);
    }
    setError(null);
  }, [serviceToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tên dịch vụ không được để trống.");
      return;
    }

    if (!isEditing && !code.trim()) {
      setError("Mã dịch vụ không được để trống.");
      return;
    }

    if (unitPrice < 0) {
      setError("Đơn giá không được âm.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditing && serviceToEdit) {
        await dentalServiceApi.updateService(serviceToEdit.id, {
          name: name.trim(),
          unitPrice,
          categoryId: categoryId || null,
          unit: unit.trim() || null,
          estimatedDurationMinutes: estimatedDurationMinutes > 0 ? estimatedDurationMinutes : null,
          description: description.trim() || null
        });
      } else {
        await dentalServiceApi.createService({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          unitPrice,
          categoryId: categoryId || null,
          unit: unit.trim() || null,
          estimatedDurationMinutes: estimatedDurationMinutes > 0 ? estimatedDurationMinutes : null,
          description: description.trim() || null,
          isActive
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi lưu dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl my-8">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEditing ? `Cập Nhật Dịch Vụ: ${serviceToEdit?.code}` : "Thêm Dịch Vụ Khám Mới"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mã dịch vụ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: DV-KHAM-01"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
              <span className="text-xs text-slate-400">Mã định danh duy nhất</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nhóm dịch vụ
              </label>
              <div className="flex gap-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Chưa phân nhóm --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {onOpenAddCategory && (
                  <button
                    type="button"
                    onClick={onOpenAddCategory}
                    title="Thêm nhóm dịch vụ mới"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tên dịch vụ khám / thủ thuật <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Khám và tư vấn tổng quát, Cạo vôi răng..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Đơn giá (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                step={1000}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-blue-600 font-semibold">
                {unitPrice.toLocaleString("vi-VN")} đ
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Đơn vị tính
              </label>
              <input
                type="text"
                list="units-list"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="VD: Lần, Răng..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <datalist id="units-list">
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Thời lượng (phút)
              </label>
              <input
                type="number"
                min={5}
                step={5}
                value={estimatedDurationMinutes}
                onChange={(e) => setEstimatedDurationMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400">Dùng xếp lịch hẹn</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mô tả chi tiết / Chỉ định
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chỉ định chuyên môn, quy trình điều trị..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                Áp dụng kinh doanh ngay khi tạo
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Tạo dịch vụ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
