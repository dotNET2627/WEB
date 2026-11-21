import { apiClient } from "@/lib/api-client";
import type { Clinic, ClinicListResponse, CreateClinicRequest, UpdateClinicRequest } from "@/types/clinic";

export interface GetClinicsParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export const clinicService = {
  async getClinics(params: GetClinicsParams = {}): Promise<ClinicListResponse> {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set("search", params.search);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());

    const qs = searchParams.toString();
    const url = `/api/v1/clinics${qs ? `?${qs}` : ""}`;
    return apiClient.get<ClinicListResponse>(url);
  },

  async getClinicById(id: string): Promise<Clinic> {
    return apiClient.get<Clinic>(`/api/v1/clinics/${id}`);
  },

  async createClinic(payload: CreateClinicRequest): Promise<Clinic> {
    return apiClient.post<Clinic, CreateClinicRequest>("/api/v1/clinics", payload);
  },

  async updateClinic(id: string, payload: UpdateClinicRequest): Promise<Clinic> {
    return apiClient.put<Clinic, UpdateClinicRequest>(`/api/v1/clinics/${id}`, payload);
  },

  async deleteClinic(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/clinics/${id}`);
  },

  async activateClinic(id: string): Promise<void> {
    return apiClient.put<void, Record<string, never>>(`/api/v1/clinics/${id}/activate`, {});
  },

  async deactivateClinic(id: string): Promise<void> {
    return apiClient.put<void, Record<string, never>>(`/api/v1/clinics/${id}/deactivate`, {});
  }
};
