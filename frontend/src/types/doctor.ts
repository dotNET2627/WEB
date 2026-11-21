export interface WorkScheduleItem {
  id?: string | null;
  clinicId?: string | null;
  clinicName?: string | null;
  dayOfWeek: number; // 1 = Monday, ..., 7 = Sunday
  dayOfWeekName?: string | null;
  startTime: string; // HH:mm (24h)
  endTime: string;   // HH:mm (24h)
  isActive?: boolean;
}

export interface Doctor {
  id: string;
  userId: string;
  clinicId?: string | null;
  clinicName?: string | null;
  medicalLicenseNumber: string;
  yearsOfExperience: number;
  specialty?: string | null;
  biography?: string | null;
  doctorName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  workSchedules: WorkScheduleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DoctorListResponse {
  items: Doctor[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateDoctorRequest {
  userId: string;
  clinicId: string;
  medicalLicenseNumber: string;
  yearsOfExperience: number;
  specialty?: string;
  biography?: string;
}

export interface UpdateDoctorRequest {
  medicalLicenseNumber: string;
  yearsOfExperience: number;
  specialty?: string;
  biography?: string;
}

export interface AssignWorkScheduleRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface RemoveWorkScheduleRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}
