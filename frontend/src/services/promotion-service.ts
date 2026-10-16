import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PagedResponse } from "@/types/api";
import type {
  CreateDiscountPromoRequest,
  DiscountPromo,
  DiscountValidationResult,
  PromotionSearchParams,
  UpdateDiscountPromoRequest,
  ValidateDiscountPromoRequest
} from "@/types/promotion";

export const promotionService = {
  // Lấy danh sách ưu đãi có phân trang và bộ lọc
  getPromotions: async (params?: PromotionSearchParams): Promise<PagedResponse<DiscountPromo>> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.discountType !== undefined) query.set("discountType", String(params.discountType));
    if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));

    const qs = query.toString();
    const res = await apiClient.get<ApiResponse<PagedResponse<DiscountPromo>>>(
      `/api/v1/promotions${qs ? `?${qs}` : ""}`
    );
    return res.data;
  },

  // Lấy chi tiết 1 mã ưu đãi
  getPromotionById: async (id: string): Promise<DiscountPromo> => {
    const res = await apiClient.get<ApiResponse<DiscountPromo>>(`/api/v1/promotions/${id}`);
    return res.data;
  },

  // Tạo mới mã ưu đãi
  createPromotion: async (data: CreateDiscountPromoRequest): Promise<string> => {
    const res = await apiClient.post<ApiResponse<string>, CreateDiscountPromoRequest>(
      "/api/v1/promotions",
      data
    );
    return res.data;
  },

  // Cập nhật thông tin mã ưu đãi
  updatePromotion: async (id: string, data: UpdateDiscountPromoRequest): Promise<boolean> => {
    const res = await apiClient.put<ApiResponse<boolean>, UpdateDiscountPromoRequest>(
      `/api/v1/promotions/${id}`,
      data
    );
    return res.data;
  },

  // Bật/tắt trạng thái hoạt động của mã ưu đãi
  toggleStatus: async (id: string, isActive?: boolean): Promise<boolean> => {
    const res = await apiClient.patch<ApiResponse<boolean>, { isActive?: boolean }>(
      `/api/v1/promotions/${id}/status`,
      { isActive }
    );
    return res.data;
  },

  // Xóa mã ưu đãi
  deletePromotion: async (id: string): Promise<boolean> => {
    const res = await apiClient.delete<ApiResponse<boolean>>(`/api/v1/promotions/${id}`);
    return res.data;
  },

  // Kiểm tra điều kiện áp dụng mã ưu đãi cho đơn dịch vụ cụ thể
  validatePromotion: async (data: ValidateDiscountPromoRequest): Promise<DiscountValidationResult> => {
    const res = await apiClient.post<ApiResponse<DiscountValidationResult>, ValidateDiscountPromoRequest>(
      "/api/v1/promotions/validate",
      data
    );
    return res.data;
  }
};
