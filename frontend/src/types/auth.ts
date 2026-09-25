export interface User {
  id: string;
  email: string;
  fullName: string;
  activeClinicId: string | null;
  roles: string[];
  permissions: string[];
  assignedClinicIds: string[];
  phoneNumber?: string;
  patientCode?: string;
}

export interface PatientUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  patientCode?: string;
  roles: string[];
  email?: string;
  permissions?: string[];
  activeClinicId?: string | null;
  assignedClinicIds?: string[];
}

export interface SendOtpRequest {
  phoneNumber: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
}


export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  clinicId?: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface SwitchClinicRequest {
  targetClinicId: string;
}

export interface SwitchClinicResponse {
  accessToken: string;
  expiresIn: number;
  clinicId: string;
  roles: string[];
  permissions: string[];
}
