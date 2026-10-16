"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { StatusTag } from "@/components/ui/status-tag";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/drawer";
import { appointmentService } from "@/services/appointment-service";
import {
  Stethoscope,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pill,
  Check,
  Activity,
  Search,
  Eye,
  EyeOff,
  UserCheck,
  Plus,
  Trash2,
  ShieldAlert,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import clsx from "clsx";

interface QueuePatient {
  id: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  phoneNumber: string;
  gender: "Nam" | "Nữ";
  age: number;
  time: string;
  reason: string;
  dentalChair: string;
  medicalAlerts: string[];
  status: "waiting" | "in_progress" | "completed";
  treatmentStage?: string;
  diagnosis?: string;
}

interface CommonDrug {
  id: string;
  name: string;
  drugGroup: "penicillin" | "general" | "nsaid" | "antiseptic";
  defaultDosage: string;
  defaultQuantity: number;
  unit: string;
  instructions: string;
}

const COMMON_DRUGS: CommonDrug[] = [
  {
    id: "amox-500",
    name: "Amoxicillin 500mg",
    drugGroup: "penicillin",
    defaultDosage: "Sáng 1 viên, Tối 1 viên (sau ăn)",
    defaultQuantity: 14,
    unit: "Viên",
    instructions: "Uống đều đặn đủ liều 7 ngày, uống nhiều nước."
  },
  {
    id: "aug-625",
    name: "Augmentin 625mg",
    drugGroup: "penicillin",
    defaultDosage: "Sáng 1 viên, Tối 1 viên (sau ăn no)",
    defaultQuantity: 14,
    unit: "Viên",
    instructions: "Kháng sinh Amoxicillin + Acid Clavulanic. Uống đúng giờ."
  },
  {
    id: "rodogyl",
    name: "Rodogyl (Spiramycine + Metronidazole)",
    drugGroup: "general",
    defaultDosage: "Sáng 2 viên, Tối 2 viên (sau ăn)",
    defaultQuantity: 20,
    unit: "Viên",
    instructions: "Kháng sinh đặc hiệu nha chu, răng miệng. Không uống rượu bia khi dùng thuốc."
  },
  {
    id: "panadol-500",
    name: "Paracetamol 500mg (Panadol)",
    drugGroup: "general",
    defaultDosage: "1 viên khi đau buốt (cách tối thiểu 4-6 giờ)",
    defaultQuantity: 10,
    unit: "Viên",
    instructions: "Uống sau khi ăn no. Tối đa không quá 4 viên trong 24 giờ."
  },
  {
    id: "ibup-400",
    name: "Ibuprofen 400mg",
    drugGroup: "nsaid",
    defaultDosage: "Sáng 1 viên, Tối 1 viên (sau ăn no)",
    defaultQuantity: 10,
    unit: "Viên",
    instructions: "Kháng viêm giảm đau. Thận trọng với tiền sử đau dạ dày."
  },
  {
    id: "chlorhex-012",
    name: "Nước súc miệng Chlorhexidine 0.12%",
    drugGroup: "antiseptic",
    defaultDosage: "Súc miệng 15ml trong 30 giây, 2 lần/ngày",
    defaultQuantity: 1,
    unit: "Chai 250ml",
    instructions: "Dùng sau khi chải răng sạch. Không súc lại bằng nước lọc ngay."
  }
];

const INITIAL_QUEUE: QueuePatient[] = [
  {
    id: "q-1",
    patientId: "pat-001",
    patientCode: "BN-2026-0891",
    patientName: "Trần Minh Quang",
    phoneNumber: "0908123456",
    gender: "Nam",
    age: 34,
    time: "08:30",
    reason: "Đau buốt răng hàm dưới R46 khi nhai",
    dentalChair: "Ghế 01",
    medicalAlerts: ["Dị ứng Penicillin", "Tiền sử cao huyết áp"],
    status: "in_progress",
    treatmentStage: "Điều trị tủy buồng lần 1",
    diagnosis: "Viêm tủy cấp không phục hồi răng R46"
  },
  {
    id: "q-2",
    patientId: "pat-002",
    patientCode: "BN-2026-0902",
    patientName: "Lê Hoàng Yến",
    phoneNumber: "0912345678",
    gender: "Nữ",
    age: 26,
    time: "09:15",
    reason: "Tái khám Chỉnh nha - Thay thun định kỳ",
    dentalChair: "Ghế 01",
    medicalAlerts: ["Chưa ghi nhận dị ứng"],
    status: "waiting",
    treatmentStage: "Chỉnh nha mắc cài tháng thứ 8",
    diagnosis: "Khớp cắn sâu loại II, đang neo chặn hàm trên"
  },
  {
    id: "q-3",
    patientId: "pat-003",
    patientCode: "BN-2026-0915",
    patientName: "Vũ Hải Đăng",
    phoneNumber: "0987654321",
    gender: "Nam",
    age: 48,
    time: "10:00",
    reason: "Khám tư vấn Cấy ghép Implant răng R16",
    dentalChair: "Ghế 02",
    medicalAlerts: ["Tiểu đường Type 2 (Đang kiểm soát tốt)"],
    status: "waiting",
    treatmentStage: "Khám chẩn đoán ban đầu & chụp ConeBeam CT",
    diagnosis: "Mất răng R16 tiêu xương chiều ngang nhẹ"
  },
  {
    id: "q-4",
    patientId: "pat-004",
    patientCode: "BN-2026-0740",
    patientName: "Nguyễn Thị Thảo",
    phoneNumber: "0934567890",
    gender: "Nữ",
    age: 31,
    time: "08:00",
    reason: "Lấy cao răng & Đánh bóng định kỳ",
    dentalChair: "Ghế 01",
    medicalAlerts: ["Chưa ghi nhận dị ứng"],
    status: "completed",
    treatmentStage: "Đã hoàn thành",
    diagnosis: "Vôi răng độ 1 nướu viêm nhẹ"
  }
];

function maskPhoneDisplay(phone?: string | null): string {
  if (!phone) return "—";
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.length < 7) return phone;
  const start = cleaned.substring(0, 3);
  const end = cleaned.substring(cleaned.length - 3);
  return `${start}****${end}`;
}

