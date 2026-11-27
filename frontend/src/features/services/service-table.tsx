"use client";

import type { DentalService } from "@/types/service";

interface ServiceTableProps {
  services: DentalService[];
  loading: boolean;
  onEdit: (service: DentalService) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string, name: string) => void;
}

export function ServiceTable({
  services,
  loading,
  onEdit,
  onToggleStatus,
  onDelete
}: ServiceTableProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <span className="text-sm text-slate-500">Đang tải danh sách dịch vụ...</span>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <div className="text-3xl mb-2">🦷</div>
        <h4 className="text-base font-semibold text-slate-800">Không tìm thấy dịch vụ nào</h4>
        <p className="mt-1 text-sm text-slate-500">
          Chưa có dịch vụ nào phù hợp với bộ lọc tìm kiếm của bạn. Hãy thử thay đổi từ khóa hoặc thêm dịch vụ mới.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Mã dịch vụ</th>
              <th className="px-4 py-3">Tên dịch vụ</th>
              <th className="px-4 py-3">Nhóm dịch vụ</th>
              <th className="px-4 py-3 text-right">Đơn giá</th>
              <th className="px-4 py-3 text-center">ĐVT</th>
              <th className="px-4 py-3 text-center">Thời lượng</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Mã dịch vụ */}
                <td className="whitespace-nowrap px-4 py-3 font-mono font-medium text-blue-600">
                  <span className="rounded bg-blue-50 px-2 py-1 text-xs">
                    {service.code}
                  </span>
                </td>

                {/* Tên dịch vụ & mô tả */}
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{service.name}</div>
                  {service.description && (
                    <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">
                      {service.description}
                    </div>
                  )}
                </td>

                {/* Nhóm dịch vụ */}
                <td className="whitespace-nowrap px-4 py-3">
                  {service.categoryName ? (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                      {service.categoryName}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Chưa phân nhóm</span>
                  )}
                </td>

                {/* Đơn giá */}
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                  {service.unitPrice.toLocaleString("vi-VN")} đ
                </td>

                {/* Đơn vị tính */}
                <td className="whitespace-nowrap px-4 py-3 text-center text-xs text-slate-600">
                  {service.unit ?? "—"}
                </td>

                {/* Thời lượng */}
                <td className="whitespace-nowrap px-4 py-3 text-center text-xs text-slate-600">
                  {service.estimatedDurationMinutes ? `${service.estimatedDurationMinutes}p` : "—"}
                </td>

                {/* Trạng thái Bật/Tắt */}
                <td className="whitespace-nowrap px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(service.id, service.isActive)}
                    title={service.isActive ? "Nhấn để tạm ngưng" : "Nhấn để kích hoạt"}
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition ${
                      service.isActive
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300"
                    }`}
                  >
                    <span
                      className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                        service.isActive ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    {service.isActive ? "Đang áp dụng" : "Tạm ngưng"}
                  </button>
                </td>

                {/* Nút Thao tác */}
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(service)}
                      className="rounded border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(service.id, service.name)}
                      className="rounded border border-slate-200 px-2.5 py-1 font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
