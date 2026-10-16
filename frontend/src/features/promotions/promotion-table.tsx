"use client";

import { DiscountScope, DiscountType, type DiscountPromo } from "@/types/promotion";

interface PromotionTableProps {
  promotions: DiscountPromo[];
  loading: boolean;
  onEdit: (promo: DiscountPromo) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string, code: string) => void;
}

export function PromotionTable({
  promotions,
  loading,
  onEdit,
  onToggleStatus,
  onDelete
}: PromotionTableProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <span className="text-sm text-slate-500">Đang tải danh sách mã ưu đãi...</span>
        </div>
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <div className="text-3xl mb-2">🏷️</div>
        <h4 className="text-base font-semibold text-slate-800">Không tìm thấy mã ưu đãi nào</h4>
        <p className="mt-1 text-sm text-slate-500">
          Chưa có chương trình khuyến mãi nào phù hợp với bộ lọc tìm kiếm. Hãy thêm mã ưu đãi mới để bắt đầu.
        </p>
      </div>
    );
  }

  const isExpired = (endDate?: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Mã ưu đãi</th>
              <th className="px-4 py-3">Chương trình</th>
              <th className="px-4 py-3">Mức giảm</th>
              <th className="px-4 py-3">Phạm vi áp dụng</th>
              <th className="px-4 py-3">Thời hạn</th>
              <th className="px-4 py-3 text-center">Lượt dùng</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {promotions.map((promo) => {
              const expired = isExpired(promo.endDate);

              return (
                <tr key={promo.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Mã code */}
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-blue-700">
                    <span className="rounded bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs">
                      {promo.code}
                    </span>
                  </td>

                  {/* Tên & Mô tả */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{promo.title}</div>
                    {promo.description && (
                      <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">
                        {promo.description}
                      </div>
                    )}
                  </td>

                  {/* Mức giảm */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="font-bold text-slate-900">
                      {promo.discountType === DiscountType.Percentage
                        ? `Giảm ${promo.discountValue}%`
                        : `Giảm ${promo.discountValue.toLocaleString("vi-VN")} đ`}
                    </div>
                    {promo.maxDiscountAmount && (
                      <div className="text-xs text-slate-500">
                        Tối đa {promo.maxDiscountAmount.toLocaleString("vi-VN")} đ
                      </div>
                    )}
                    {promo.minOrderAmount && (
                      <div className="text-xs text-slate-400">
                        Đơn từ {promo.minOrderAmount.toLocaleString("vi-VN")} đ
                      </div>
                    )}
                  </td>

                  {/* Phạm vi áp dụng */}
                  <td className="whitespace-nowrap px-4 py-3">
                    {promo.scope === DiscountScope.All && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                        Tất cả dịch vụ
                      </span>
                    )}
                    {promo.scope === DiscountScope.SpecificServices && (
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 border border-purple-200">
                        {promo.applicableServiceIds.length} dịch vụ chọn lọc
                      </span>
                    )}
                    {promo.scope === DiscountScope.SpecificCategories && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                        {promo.applicableCategoryIds.length} nhóm dịch vụ
                      </span>
                    )}
                  </td>

                  {/* Thời hạn */}
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    <div>Từ: {new Date(promo.startDate).toLocaleDateString("vi-VN")}</div>
                    {promo.endDate ? (
                      <div className={expired ? "text-red-600 font-semibold" : "text-slate-600"}>
                        Đến: {new Date(promo.endDate).toLocaleDateString("vi-VN")}
                        {expired && " (Hết hạn)"}
                      </div>
                    ) : (
                      <div className="text-slate-400">Vô thời hạn</div>
                    )}
                  </td>

                  {/* Lượt dùng */}
                  <td className="whitespace-nowrap px-4 py-3 text-center text-xs">
                    <span className="font-semibold text-slate-800">{promo.usedCount}</span>
                    <span className="text-slate-400">
                      /{promo.usageLimit !== null && promo.usageLimit !== undefined ? promo.usageLimit : "∞"}
                    </span>
                  </td>

                  {/* Trạng thái Bật/Tắt */}
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(promo.id, promo.isActive)}
                      title={promo.isActive ? "Nhấn để tạm ngưng" : "Nhấn để kích hoạt"}
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition ${
                        promo.isActive
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300"
                      }`}
                    >
                      <span
                        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                          promo.isActive ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {promo.isActive ? "Đang áp dụng" : "Tạm ngưng"}
                    </button>
                  </td>

                  {/* Thao tác */}
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(promo)}
                        className="rounded border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(promo.id, promo.code)}
                        className="rounded border border-slate-200 px-2.5 py-1 font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