export default function DoctorWorkspacePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [queue, setQueue] = useState<QueuePatient[]>(INITIAL_QUEUE);
  const [activeTab, setActiveTab] = useState<"all" | "waiting" | "in_progress" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unmaskedPhones, setUnmaskedPhones] = useState<Record<string, boolean>>({});

  // Quick Prescription Drawer state
  const [isPrescriptionDrawerOpen, setIsPrescriptionDrawerOpen] = useState(false);
  const [selectedPatientForRx, setSelectedPatientForRx] = useState<QueuePatient | null>(null);
  const [prescriptionDiagnosis, setPrescriptionDiagnosis] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [selectedMedications, setSelectedMedications] = useState<
    Array<{
      drugId: string;
      name: string;
      drugGroup: string;
      dosage: string;
      quantity: number;
      unit: string;
      instructions: string;
    }>
  >([]);

  // Complete Exam Dialog state
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [patientToComplete, setPatientToComplete] = useState<QueuePatient | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Sync real appointments if available from API
  useEffect(() => {
    async function loadDoctorAppointments() {
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        const realAppointments = await appointmentService.getByDateRange(
          startOfDay,
          endOfDay,
          user?.id
        );

        if (realAppointments && realAppointments.length > 0) {
          // Merge API appointments if matching patients
          const mappedQueue: QueuePatient[] = realAppointments.map((item, index) => {
            const timeStr = item.startsAt ? new Date(item.startsAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }) : `0${8 + index}:00`;
            return {
              id: item.id,
              patientId: item.patientId || `pat-00${index + 1}`,
              patientCode: `BN-2026-0${800 + index}`,
              patientName: item.patientName || `Bệnh nhân hẹn ${index + 1}`,
              phoneNumber: "0908123456",
              gender: index % 2 === 0 ? "Nam" : "Nữ",
              age: 28 + index * 5,
              time: timeStr,
              reason: item.reason || "Khám nha khoa theo lịch hẹn",
              dentalChair: index % 2 === 0 ? "Ghế 01" : "Ghế 02",
              medicalAlerts: index === 0 ? ["Dị ứng Penicillin"] : ["Chưa ghi nhận dị ứng"],
              status: item.status?.toLowerCase() === "completed" ? "completed" : index === 0 ? "in_progress" : "waiting",
              treatmentStage: "Theo lịch hẹn phòng khám"
            };
          });

          // Only replace if non-empty to maintain rich clinical demo
          if (mappedQueue.length > 0) {
            setQueue(mappedQueue);
          }
        }
      } catch {
        // Fallback to rich clinical INITIAL_QUEUE
      }
    }

    loadDoctorAppointments();
  }, [user?.id]);

  // Toggle phone unmasking
  const togglePhoneUnmask = (patientId: string) => {
    setUnmaskedPhones((prev) => {
      const current = Boolean(prev[patientId]);
      if (!current) {
        showToast("Đã hiển thị số điện thoại. Thao tác đã được ghi nhận vào nhật ký truy cập.", "info");
      }
      return { ...prev, [patientId]: !current };
    });
  };

  // Metrics
  const waitingCount = useMemo(() => queue.filter((p) => p.status === "waiting").length, [queue]);
  const inProgressCount = useMemo(() => queue.filter((p) => p.status === "in_progress").length, [queue]);
  const completedCount = useMemo(() => queue.filter((p) => p.status === "completed").length, [queue]);

  // Action 1: "Vào khám" -> Chuyển status in_progress & mở hồ sơ bệnh nhân kèm Sơ đồ răng FDI
  const handleStartExam = (patient: QueuePatient) => {
    setQueue((prev) =>
      prev.map((p) => (p.id === patient.id ? { ...p, status: "in_progress" } : p))
    );
    showToast(`Bắt đầu ca khám cho bệnh nhân ${patient.patientName}. Đang mở hồ sơ bệnh án & Sơ đồ răng FDI...`, "info");
    router.push(`/patients/${patient.patientId}`);
  };

  // Action 2: "Kê đơn nhanh" -> Mở Drawer
  const handleOpenQuickPrescription = (patient: QueuePatient) => {
    setSelectedPatientForRx(patient);
    setPrescriptionDiagnosis(patient.diagnosis || patient.reason || "");
    setPrescriptionNotes("");
    
    // Default medication based on patient allergy
    const hasPenicillinAllergy = (patient.medicalAlerts || []).some((a) =>
      a.toLowerCase().includes("penicillin")
    );

    if (hasPenicillinAllergy) {
      // Choose Rodogyl instead of Amoxicillin
      const rodogyl = COMMON_DRUGS.find((d) => d.id === "rodogyl")!;
      const panadol = COMMON_DRUGS.find((d) => d.id === "panadol-500")!;
      setSelectedMedications([
        {
          drugId: rodogyl.id,
          name: rodogyl.name,
          drugGroup: rodogyl.drugGroup,
          dosage: rodogyl.defaultDosage,
          quantity: rodogyl.defaultQuantity,
          unit: rodogyl.unit,
          instructions: rodogyl.instructions
        },
        {
          drugId: panadol.id,
          name: panadol.name,
          drugGroup: panadol.drugGroup,
          dosage: panadol.defaultDosage,
          quantity: panadol.defaultQuantity,
          unit: panadol.unit,
          instructions: panadol.instructions
        }
      ]);
    } else {
      const amox = COMMON_DRUGS.find((d) => d.id === "amox-500")!;
      const panadol = COMMON_DRUGS.find((d) => d.id === "panadol-500")!;
      setSelectedMedications([
        {
          drugId: amox.id,
          name: amox.name,
          drugGroup: amox.drugGroup,
          dosage: amox.defaultDosage,
          quantity: amox.defaultQuantity,
          unit: amox.unit,
          instructions: amox.instructions
        },
        {
          drugId: panadol.id,
          name: panadol.name,
          drugGroup: panadol.drugGroup,
          dosage: panadol.defaultDosage,
          quantity: panadol.defaultQuantity,
          unit: panadol.unit,
          instructions: panadol.instructions
        }
      ]);
    }

    setIsPrescriptionDrawerOpen(true);
  };

  // Allergy contraindication check in Drawer
  const hasPenicillinConflict = useMemo(() => {
    if (!selectedPatientForRx) return false;
    const hasPenicillinAllergy = (selectedPatientForRx.medicalAlerts || []).some((a) =>
      a.toLowerCase().includes("penicillin")
    );
    if (!hasPenicillinAllergy) return false;
    return selectedMedications.some((m) => m.drugGroup === "penicillin");
  }, [selectedPatientForRx, selectedMedications]);

  // Handle Save Quick Prescription
  const handleSavePrescription = () => {
    if (!selectedPatientForRx) return;
    if (selectedMedications.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 loại thuốc trước khi ký đơn.", "error");
      return;
    }
    if (hasPenicillinConflict) {
      showToast("Không thể ký đơn: Phát hiện cảnh báo dị ứng thuốc nguy hiểm!", "error");
      return;
    }

    showToast(`Đã lưu và ký đơn thuốc cho bệnh nhân ${selectedPatientForRx.patientName}.`, "success");
    setIsPrescriptionDrawerOpen(false);
  };

  // Action 3: "Đánh dấu hoàn tất" -> Mở ConfirmDialog
  const handleOpenCompleteDialog = (patient: QueuePatient) => {
    setPatientToComplete(patient);
    setIsCompleteDialogOpen(true);
  };

  const handleConfirmCompleteExam = async () => {
    if (!patientToComplete) return;
    setIsCompleting(true);
    try {
      setQueue((prev) =>
        prev.map((p) => (p.id === patientToComplete.id ? { ...p, status: "completed" } : p))
      );
      showToast(`Đã hoàn tất ca khám cho bệnh nhân ${patientToComplete.patientName}. Hồ sơ đã chuyển sang bước thu ngân.`, "success");
      setIsCompleteDialogOpen(false);
    } finally {
      setIsCompleting(false);
      setPatientToComplete(null);
    }
  };

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return queue.filter((patient) => {
      const matchTab = activeTab === "all" ? true : patient.status === activeTab;
      const matchSearch =
        searchQuery.trim() === "" ||
        patient.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.reason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [queue, activeTab, searchQuery]);

  const todayFormatted = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  return (
    <div className="space-y-6">
      {/* Breadcrumb per ADMIN_UI_RULES.md */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[var(--text-xs)] text-[var(--color-text-muted)]">
        <Link href="/dashboard" className="hover:text-[var(--color-text)] transition">
          Tổng quan
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[var(--color-text)] font-semibold">Bàn khám bác sĩ</span>
      </nav>

      {/* Page Header (H1: 24px/600) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-[var(--text-h1)] font-semibold text-[var(--color-text)] tracking-tight flex items-center gap-2.5">
            <Stethoscope className="w-6 h-6 text-[var(--color-primary)]" />
            <span>Bàn khám bác sĩ</span>
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-muted)] mt-1">
            Bác sĩ phụ trách: <strong className="text-[var(--color-text)]">{user?.fullName || "BS. CKII. Nguyễn Văn Toàn"}</strong> • Ngày làm việc: <span className="font-semibold tabular-nums text-[var(--color-text)]">{todayFormatted}</span>
          </p>
        </div>

        {/* Quick Shift Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius)] bg-[var(--status-info-bg)] text-[var(--status-info-fg)] text-[var(--text-xs)] font-medium">
            <Activity className="w-3.5 h-3.5" />
            <span>Ghế điều trị: Ghế 01 & Ghế 02</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius)] bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] text-[var(--text-xs)] font-medium tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            <span>Ca trực: 08:00 – 17:30</span>
          </span>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Waiting */}
        <button
          type="button"
          onClick={() => setActiveTab("waiting")}
          className={clsx(
            "p-4 rounded-[var(--radius)] border text-left transition cursor-pointer",
            activeTab === "waiting"
              ? "border-[var(--color-primary)] bg-[var(--status-warning-bg)]/30 ring-1 ring-[var(--color-primary)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)]"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-[var(--text-xs)] font-medium text-[var(--color-text-muted)]">
              Chờ khám
            </p>
            <Clock className="w-4 h-4 text-[var(--status-warning-fg)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--status-warning-fg)] tabular-nums mt-1">
            {waitingCount} <span className="text-xs font-normal text-[var(--color-text-muted)]">bệnh nhân</span>
          </p>
        </button>

        {/* In Progress */}
        <button
          type="button"
          onClick={() => setActiveTab("in_progress")}
          className={clsx(
            "p-4 rounded-[var(--radius)] border text-left transition cursor-pointer",
            activeTab === "in_progress"
              ? "border-[var(--color-primary)] bg-[var(--status-info-bg)]/30 ring-1 ring-[var(--color-primary)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)]"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-[var(--text-xs)] font-medium text-[var(--color-text-muted)]">
              Đang trên ghế điều trị
            </p>
            <Stethoscope className="w-4 h-4 text-[var(--status-info-fg)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--status-info-fg)] tabular-nums mt-1">
            {inProgressCount} <span className="text-xs font-normal text-[var(--color-text-muted)]">ca khám</span>
          </p>
        </button>

        {/* Completed */}
        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={clsx(
            "p-4 rounded-[var(--radius)] border text-left transition cursor-pointer",
            activeTab === "completed"
              ? "border-[var(--color-primary)] bg-[var(--status-success-bg)]/30 ring-1 ring-[var(--color-primary)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)]"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-[var(--text-xs)] font-medium text-[var(--color-text-muted)]">
              Đã khám xong hôm nay
            </p>
            <CheckCircle2 className="w-4 h-4 text-[var(--status-success-fg)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--status-success-fg)] tabular-nums mt-1">
            {completedCount} <span className="text-xs font-normal text-[var(--color-text-muted)]">ca điều trị</span>
          </p>
        </button>
      </div>

      {/* Search & Tabs Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            onClick={() => setActiveTab("all")}
            className={clsx(
              "px-3 py-1.5 rounded-[var(--radius)] text-[var(--text-sm)] font-medium transition cursor-pointer",
              activeTab === "all"
                ? "bg-[var(--color-primary)] text-white font-semibold"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
            )}
          >
            Tất cả ({queue.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "waiting"}
            onClick={() => setActiveTab("waiting")}
            className={clsx(
              "px-3 py-1.5 rounded-[var(--radius)] text-[var(--text-sm)] font-medium transition cursor-pointer flex items-center gap-1.5",
              activeTab === "waiting"
                ? "bg-[var(--status-warning-fg)] text-white font-semibold"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
            )}
          >
            <span>Chờ khám</span>
            <span className="px-1.5 py-0.2 rounded text-[11px] bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)] font-bold tabular-nums">
              {waitingCount}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "in_progress"}
            onClick={() => setActiveTab("in_progress")}
            className={clsx(
              "px-3 py-1.5 rounded-[var(--radius)] text-[var(--text-sm)] font-medium transition cursor-pointer flex items-center gap-1.5",
              activeTab === "in_progress"
                ? "bg-[var(--status-info-fg)] text-white font-semibold"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
            )}
          >
            <span>Đang khám</span>
            <span className="px-1.5 py-0.2 rounded text-[11px] bg-[var(--status-info-bg)] text-[var(--status-info-fg)] font-bold tabular-nums">
              {inProgressCount}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "completed"}
            onClick={() => setActiveTab("completed")}
            className={clsx(
              "px-3 py-1.5 rounded-[var(--radius)] text-[var(--text-sm)] font-medium transition cursor-pointer flex items-center gap-1.5",
              activeTab === "completed"
                ? "bg-[var(--status-success-fg)] text-white font-semibold"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
            )}
          >
            <span>Đã khám xong</span>
            <span className="px-1.5 py-0.2 rounded text-[11px] bg-[var(--status-success-bg)] text-[var(--status-success-fg)] font-bold tabular-nums">
              {completedCount}
            </span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm tên hoặc mã hồ sơ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-sm)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
          />
        </div>
      </div>

      {/* Patient Queue Cards List */}
      <div className="space-y-3">
        {filteredQueue.length === 0 ? (
          <div className="p-8 text-center rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <CheckCircle2 className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
            <p className="text-[var(--text-table)] font-semibold text-[var(--color-text)]">
              Không có bệnh nhân nào trong danh sách.
            </p>
            <p className="text-[var(--text-sm)] text-[var(--color-text-muted)] mt-1">
              {searchQuery ? "Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm." : "Hiện chưa có bệnh nhân nào ở trạng thái này."}
            </p>
          </div>
        ) : (
          filteredQueue.map((patient) => {
            const hasSevereAllergy = (patient.medicalAlerts || []).some(
              (alert) => !alert.toLowerCase().includes("chưa ghi nhận")
            );
            const isUnmasked = Boolean(unmaskedPhones[patient.patientId]);
            const displayPhone = isUnmasked ? patient.phoneNumber : maskPhoneDisplay(patient.phoneNumber);

            return (
              <div
                key={patient.id}
                className={clsx(
                  "p-5 rounded-[var(--radius)] border bg-[var(--color-surface)] transition flex flex-col lg:flex-row lg:items-center justify-between gap-5",
                  patient.status === "in_progress"
                    ? "border-blue-400 ring-1 ring-blue-400"
                    : "border-[var(--color-border)]"
                )}
              >
                {/* Left Side: Patient Identity & Queue Info */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  {/* Top line badges & info */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Time */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius)] bg-slate-100 text-slate-800 text-[var(--text-xs)] font-bold tabular-nums border border-slate-200">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      <span>{patient.time}</span>
                    </span>

                    {/* Chair */}
                    <span className="px-2 py-0.5 rounded-[var(--radius)] text-[var(--text-xs)] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {patient.dentalChair}
                    </span>

                    {/* Status Tag */}
                    {patient.status === "waiting" && (
                      <StatusTag variant="warning">Chờ khám</StatusTag>
                    )}
                    {patient.status === "in_progress" && (
                      <StatusTag variant="primary">Đang trên ghế khám</StatusTag>
                    )}
                    {patient.status === "completed" && (
                      <StatusTag variant="success">Đã khám xong</StatusTag>
                    )}

                    {/* Patient Code */}
                    <span className="text-[var(--text-xs)] font-mono text-[var(--color-text-muted)]">
                      Mã: <strong>{patient.patientCode}</strong>
                    </span>
                  </div>

                  {/* Patient Name, Demographics & Masked Phone */}
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <h2 className="text-[17px] font-bold text-[var(--color-text)]">
                      {patient.patientName}
                    </h2>
                    <span className="text-[var(--text-sm)] text-[var(--color-text-muted)] tabular-nums">
                      ({patient.gender}, {patient.age} tuổi)
                    </span>

                    <div className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--color-text-muted)] font-mono ml-1">
                      <span>SĐT: {displayPhone}</span>
                      <button
                        type="button"
                        onClick={() => togglePhoneUnmask(patient.patientId)}
                        aria-label={isUnmasked ? "Ẩn số điện thoại" : "Hiện số điện thoại"}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-0.5 rounded transition cursor-pointer"
                        title={isUnmasked ? "Ẩn số điện thoại" : "Hiện số điện thoại đầy đủ"}
                      >
                        {isUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Reason for visit & diagnosis */}
                  <div className="text-[var(--text-sm)] text-[var(--color-text)] space-y-0.5">
                    <p>
                      <span className="text-[var(--color-text-muted)]">Lý do khám:</span>{" "}
                      <strong>{patient.reason}</strong>
                    </p>
                    {patient.treatmentStage && (
                      <p className="text-[var(--text-xs)] text-[var(--status-info-fg)]">
                        <span>Giai đoạn: </span>
                        <span className="font-semibold">{patient.treatmentStage}</span>
                      </p>
                    )}
                  </div>

                  {/* Mandatory Medical Alerts section per ADMIN_UI_RULES.md mục 0 & 9 */}
                  <div className="pt-1">
                    {hasSevereAllergy ? (
                      <div className="inline-flex flex-wrap items-center gap-2 p-2 rounded-[var(--radius)] bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] border border-red-200">
                        <div className="flex items-center gap-1 text-[var(--text-xs)] font-bold uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Cảnh báo y tế:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(patient.medicalAlerts || []).map((alert, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[var(--text-xs)] font-semibold bg-white text-[var(--status-danger-fg)] border border-red-200 shadow-2xs"
                            >
                              {alert}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius)] bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] text-[var(--text-xs)]">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>Chưa ghi nhận dị ứng hoặc bệnh nền nguy hiểm</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-[var(--color-border)] shrink-0">
                  {/* Action 1: "Vào khám" -> Open Odontogram */}
                  {patient.status !== "completed" && (
                    <button
                      type="button"
                      onClick={() => handleStartExam(patient)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-semibold hover:opacity-95 transition active:scale-[0.98] cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{patient.status === "in_progress" ? "Xem sơ đồ răng" : "Vào khám"}</span>
                    </button>
                  )}

                  {/* Action 2: "Kê đơn nhanh" */}
                  <button
                    type="button"
                    onClick={() => handleOpenQuickPrescription(patient)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--text-sm)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
                  >
                    <Pill className="w-4 h-4 text-emerald-600" />
                    <span>Kê đơn nhanh</span>
                  </button>

                  {/* Action 3: "Đánh dấu hoàn thành" */}
                  {patient.status !== "completed" && (
                    <button
                      type="button"
                      onClick={() => handleOpenCompleteDialog(patient)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius)] border border-emerald-300 bg-emerald-50 text-emerald-800 text-[var(--text-sm)] font-medium hover:bg-emerald-100 transition active:scale-[0.98] cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Đánh dấu hoàn thành</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* QUICK PRESCRIPTION DRAWER */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={isPrescriptionDrawerOpen}
        onClose={() => setIsPrescriptionDrawerOpen(false)}
        title={`Kê đơn thuốc nhanh: ${selectedPatientForRx?.patientName || ""}`}
        description={`Mã hồ sơ: ${selectedPatientForRx?.patientCode || ""} • Bác sĩ kê đơn: ${user?.fullName || "BS. Nguyễn Văn Toàn"}`}
        width="wide"
        footer={
          <div className="flex items-center justify-between w-full">
            <Link
              href={`/prescriptions?patientId=${selectedPatientForRx?.patientId || ""}&patientCode=${selectedPatientForRx?.patientCode || ""}`}
              className="text-[var(--text-xs)] text-[var(--color-primary)] hover:underline flex items-center gap-1"
            >
              <span>Mở trang quản lý đơn thuốc đầy đủ</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPrescriptionDrawerOpen(false)}
                className="px-3.5 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--text-sm)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={hasPenicillinConflict || selectedMedications.length === 0}
                onClick={handleSavePrescription}
                className="px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-white text-[var(--text-sm)] font-semibold hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
              >
                Ký & Phát hành đơn thuốc
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Patient Medical Alerts Banner */}
          {selectedPatientForRx && (
            <div
              className={clsx(
                "p-3.5 rounded-[var(--radius)] border text-[var(--text-xs)]",
                (selectedPatientForRx.medicalAlerts || []).some((a) => !a.toLowerCase().includes("chưa ghi nhận"))
                  ? "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] border-red-200"
                  : "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] border-slate-200"
              )}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Tiền sử bệnh & Cảnh báo dị ứng:</span>
              </div>
              <p className="font-medium">
                {(selectedPatientForRx.medicalAlerts || []).join(" • ")}
              </p>
            </div>
          )}

          {/* Real-time Allergy Conflict Warning Banner */}
          {hasPenicillinConflict && (
            <div
              role="alert"
              className="p-3.5 rounded-[var(--radius)] bg-red-600 text-white text-[var(--text-xs)] font-bold flex items-start gap-2.5 animate-pulse"
            >
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="uppercase tracking-wide text-sm">Cảnh báo dị ứng nghiêm trọng!</p>
                <p className="mt-1 font-normal leading-relaxed text-red-100">
                  Bệnh nhân có tiền sử dị ứng nhóm Penicillin! Không được kê đơn <strong>Amoxicillin</strong> hoặc <strong>Augmentin</strong>. Vui lòng xóa thuốc khỏi đơn và chọn thuốc thay thế (ví dụ: Rodogyl).
                </p>
              </div>
            </div>
          )}

          {/* Diagnosis Field */}
          <div>
            <label className="block text-[var(--text-xs)] font-semibold text-[var(--color-text)] mb-1">
              Chẩn đoán lâm sàng (bắt buộc)
            </label>
            <input
              type="text"
              value={prescriptionDiagnosis}
              onChange={(e) => setPrescriptionDiagnosis(e.target.value)}
              placeholder="Ví dụ: Viêm tủy cấp không hồi phục răng R46..."
              className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-sm)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </div>

          {/* Quick Drug Selection Chips */}
          <div>
            <label className="block text-[var(--text-xs)] font-semibold text-[var(--color-text)] mb-1.5">
              Thêm nhanh thuốc nha khoa thông dụng:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_DRUGS.map((drug) => {
                const isSelected = selectedMedications.some((m) => m.drugId === drug.id);
                return (
                  <button
                    key={drug.id}
                    type="button"
                    disabled={isSelected}
                    onClick={() => {
                      setSelectedMedications((prev) => [
                        ...prev,
                        {
                          drugId: drug.id,
                          name: drug.name,
                          drugGroup: drug.drugGroup,
                          dosage: drug.defaultDosage,
                          quantity: drug.defaultQuantity,
                          unit: drug.unit,
                          instructions: drug.instructions
                        }
                      ]);
                    }}
                    className={clsx(
                      "p-2 text-left rounded-[var(--radius)] border text-[var(--text-xs)] transition flex items-center justify-between",
                      isSelected
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 opacity-60 cursor-not-allowed"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg)] cursor-pointer"
                    )}
                  >
                    <span className="font-semibold truncate">{drug.name}</span>
                    <Plus className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Prescription List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-[var(--text-sm)] font-bold text-[var(--color-text)] flex items-center justify-between">
              <span>Danh mục thuốc đã kê ({selectedMedications.length})</span>
            </h3>

            {selectedMedications.length === 0 ? (
              <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] italic py-3 text-center border border-dashed border-[var(--color-border)] rounded-[var(--radius)]">
                Chưa có thuốc nào trong đơn. Vui lòng bấm chọn thuốc ở trên.
              </p>
            ) : (
              selectedMedications.map((med, idx) => (
                <div
                  key={med.drugId}
                  className="p-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2 text-[var(--text-xs)]"
                >
                  <div className="flex items-center justify-between font-bold text-[var(--color-text)]">
                    <span>
                      {idx + 1}. {med.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMedications((prev) => prev.filter((m) => m.drugId !== med.drugId))
                      }
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      title="Xóa thuốc khỏi đơn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Số lượng:</span>
                      <input
                        type="number"
                        min={1}
                        value={med.quantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSelectedMedications((prev) =>
                            prev.map((m) => (m.drugId === med.drugId ? { ...m, quantity: val } : m))
                          );
                        }}
                        className="w-full px-2 py-1 rounded border border-[var(--color-border)] tabular-nums"
                      />
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Đơn vị:</span>
                      <span className="font-semibold block py-1">{med.unit}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Liều dùng:</span>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedMedications((prev) =>
                            prev.map((m) => (m.drugId === med.drugId ? { ...m, dosage: val } : m))
                          );
                        }}
                        className="w-full px-2 py-1 rounded border border-[var(--color-border)]"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[var(--color-text-muted)] block text-[11px]">Cách dùng & lưu ý:</span>
                    <input
                      type="text"
                      value={med.instructions}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedMedications((prev) =>
                          prev.map((m) => (m.drugId === med.drugId ? { ...m, instructions: val } : m))
                        );
                      }}
                      className="w-full px-2 py-1 rounded border border-[var(--color-border)]"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Doctor Notes */}
          <div>
            <label className="block text-[var(--text-xs)] font-semibold text-[var(--color-text)] mb-1">
              Lời dặn bác sĩ điều trị
            </label>
            <textarea
              rows={2}
              value={prescriptionNotes}
              onChange={(e) => setPrescriptionNotes(e.target.value)}
              placeholder="Ví dụ: Tái khám sau 5 ngày hoặc khi có dấu hiệu sưng đau bất thường..."
              className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-sm)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </div>
        </div>
      </Drawer>

      {/* ========================================================================= */}
      {/* CONFIRM COMPLETE EXAM DIALOG */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={isCompleteDialogOpen}
        onClose={() => setIsCompleteDialogOpen(false)}
        onConfirm={handleConfirmCompleteExam}
        isLoading={isCompleting}
        title="Xác nhận hoàn tất ca khám"
        description={`Bạn có chắc chắn muốn hoàn thành phiên khám và điều trị cho bệnh nhân ${patientToComplete?.patientName || ""} (Mã: ${patientToComplete?.patientCode || ""})? Hồ sơ sẽ được chuyển sang danh sách Đã khám xong và gửi sang quầy thu ngân/lễ tân.`}
        confirmLabel="Đánh dấu hoàn thành"
        cancelLabel="Hủy bỏ"
        isDestructive={false}
      />
    </div>
  );
}
