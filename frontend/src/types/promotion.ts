import type { DentalService } from "./service";

export enum DiscountType {
  Percentage = 1,
  FixedAmount = 2
}

export enum DiscountScope {
  All = 1,
  SpecificServices = 2,
  SpecificCategories = 3
}

export interface DiscountPromo {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  startDate: string;
  endDate?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  scope: DiscountScope;
  applicableServiceIds: string[];
  applicableCategoryIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountPromoRequest {
  code: string;
  title: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  endDate?: string | null;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  usageLimit?: number | null;
  scope: DiscountScope;
  applicableServiceIds?: string[] | null;
  applicableCategoryIds?: string[] | null;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateDiscountPromoRequest {
  title: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  endDate?: string | null;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  usageLimit?: number | null;
  scope: DiscountScope;
  applicableServiceIds?: string[] | null;
  applicableCategoryIds?: string[] | null;
  description?: string | null;
}

export interface ValidateDiscountPromoRequest {
  code: string;
  orderAmount: number;
  serviceIds?: string[] | null;
  categoryIds?: string[] | null;
}

export interface DiscountValidationResult {
  isValid: boolean;
  errorCode?: string | null;
  message?: string | null;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  promo?: DiscountPromo | null;
}

export interface PromotionSearchParams {
  search?: string;
  discountType?: DiscountType;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}
