import { apiClient } from "@/lib/api-client";
import type {
  Doctor,
  DoctorListResponse,
  CreateDoctorRequest,
  UpdateDoctorRequest,
  WorkScheduleItem,
  AssignWorkScheduleRequest,
  RemoveWorkScheduleRequest
} from "@/types/doctor";

export interface GetDoctorsParams {
  clinicId?: string;
  specialty?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

export const doctorService = {
  async getDoctors(params: GetDoctorsParams = {}): Promise<DoctorListResponse> {
    const searchParams = new URLSearchParams();
    if (params.clinicId && params.clinicId !== "00000000-0000-0000-0000-000000000000") {
      searchParams.set("clinicId", params.clinicId);
    }
    if (params.specialty) searchParams.set("specialty", params.specialty);
    if (params.searchTerm) {
      searchParams.set("search", params.searchTerm);
      searchParams.set("searchTerm", params.searchTerm);
    }
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());

    const qs = searchParams.toString();
    const url = `/api/v1/doctors${qs ? `?${qs}` : ""}`;
    return apiClient.get<DoctorListResponse>(url);
  },

  async getDoctorById(id: string): Promise<Doctor> {
    return apiClient.get<Doctor>(`/api/v1/doctors/${id}`);
  },

  async createDoctor(payload: CreateDoctorRequest): Promise<Doctor> {
    return apiClient.post<Doctor, CreateDoctorRequest>("/api/v1/doctors", payload);
  },

  async updateDoctor(id: string, payload: UpdateDoctorRequest): Promise<Doctor> {
    return apiClient.put<Doctor, UpdateDoctorRequest>(`/api/v1/doctors/${id}`, payload);
  },

  async deleteDoctor(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/doctors/${id}`);
  },

  async getDoctorSchedules(id: string): Promise<WorkScheduleItem[]> {
    return apiClient.get<WorkScheduleItem[]>(`/api/v1/doctors/${id}/schedules`);
  },

  async assignWorkSchedule(id: string, payload: AssignWorkScheduleRequest): Promise<WorkScheduleItem[]> {
    return apiClient.post<WorkScheduleItem[], AssignWorkScheduleRequest>(
      `/api/v1/doctors/${id}/schedules`,
      payload
    );
  },

  async setDoctorWorkSchedules(id: string, schedules: WorkScheduleItem[]): Promise<WorkScheduleItem[]> {
    return apiClient.put<WorkScheduleItem[], { schedules: WorkScheduleItem[] }>(
      `/api/v1/doctors/${id}/schedules`,
      { schedules }
    );
  },

  async removeWorkSchedule(id: string, payload: RemoveWorkScheduleRequest): Promise<WorkScheduleItem[]> {
    return apiClient.delete<WorkScheduleItem[]>(
      `/api/v1/doctors/${id}/schedules`,
      {
        body: JSON.stringify(payload)
      }
    );
  }
};
