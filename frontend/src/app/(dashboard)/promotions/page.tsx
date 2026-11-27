"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeading } from "@/components/ui/page-heading";
import { promotionService } from "@/services/promotion-service";
import { PromotionModal } from "@/features/promotions/promotion-modal";
import { PromotionTable } from "@/features/promotions/promotion-table";
import { PromotionTesterBox } from "@/features/promotions/promotion-tester-box";
import { DiscountType, type DiscountPromo } from "@/types/promotion";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<DiscountPromo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promoToEdit, setPromoToEdit] = useState<DiscountPromo | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const discountTypeParam =
        typeFilter === "percentage"
          ? DiscountType.Percentage
          : typeFilter === "fixed"
          ? DiscountType.FixedAmount
          : undefined;

      const isActiveParam =
        statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined;

      const paged = await promotionService.getPromotions({
        search: search.trim() || undefined,
        discountType: discountTypeParam,
        isActive: isActiveParam,
        page,
        pageSize
      });

      setPromotions(paged.items);
      setTotalCount(paged.totalCount);
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Lỗi khi tải danh sách ưu đãi.");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  // Handlers
  const handleOpenCreate = () => {
    setPromoToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo: DiscountPromo) => {
    setPromoToEdit(promo);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await promotionService.toggleStatus(id, !currentStatus);
      showNotification(
        "success",
        `Đã chuyển trạng thái mã ưu đãi sang "${!currentStatus ? "Đang áp dụng" : "Tạm ngưng"}".`
      );
      loadPromotions();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Lỗi khi đổi trạng thái.");
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mã ưu đãi "${code}"?`)) {
      return;
    }

    try {
      await promotionService.deletePromotion(id);
      showNotification("success", `Đã xóa mã ưu đãi "${code}".`);
      loadPromotions();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Lỗi khi xóa mã ưu đãi.");
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // Quick Stats
  const activeCount = promotions.filter((p) => p.isActive).length;
  const expiredCount = promotions.filter((p) => p.endDate && new Date(p.endDate) < new Date()).length;
  const totalUsed = promotions.reduce((sum, p) => sum + p.usedCount, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeading
          title="Chương Trình Ưu Đãi & Giảm Giá"
          description="Thiết lập các mã voucher, ưu đãi theo phần trăm hoặc số tiền, cấu hình điều kiện áp dụng cho từng loại dịch vụ khám bệnh."
        />

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition"
        >
          + Tạo Mã Ưu Đãi Mới
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-lg p-4 text-sm font-medium shadow-sm transition ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-4 text-xs font-bold opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Tổng số mã ưu đãi</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-emerald-600">Đang kích hoạt (Trang này)</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{activeCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-red-600">Đã hết hạn (Trang này)</div>
          <div className="mt-1 text-2xl font-bold text-red-700">{expiredCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-blue-600">Lượt đã sử dụng (Trang này)</div>
          <div className="mt-1 text-2xl font-bold text-blue-700">{totalUsed}</div>
        </div>
      </div>

      {/* Khung thử nghiệm điều kiện áp dụng mã theo dịch vụ */}
      <PromotionTesterBox />

      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo mã ưu đãi hoặc tên chương trình..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả loại giảm</option>
            <option value="percentage">Giảm theo %</option>
            <option value="fixed">Giảm tiền cố định</option>
          </select>
        </div>

        <div className="w-full sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang áp dụng</option>
            <option value="inactive">Tạm ngưng</option>
          </select>
        </div>

        {(search || typeFilter !== "all" || statusFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setTypeFilter("all");
              setStatusFilter("all");
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Đặt lại
          </button>
        )}
      </div>

      {/* Bảng danh sách mã ưu đãi */}
      <PromotionTable
        promotions={promotions}
        loading={loading}
        onEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-xs text-slate-500">
            Hiển thị trang <span className="font-semibold text-slate-800">{page}</span> /{" "}
            <span className="font-semibold text-slate-800">{totalPages}</span> (Tổng số:{" "}
            {totalCount} mã ưu đãi)
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              ← Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Sau →
            </button>
          </div>
        </div>
      )}

      {/* Modal tạo / sửa mã ưu đãi */}
      <PromotionModal
        isOpen={isModalOpen}
        promoToEdit={promoToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setPromoToEdit(null);
        }}
        onSuccess={() => {
          showNotification(
            "success",
            promoToEdit ? "Đã cập nhật mã ưu đãi thành công." : "Đã tạo mới mã ưu đãi thành công."
          );
          loadPromotions();
        }}
      />
    </div>
  );
}
