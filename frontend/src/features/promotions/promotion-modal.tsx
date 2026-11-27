"use client";

import { useEffect, useState } from "react";
import { promotionService } from "@/services/promotion-service";
import { dentalServiceApi } from "@/services/dental-service";
import {
  DiscountScope,
  DiscountType,
  type CreateDiscountPromoRequest,
  type DiscountPromo,
  type UpdateDiscountPromoRequest
} from "@/types/promotion";
import type { DentalService, ServiceCategory } from "@/types/service";

interface PromotionModalProps {
  isOpen: boolean;
  promoToEdit?: DiscountPromo | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PromotionModal({
  isOpen,
  promoToEdit,
  onClose,
  onSuccess
}: PromotionModalProps) {
  const isEditing = Boolean(promoToEdit);

  // Form states
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>(DiscountType.Percentage);
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>(undefined);
  const [minOrderAmount, setMinOrderAmount] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [usageLimit, setUsageLimit] = useState<number | undefined>(undefined);
  const [scope, setScope] = useState<DiscountScope>(DiscountScope.All);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Auxiliary data
  const [services, setServices] = useState<DentalService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load services & categories for scope selection
  useEffect(() => {
    if (!isOpen) return;

    Promise.all([
      dentalServiceApi.getActiveServices().catch(() => []),
      dentalServiceApi.getCategories().catch(() => [])
    ]).then(([svcList, catList]) => {
      setServices(svcList);
      setCategories(catList);
    });
  }, [isOpen]);

  // Sync form with promoToEdit
  useEffect(() => {
    if (promoToEdit) {
      setCode(promoToEdit.code);
      setTitle(promoToEdit.title);
      setDescription(promoToEdit.description ?? "");
      setDiscountType(promoToEdit.discountType);
      setDiscountValue(promoToEdit.discountValue);
      setMaxDiscountAmount(promoToEdit.maxDiscountAmount ?? undefined);
      setMinOrderAmount(promoToEdit.minOrderAmount ?? undefined);
      setStartDate(promoToEdit.startDate ? promoToEdit.startDate.substring(0, 10) : "");
      setEndDate(promoToEdit.endDate ? promoToEdit.endDate.substring(0, 10) : "");
      setUsageLimit(promoToEdit.usageLimit ?? undefined);
      setScope(promoToEdit.scope);
      setSelectedServiceIds(promoToEdit.applicableServiceIds ?? []);
      setSelectedCategoryIds(promoToEdit.applicableCategoryIds ?? []);
      setIsActive(promoToEdit.isActive);
    } else {
      const today = new Date().toISOString().substring(0, 10);
      setCode("");
      setTitle("");
      setDescription("");
      setDiscountType(DiscountType.Percentage);
      setDiscountValue(10);
      setMaxDiscountAmount(undefined);
      setMinOrderAmount(undefined);
      setStartDate(today);
      setEndDate("");
      setUsageLimit(undefined);
      setScope(DiscountScope.All);
      setSelectedServiceIds([]);
      setSelectedCategoryIds([]);
      setIsActive(true);
    }
    setError(null);
  }, [promoToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Tiêu đề chương trình không được để trống.");
      return;
    }

    if (!isEditing && !code.trim()) {
      setError("Mã khuyến mãi không được để trống.");
      return;
    }

    if (discountValue <= 0) {
      setError("Giá trị giảm giá phải lớn hơn 0.");
      return;
    }

    if (discountType === DiscountType.Percentage && discountValue > 100) {
      setError("Giảm giá theo phần trăm không được vượt quá 100%.");
      return;
    }

    if (!startDate) {
      setError("Vui lòng chọn ngày bắt đầu hiệu lực.");
      return;
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      setError("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
      return;
    }

    if (scope === DiscountScope.SpecificServices && selectedServiceIds.length === 0) {
      setError("Vui lòng chọn ít nhất một dịch vụ áp dụng.");
      return;
    }

    if (scope === DiscountScope.SpecificCategories && selectedCategoryIds.length === 0) {
      setError("Vui lòng chọn ít nhất một nhóm dịch vụ áp dụng.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const startIso = new Date(startDate).toISOString();
      const endIso = endDate ? new Date(endDate + "T23:59:59").toISOString() : null;

      if (isEditing && promoToEdit) {
        const updatePayload: UpdateDiscountPromoRequest = {
          title: title.trim(),
          description: description.trim() || null,
          discountType,
          discountValue,
          startDate: startIso,
          endDate: endIso,
          maxDiscountAmount: discountType === DiscountType.Percentage ? maxDiscountAmount ?? null : null,
          minOrderAmount: minOrderAmount ?? null,
          usageLimit: usageLimit ?? null,
          scope,
          applicableServiceIds: scope === DiscountScope.SpecificServices ? selectedServiceIds : null,
          applicableCategoryIds: scope === DiscountScope.SpecificCategories ? selectedCategoryIds : null
        };

        await promotionService.updatePromotion(promoToEdit.id, updatePayload);
      } else {
        const createPayload: CreateDiscountPromoRequest = {
          code: code.trim().toUpperCase(),
          title: title.trim(),
          description: description.trim() || null,
          discountType,
          discountValue,
          startDate: startIso,
          endDate: endIso,
          maxDiscountAmount: discountType === DiscountType.Percentage ? maxDiscountAmount ?? null : null,
          minOrderAmount: minOrderAmount ?? null,
          usageLimit: usageLimit ?? null,
          scope,
          applicableServiceIds: scope === DiscountScope.SpecificServices ? selectedServiceIds : null,
          applicableCategoryIds: scope === DiscountScope.SpecificCategories ? selectedCategoryIds : null,
          isActive
        };

        await promotionService.createPromotion(createPayload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi lưu mã ưu đãi.");
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceSelection = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleCategorySelection = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl my-8">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEditing ? `Cập Nhật Mã Ưu Đãi: ${promoToEdit?.code}` : "Thiết Lập Mã Ưu Đãi Mới"}
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
          {/* Row 1: Code & Title */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mã ưu đãi (Code) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: HE2026, VIP10, CHAOMUNG"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase font-mono font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
              <span className="text-xs text-slate-400">Mã duy nhất, khách hàng dùng để nhập</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tên chương trình ưu đãi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Tri ân khách hàng hè 2026..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 2: Discount Type & Value & Max Cap */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Loại giảm giá <span className="text-red-500">*</span>
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(Number(e.target.value) as DiscountType)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={DiscountType.Percentage}>Giảm theo %</option>
                <option value={DiscountType.FixedAmount}>Giảm tiền cố định (VNĐ)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mức giảm {discountType === DiscountType.Percentage ? "(%)" : "(VNĐ)"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={discountType === DiscountType.Percentage ? 100 : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-blue-600 font-semibold">
                {discountType === DiscountType.Percentage
                  ? `${discountValue}%`
                  : `${discountValue.toLocaleString("vi-VN")} đ`}
              </span>
            </div>

            {discountType === DiscountType.Percentage && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Giảm tối đa (VNĐ)
                </label>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={maxDiscountAmount ?? ""}
                  onChange={(e) =>
                    setMaxDiscountAmount(e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="Không giới hạn"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-400">
                  {maxDiscountAmount ? `${maxDiscountAmount.toLocaleString("vi-VN")} đ` : "Chặn trần mức giảm"}
                </span>
              </div>
            )}
          </div>

          {/* Row 3: Min Order & Usage Limit */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Giá trị đơn tối thiểu (VNĐ)
              </label>
              <input
                type="number"
                min={0}
                step={50000}
                value={minOrderAmount ?? ""}
                onChange={(e) =>
                  setMinOrderAmount(e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="VD: 500000 (để trống nếu không yêu cầu)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400">
                {minOrderAmount ? `Áp dụng đơn từ ${minOrderAmount.toLocaleString("vi-VN")} đ` : "Không giới hạn tối thiểu"}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Giới hạn lượt dùng tối đa
              </label>
              <input
                type="number"
                min={1}
                value={usageLimit ?? ""}
                onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="VD: 100 (để trống nếu không giới hạn)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400">
                {usageLimit ? `Tối đa ${usageLimit} lượt sử dụng` : "Vô hạn lượt dùng"}
              </span>
            </div>
          </div>

          {/* Row 4: Validity Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ngày kết thúc (Hết hạn)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400">Để trống nếu không có ngày hết hạn</span>
            </div>
          </div>

          {/* Scope: Service applicability condition */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Phạm vi dịch vụ áp dụng mã
              </label>
              <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="discountScope"
                    checked={scope === DiscountScope.All}
                    onChange={() => setScope(DiscountScope.All)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Tất cả dịch vụ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="discountScope"
                    checked={scope === DiscountScope.SpecificServices}
                    onChange={() => setScope(DiscountScope.SpecificServices)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Dịch vụ chỉ định cụ thể ({selectedServiceIds.length})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="discountScope"
                    checked={scope === DiscountScope.SpecificCategories}
                    onChange={() => setScope(DiscountScope.SpecificCategories)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Theo nhóm dịch vụ ({selectedCategoryIds.length})</span>
                </label>
              </div>
            </div>

            {/* If Specific Services */}
            {scope === DiscountScope.SpecificServices && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded border border-slate-200 bg-white p-2 divide-y divide-slate-100">
                {services.length === 0 ? (
                  <div className="text-xs text-slate-400 p-2">Đang tải danh sách dịch vụ...</div>
                ) : (
                  services.map((svc) => (
                    <label
                      key={svc.id}
                      className="flex items-center justify-between p-1.5 hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedServiceIds.includes(svc.id)}
                          onChange={() => toggleServiceSelection(svc.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-mono text-slate-500">[{svc.code}]</span>
                        <span className="font-medium text-slate-800">{svc.name}</span>
                      </div>
                      <span className="text-slate-500 font-medium">
                        {svc.unitPrice.toLocaleString("vi-VN")} đ
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}

            {/* If Specific Categories */}
            {scope === DiscountScope.SpecificCategories && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded border border-slate-200 bg-white p-2 divide-y divide-slate-100">
                {categories.length === 0 ? (
                  <div className="text-xs text-slate-400 p-2">Đang tải danh sách nhóm dịch vụ...</div>
                ) : (
                  categories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2 p-1.5 hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(cat.id)}
                        onChange={() => toggleCategorySelection(cat.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-slate-800">{cat.name}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ghi chú / Mô tả chương trình
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Điều khoản áp dụng, quy định dành cho nhân viên tiếp tân/thu ngân..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="promoIsActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="promoIsActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                Kích hoạt áp dụng mã ngay khi tạo
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
              {loading ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Tạo mã ưu đãi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
