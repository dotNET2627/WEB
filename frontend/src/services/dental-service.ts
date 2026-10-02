import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PagedResponse } from "@/types/api";
import type {
  CreateDentalServiceRequest,
  CreateServiceCategoryRequest,
  DentalService,
  ServiceCategory,
  ServiceSearchParams,
  UpdateDentalServiceRequest
} from "@/types/service";

export const dentalServiceApi = {
  // Lấy danh sách dịch vụ có phân trang và bộ lọc
  getServices: async (params?: ServiceSearchParams): Promise<PagedResponse<DentalService>> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.categoryId) query.set("categoryId", params.categoryId);
    if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));

    const qs = query.toString();
    const res = await apiClient.get<ApiResponse<PagedResponse<DentalService>>>(
      `/api/v1/services${qs ? `?${qs}` : ""}`
    );
    return res.data;
  },

  // Lấy toàn bộ dịch vụ đang hoạt động (dùng cho dropdown đặt lịch/hóa đơn)
  getActiveServices: async (): Promise<DentalService[]> => {
    const res = await apiClient.get<ApiResponse<DentalService[]>>("/api/v1/services/active");
    return res.data;
  },

  // Lấy chi tiết 1 dịch vụ
  getServiceById: async (id: string): Promise<DentalService> => {
    const res = await apiClient.get<ApiResponse<DentalService>>(`/api/v1/services/${id}`);
    return res.data;
  },

  // Tạo mới dịch vụ
  createService: async (data: CreateDentalServiceRequest): Promise<string> => {
    const res = await apiClient.post<ApiResponse<string>, CreateDentalServiceRequest>(
      "/api/v1/services",
      data
    );
    return res.data;
  },

  // Cập nhật thông tin dịch vụ
  updateService: async (id: string, data: UpdateDentalServiceRequest): Promise<boolean> => {
    const res = await apiClient.put<ApiResponse<boolean>, UpdateDentalServiceRequest>(
      `/api/v1/services/${id}`,
      data
    );
    return res.data;
  },

  // Bật/tắt trạng thái hoạt động của dịch vụ
  toggleStatus: async (id: string, isActive?: boolean): Promise<boolean> => {
    const res = await apiClient.patch<ApiResponse<boolean>, { isActive?: boolean }>(
      `/api/v1/services/${id}/status`,
      { isActive }
    );
    return res.data;
  },

  // Xóa dịch vụ
  deleteService: async (id: string): Promise<boolean> => {
    const res = await apiClient.delete<ApiResponse<boolean>>(`/api/v1/services/${id}`);
    return res.data;
  },

  // Lấy danh sách nhóm dịch vụ
  getCategories: async (): Promise<ServiceCategory[]> => {
    const res = await apiClient.get<ApiResponse<ServiceCategory[]>>("/api/v1/services/categories");
    return res.data;
  },

  // Tạo nhóm dịch vụ mới
  createCategory: async (data: CreateServiceCategoryRequest): Promise<string> => {
    const res = await apiClient.post<ApiResponse<string>, CreateServiceCategoryRequest>(
      "/api/v1/services/categories",
      data
    );
    return res.data;
  }
};
