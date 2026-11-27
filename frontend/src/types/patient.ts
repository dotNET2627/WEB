export interface PatientListItem {
  id: string;
  clinicId?: string;
  patientCode?: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string; // ISO date string or yyyy-MM-dd
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientDetail extends PatientListItem {
  gender?: string;
  address?: string;
  emergencyContact?: {
    fullName?: string;
    phoneNumber?: string;
    relationship?: string;
  };
  medicalHistory?: MedicalHistoryItem[];
  odontogram?: ToothCondition[];
}

export interface CreatePatientRequest {
  fullName: string;
  patientCode?: string;
  phoneNumber?: string;
  dateOfBirth?: string; // yyyy-MM-dd
}

export interface UpdatePatientRequest {
  fullName: string;
  patientCode?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

// 5 Anatomical Surfaces: Mesial (Gần), Distal (Xa), Occlusal/Incisal (Nhai), Buccal/Vestibular (Ngoài), Lingual/Palatal (Trong)
export type ToothSurface = "M" | "D" | "O" | "B" | "L";

export type ToothConditionType =
  | "healthy"     // Khỏe mạnh
  | "caries"      // Sâu răng (Đỏ)
  | "filled"      // Đã trám (Xanh dương)
  | "extracted"   // Đã nhổ (Gạch chéo xám)
  | "crown"       // Răng sứ (Cam/Hổ phách)
  | "root_canal"  // Điều trị tủy (Tím)
  | "bridge"      // Cầu răng
  | "implant";    // Cấy ghép Implant

export interface ToothCondition {
  toothNumber: number; // 11-48 (Vĩnh viễn), 51-85 (Răng sữa)
  condition: ToothConditionType;
  surfaces?: ToothSurface[];
  notes?: string;
  updatedAt?: string;
}

export interface MedicalHistoryItem {
  id: string;
  type: "allergy" | "chronic" | "medication" | "other";
  name: string;
  severity: "mild" | "moderate" | "severe";
  notes?: string;
  createdAt: string;
}

export type MedicalImageType =
  | "xray"        // Phim X-quang
  | "intraoral"    // Ảnh trong miệng
  | "extraoral";   // Ảnh ngoài mặt

export interface MedicalImage {
  id: string;
  patientId: string;
  type: MedicalImageType;
  title: string;
  url: string;
  contentType: string;
  toothNumber?: number;
  capturedAt: string | null;
  notes?: string;
  comparisonRole?: "before" | "after" | "regular";
}

export interface PatientAppointmentRecord {
  id: string;
  appointmentDate: string; // dd/MM/yyyy HH:mm
  doctorName: string;
  serviceName: string;
  status: "completed" | "scheduled" | "in_progress" | "cancelled" | "no_show";
  diagnosisNotes?: string;
}
