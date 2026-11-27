"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeading } from "@/components/ui/page-heading";
import { dentalServiceApi } from "@/services/dental-service";
import { CategoryModal } from "@/features/services/category-modal";
import { ServiceModal } from "@/features/services/service-modal";
import { ServiceTable } from "@/features/services/service-table";
import type { DentalService, ServiceCategory } from "@/types/service";

export default function ServicesPage() {
  const [services, setServices] = useState<DentalService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<DentalService | null>(null);

  // Feedback notifications
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const data = await dentalServiceApi.getCategories();
      setCategories(data);
    } catch {
      // Ignore background category error
    }
  }, []);

  // Load services
  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const isActiveParam =
        statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined;

      const paged = await dentalServiceApi.getServices({
        search: search.trim() || undefined,
        categoryId: selectedCategory || undefined,
        isActive: isActiveParam,
        page,
        pageSize
      });

      setServices(paged.items);
      setTotalCount(paged.totalCount);
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Lỗi khi tải dữ liệu dịch vụ.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, statusFilter, page, pageSize]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Handlers
  const handleOpenCreateService = () => {
    setServiceToEdit(null);
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (service: DentalService) => {
    setServiceToEdit(service);
    setIsServiceModalOpen(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await dentalServiceApi.toggleStatus(id, !currentStatus);
      showNotification(
        "success",
        `Đã chuyển trạng thái dịch vụ sang "${!currentStatus ? "Đang áp dụng" : "Tạm ngưng"}".`
      );
      loadServices();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Lỗi khi đổi trạng thái.");
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa dịch vụ "${name}"?`)) {
      return;
    }

    try {
      await dentalServiceApi.deleteService(id);
      showNotification("success", `Đã xóa dịch vụ "${name}".`);
      loadServices();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Lỗi khi xóa dịch vụ.");
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // Quick Stats
  const activeCount = services.filter((s) => s.isActive).length;
  const inactiveCount = services.filter((s) => !s.isActive).length;

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeading
          title="Dịch Vụ Khám & Bảng Giá"
          description="Quản lý bảng giá, thủ thuật điều trị và nhóm dịch vụ khám nha khoa."
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            + Nhóm Dịch Vụ
          </button>
          <button
            type="button"
            onClick={handleOpenCreateService}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition"
          >
            + Thêm Dịch Vụ Mới
          </button>
        </div>
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
          <div className="text-xs font-medium text-slate-500">Tổng dịch vụ</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-emerald-600">Đang áp dụng (Trang này)</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{activeCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Tạm ngưng (Trang này)</div>
          <div className="mt-1 text-2xl font-bold text-slate-700">{inactiveCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-blue-600">Tổng số nhóm dịch vụ</div>
          <div className="mt-1 text-2xl font-bold text-blue-700">{categories.length}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên hoặc mã dịch vụ..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Category filter */}
        <div className="w-full sm:w-56">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Tất cả nhóm --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
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

        {/* Reset filter */}
        {(search || selectedCategory || statusFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("");
              setStatusFilter("all");
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Đặt lại
          </button>
        )}
      </div>

      {/* Table */}
      <ServiceTable
        services={services}
        loading={loading}
        onEdit={handleOpenEditService}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteService}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-xs text-slate-500">
            Hiển thị trang <span className="font-semibold text-slate-800">{page}</span> /{" "}
            <span className="font-semibold text-slate-800">{totalPages}</span> (Tổng số:{" "}
            {totalCount} dịch vụ)
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

      {/* Modals */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        serviceToEdit={serviceToEdit}
        categories={categories}
        onClose={() => {
          setIsServiceModalOpen(false);
          setServiceToEdit(null);
        }}
        onSuccess={() => {
          showNotification(
            "success",
            serviceToEdit ? "Đã cập nhật dịch vụ thành công." : "Đã tạo mới dịch vụ thành công."
          );
          loadServices();
        }}
        onOpenAddCategory={() => setIsCategoryModalOpen(true)}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => {
          showNotification("success", "Đã tạo nhóm dịch vụ mới.");
          loadCategories();
        }}
      />
    </div>
  );
}
