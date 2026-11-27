export interface DentalService {
  id: string;
  code: string;
  name: string;
  unitPrice: number;
  categoryId?: string | null;
  categoryName?: string | null;
  unit?: string | null;
  estimatedDurationMinutes?: number | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDentalServiceRequest {
  code: string;
  name: string;
  unitPrice: number;
  categoryId?: string | null;
  unit?: string | null;
  estimatedDurationMinutes?: number | null;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateDentalServiceRequest {
  name: string;
  unitPrice: number;
  categoryId?: string | null;
  unit?: string | null;
  estimatedDurationMinutes?: number | null;
  description?: string | null;
}

export interface CreateServiceCategoryRequest {
  name: string;
  description?: string | null;
}

export interface ServiceSearchParams {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}
