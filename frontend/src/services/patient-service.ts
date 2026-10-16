import { apiClient } from "@/lib/api-client";
import type { PagedResponse } from "@/types/api";
import type {
  PatientListItem,
  PatientDetail,
  CreatePatientRequest,
  UpdatePatientRequest,
  ToothCondition,
  ToothConditionType,
  ToothSurface,
  MedicalImage,
  MedicalHistoryItem
} from "@/types/patient";

// Local storage helper for client persistence fallback when backend sub-resources are pending API deployment
const STORAGE_PREFIX = "dental_patient_data_";

function getLocalStore<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalStore<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export const patientService = {
  // 1. Patient List & Pagination
  getPatients: async (params?: { page?: number; pageSize?: number; search?: string }): Promise<PagedResponse<PatientListItem>> => {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const search = params?.search ? encodeURIComponent(params.search) : "";
    const query = `page=${page}&pageSize=${pageSize}${search ? `&search=${search}` : ""}`;
    return apiClient.get<PagedResponse<PatientListItem>>(`/api/v1/patients?${query}`);
  },

  getPage: async (page = 1, pageSize = 20): Promise<PagedResponse<PatientListItem>> => {
    return patientService.getPatients({ page, pageSize });
  },

  // 2. Patient Details
  getById: async (id: string): Promise<PatientDetail> => {
    try {
      const data = await apiClient.get<PatientDetail>(`/api/v1/patients/${id}`);
      // Merge local medical history and odontogram if present
      const localHistory = getLocalStore<MedicalHistoryItem[]>(`history_${id}`, []);
      const localOdontogram = getLocalStore<ToothCondition[]>(`odontogram_${id}`, []);
      return {
        ...data,
        medicalHistory: data.medicalHistory?.length ? data.medicalHistory : localHistory,
        odontogram: data.odontogram?.length ? data.odontogram : localOdontogram
      };
    } catch {
      // Fallback for mocked or offline development
      const localHistory = getLocalStore<MedicalHistoryItem[]>(`history_${id}`, [
        {
          id: "mh-1",
          type: "allergy",
          name: "Dị ứng Penicillin",
          severity: "severe",
          notes: "Gây sốc phản vệ và nổi mề đay cấp tính",
          createdAt: new Date().toISOString()
        },
        {
          id: "mh-2",
          type: "chronic",
          name: "Tiền sử cao huyết áp",
          severity: "moderate",
          notes: "Cần đo huyết áp trước khi tiêm thuốc tê có Adrenaline",
          createdAt: new Date().toISOString()
        }
      ]);

      return {
        id,
        fullName: "Bệnh nhân mẫu",
        patientCode: "BN-0001",
        phoneNumber: "0901234567",
        dateOfBirth: "1990-05-15",
        createdAt: new Date().toISOString(),
        medicalHistory: localHistory,
        odontogram: getLocalStore<ToothCondition[]>(`odontogram_${id}`, [])
      };
    }
  },

  // 3. Create Patient
  create: async (data: CreatePatientRequest): Promise<{ id: string }> => {
    const res = await apiClient.post<{ id: string }, CreatePatientRequest>("/api/v1/patients", data);
    return res;
  },

  // 4. Update Patient
  update: async (id: string, data: UpdatePatientRequest): Promise<PatientDetail> => {
    return apiClient.put<PatientDetail, UpdatePatientRequest>(`/api/v1/patients/${id}`, data);
  },

  // 5. Delete Patient (Soft delete)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/api/v1/patients/${id}`);
  },

  // 6. Odontogram APIs
  getOdontogram: async (patientId: string): Promise<ToothCondition[]> => {
    try {
      return await apiClient.get<ToothCondition[]>(`/api/v1/patients/${patientId}/odontogram`);
    } catch {
      // Fallback to local storage for patient
      return getLocalStore<ToothCondition[]>(`odontogram_${patientId}`, [
        { toothNumber: 16, condition: "caries", surfaces: ["O", "M"], notes: "Sâu ngà nông mặt nhai và gần" },
        { toothNumber: 26, condition: "filled", surfaces: ["O"], notes: "Trám Composite năm 2024" },
        { toothNumber: 36, condition: "crown", surfaces: ["O", "B", "L", "M", "D"], notes: "Bọc răng sứ Zirconia" },
        { toothNumber: 48, condition: "extracted", surfaces: [], notes: "Đã nhổ răng khôn mọc lệch" }
      ]);
    }
  },

  updateTooth: async (
    patientId: string,
    toothNumber: number,
    data: { condition: ToothConditionType; surfaces?: ToothSurface[]; notes?: string }
  ): Promise<ToothCondition> => {
    const payload: ToothCondition = {
      toothNumber,
      condition: data.condition,
      surfaces: data.surfaces || [],
      notes: data.notes || "",
      updatedAt: new Date().toISOString()
    };

    try {
      return await apiClient.put<ToothCondition, ToothCondition>(
        `/api/v1/patients/${patientId}/odontogram/${toothNumber}`,
        payload
      );
    } catch {
      // Fallback update in local storage
      const current = getLocalStore<ToothCondition[]>(`odontogram_${patientId}`, []);
      const index = current.findIndex((t) => t.toothNumber === toothNumber);
      let updated: ToothCondition[];
      if (index >= 0) {
        if (data.condition === "healthy") {
          updated = current.filter((t) => t.toothNumber !== toothNumber);
        } else {
          updated = [...current];
          updated[index] = payload;
        }
      } else if (data.condition !== "healthy") {
        updated = [...current, payload];
      } else {
        updated = current;
      }
      setLocalStore(`odontogram_${patientId}`, updated);
      return payload;
    }
  },

  // 7. Medical History APIs
  getMedicalHistory: async (patientId: string): Promise<MedicalHistoryItem[]> => {
    try {
      return await apiClient.get<MedicalHistoryItem[]>(`/api/v1/patients/${patientId}/medical-history`);
    } catch {
      return getLocalStore<MedicalHistoryItem[]>(`history_${patientId}`, [
        {
          id: "hist-1",
          type: "allergy",
          name: "Dị ứng Penicillin",
          severity: "severe",
          notes: "Tiền sử nổi mề đay và khó thở khi dùng kháng sinh nhóm Beta-lactam",
          createdAt: new Date().toISOString()
        },
        {
          id: "hist-2",
          type: "chronic",
          name: "Bệnh tim mạch (Hẹp van tim)",
          severity: "moderate",
          notes: "Cần dùng kháng sinh dự phòng trước khi cạo vôi răng hoặc nhổ răng",
          createdAt: new Date().toISOString()
        }
      ]);
    }
  },

  addMedicalHistory: async (
    patientId: string,
    item: Omit<MedicalHistoryItem, "id" | "createdAt">
  ): Promise<MedicalHistoryItem> => {
    const newItem: MedicalHistoryItem = {
      ...item,
      id: `mh-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    try {
      return await apiClient.post<MedicalHistoryItem, typeof newItem>(
        `/api/v1/patients/${patientId}/medical-history`,
        newItem
      );
    } catch {
      const current = getLocalStore<MedicalHistoryItem[]>(`history_${patientId}`, []);
      const updated = [newItem, ...current];
      setLocalStore(`history_${patientId}`, updated);
      return newItem;
    }
  },

  deleteMedicalHistory: async (patientId: string, itemId: string): Promise<void> => {
    try {
      await apiClient.delete<void>(`/api/v1/patients/${patientId}/medical-history/${itemId}`);
    } catch {
      const current = getLocalStore<MedicalHistoryItem[]>(`history_${patientId}`, []);
      const updated = current.filter((h) => h.id !== itemId);
      setLocalStore(`history_${patientId}`, updated);
    }
  },

  // 8. Medical Images & X-Ray APIs
  getMedicalImages: async (patientId: string): Promise<MedicalImage[]> => {
    try {
      return await apiClient.get<MedicalImage[]>(`/api/v1/patients/${patientId}/images`);
    } catch {
      // Default demo initial clinical assets
      return getLocalStore<MedicalImage[]>(`images_${patientId}`, [
        {
          id: "img-1",
          patientId,
          type: "panorex",
          title: "Phim toàn cảnh Panorama kiểm tra xương hàm",
          imageUrl: "/images/samples/panorex-sample.svg",
          capturedDate: "12/03/2026",
          notes: "Răng khôn 48 mọc lệch 90 độ chèn ép chân răng 47",
          comparisonRole: "before"
        },
        {
          id: "img-2",
          patientId,
          type: "periapical",
          title: "Phim chóp răng 16 kiểm tra chân răng",
          imageUrl: "/images/samples/periapical-sample.svg",
          toothNumber: 16,
          capturedDate: "15/03/2026",
          notes: "Nang chân răng kích thước 2mm, cần điều trị nội nha",
          comparisonRole: "before"
        },
        {
          id: "img-3",
          patientId,
          type: "periapical",
          title: "Phim chóp răng 16 sau khi trám tủy bít ống tủy",
          imageUrl: "/images/samples/periapical-sample.svg",
          toothNumber: 16,
          capturedDate: "10/04/2026",
          notes: "Bít kín 3 ống tủy bằng Gutta-percha đạt chuẩn",
          comparisonRole: "after"
        }
      ]);
    }
  },

  uploadMedicalImage: async (patientId: string, data: Omit<MedicalImage, "id">): Promise<MedicalImage> => {
    const newImage: MedicalImage = {
      ...data,
      id: `img-${Date.now()}`
    };

    try {
      return await apiClient.post<MedicalImage, typeof newImage>(
        `/api/v1/patients/${patientId}/images`,
        newImage
      );
    } catch {
      const current = getLocalStore<MedicalImage[]>(`images_${patientId}`, []);
      const updated = [newImage, ...current];
      setLocalStore(`images_${patientId}`, updated);
      return newImage;
    }
  },

  deleteMedicalImage: async (patientId: string, imageId: string): Promise<void> => {
    try {
      await apiClient.delete<void>(`/api/v1/patients/${patientId}/images/${imageId}`);
    } catch {
      const current = getLocalStore<MedicalImage[]>(`images_${patientId}`, []);
      const updated = current.filter((img) => img.id !== imageId);
      setLocalStore(`images_${patientId}`, updated);
    }
  }
};
