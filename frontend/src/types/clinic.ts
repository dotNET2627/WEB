export interface Clinic {
  id: string;
  name: string;
  address: string;
  phoneNumber?: string | null;
  email?: string | null;
  description?: string | null;
  openingHours?: Record<string, string> | null;
  logo?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClinicRequest {
  name: string;
  address: string;
  phoneNumber?: string;
  email?: string;
  description?: string;
  openingHours?: Record<string, string>;
  logo?: string;
}

export interface UpdateClinicRequest {
  name: string;
  address: string;
  phoneNumber?: string;
  email?: string;
  description?: string;
  openingHours?: Record<string, string>;
  logo?: string;
}

export interface ClinicListResponse {
  items: Clinic[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
