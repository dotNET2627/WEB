"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Pill,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Printer,
  Trash2
} from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { inventoryService } from "@/services/inventory-service";
import { prescriptionService } from "@/services/prescription-service";
import type { InventoryItem } from "@/types/inventory";
import type { PrescriptionDto, PrescriptionStatus } from "@/types/prescription";

interface PrescribedMedication {
  id: string;
  inventoryItemId?: string | null;
  name: string;
  dosage: string;
  quantity: number;
  unit: string;
  instructions: string;
}

interface Prescription {
  id: string;
  code: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  doctorName: string;
  createdDate: string;
  rawCreatedAt: string;
  diagnosis: string;
  medications: PrescribedMedication[];
  status: PrescriptionStatus;
  medicalNotes?: string;
}

function mapDtoToView(dto: PrescriptionDto): Prescription {
  return {
    id: dto.id,
    code: dto.code,
    patientId: dto.patientId,
    patientName: dto.patientName,
    patientCode: dto.patientCode ?? "—",
    doctorName: dto.doctorName,
    createdDate: new Date(dto.createdAt).toLocaleString("vi-VN"),
    rawCreatedAt: dto.createdAt,
    diagnosis: dto.diagnosis,
    status: dto.status,
    medicalNotes: dto.medicalNotes ?? undefined,
    medications: dto.items.map((item, idx) => ({
      id: `${dto.id}-${idx}`,
      inventoryItemId: item.inventoryItemId,
      name: item.medicationName,
      dosage: item.dosage,
      quantity: item.quantity,
      unit: item.unit,
      instructions: item.instructions
    }))
  };
}

const COMMON_DRUGS = [
  { name: "Amoxicillin 500mg", type: "Kháng sinh nhóm Penicillin", defaultUnit: "Viên", defaultQty: 14, defaultMorning: 1, defaultNoon: 0, defaultAfternoon: 0, defaultEvening: 1, defaultMeal: "Uống sau ăn no", allergyGroup: "penicillin" },
  { name: "Augmentin 625mg", type: "Kháng sinh Amoxicillin + Acid Clavulanic", defaultUnit: "Viên", defaultQty: 14, defaultMorning: 1, defaultNoon: 0, defaultAfternoon: 0, defaultEvening: 1, defaultMeal: "Uống sau ăn no", allergyGroup: "penicillin" },
  { name: "Rodogyl (Spiramycine + Metronidazole)", type: "Kháng sinh đặc hiệu răng miệng", defaultUnit: "Viên", defaultQty: 20, defaultMorning: 2, defaultNoon: 0, defaultAfternoon: 0, defaultEvening: 2, defaultMeal: "Uống sau ăn no", allergyGroup: "metronidazole" },
  { name: "Paracetamol 500mg (Panadol)", type: "Giảm đau, hạ sốt", defaultUnit: "Viên", defaultQty: 10, defaultMorning: 1, defaultNoon: 0, defaultAfternoon: 0, defaultEvening: 1, defaultMeal: "Uống khi đau buốt (cách tối thiểu 4-6h)", allergyGroup: "paracetamol" },
  { name: "Ibuprofen 400mg", type: "Kháng viêm giảm đau không steroid (NSAID)", defaultUnit: "Viên", defaultQty: 10, defaultMorning: 1, defaultNoon: 0, defaultAfternoon: 0, defaultEvening: 1, defaultMeal: "Uống sau ăn no", allergyGroup: "nsaid" },
  { name: "Alphachymotrypsin 4.2mg", type: "Kháng viêm chống phù nề dạng men", defaultUnit: "Viên", defaultQty: 16, defaultMorning: 2, defaultNoon: 0, defaultAfternoon: 0, defaultEvening: 2, defaultMeal: "Ngậm dưới lưỡi cho tan", allergyGroup: "chymotrypsin" },
  { name: "Gói pha dung dịch Medoral", type: "Gói súc miệng sát khuẩn", defaultUnit: "Gói", defaultQty: 10, defaultMorning: 1, defaultNoon: 0, defaultAfternoon: 0, defaultEvening: 1, defaultMeal: "Súc miệng 30 giây rồi nhổ bỏ", allergyGroup: "chlorhexidine" },
  { name: "Nước súc miệng Chlorhexidine 0.12%", type: "Sát khuẩn khoang miệng", defaultUnit: "Chai", defaultQty: 1, defaultMorning: 1, defaultNoon: 0, defaultAfternoon: 0, defaultEvening: 1, defaultMeal: "Súc miệng 15ml trong 30 giây", allergyGroup: "chlorhexidine" }
];

function PrescriptionsContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const clinicId = user?.activeClinicId;

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [inventoryDrugs, setInventoryDrugs] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dispensingId, setDispensingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"today" | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form Kê đơn
  const [patientIdInput, setPatientIdInput] = useState(
    searchParams.get("patientId") || "11111111-1111-1111-1111-111111111111"
  );
  const [patientName, setPatientName] = useState(searchParams.get("patientName") || "");
  const [patientCode, setPatientCode] = useState(searchParams.get("patientCode") || "");
  const [diagnosis, setDiagnosis] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [selectedMedications, setSelectedMedications] = useState<PrescribedMedication[]>([]);

  // Drug selector
  const [chosenInventoryId, setChosenInventoryId] = useState<string>("");
  const [chosenDrug, setChosenDrug] = useState(COMMON_DRUGS[0].name);
  const [drugQty, setDrugQty] = useState(COMMON_DRUGS[0].defaultQty);
  const [drugUnit, setDrugUnit] = useState(COMMON_DRUGS[0].defaultUnit);
  const [morningDose, setMorningDose] = useState(COMMON_DRUGS[0].defaultMorning);
  const [noonDose, setNoonDose] = useState(COMMON_DRUGS[0].defaultNoon);
  const [afternoonDose, setAfternoonDose] = useState(COMMON_DRUGS[0].defaultAfternoon);
  const [eveningDose, setEveningDose] = useState(COMMON_DRUGS[0].defaultEvening);
  const [mealTiming, setMealTiming] = useState(COMMON_DRUGS[0].defaultMeal);
  const [allergyWarning, setAllergyWarning] = useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const [presList, invItems] = await Promise.all([
        prescriptionService.list(),
        inventoryService.listItems()
      ]);
      setPrescriptions(presList.map(mapDtoToView));
      setInventoryDrugs(invItems.filter((i) => i.isActive));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể tải danh sách đơn thuốc.", "error");
    } finally {
      setLoading(false);
    }
  }, [clinicId, showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const pName = searchParams.get("patientName");
    if (pName) {
      setPatientName(pName);
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Tự động kiểm tra tương tác và dị ứng khi đổi thuốc hoặc ghi chú tiền sử bệnh nhân
  useEffect(() => {
    const drugInfo = COMMON_DRUGS.find((d) => d.name === chosenDrug);
    const notes = medicalNotes.toLowerCase();
    if (!drugInfo) return;

    if (
      drugInfo.allergyGroup === "penicillin" &&
      (notes.includes("penicillin") || notes.includes("amox") || notes.includes("beta-lactam"))
    ) {
      setAllergyWarning("CẢNH BÁO NGUY HIỂM: Bệnh nhân có tiền sử dị ứng Penicillin. Khuyến nghị đổi sang Rodogyl hoặc Macrolid (Erythromycin/Clarithromycin)!");
    } else if (
      drugInfo.allergyGroup === "nsaid" &&
      (notes.includes("nsaid") || notes.includes("aspirin") || notes.includes("dạ dày"))
    ) {
      setAllergyWarning("CẢNH BÁO NGUY HIỂM: Bệnh nhân có tiền sử dị ứng NSAID/Aspirin hoặc loét dạ dày. Khuyến nghị đổi sang Paracetamol!");
    } else if (
      drugInfo.allergyGroup === "paracetamol" &&
      notes.includes("paracetamol")
    ) {
      setAllergyWarning("CẢNH BÁO NGUY HIỂM: Bệnh nhân có tiền sử dị ứng với Paracetamol!");
    } else {
      setAllergyWarning(null);
    }
  }, [chosenDrug, medicalNotes]);

  const handleSelectDrug = (value: string) => {
    if (value.startsWith("inv:")) {
      const invId = value.slice(4);
      const inv = inventoryDrugs.find((i) => i.id === invId);
      if (inv) {
        setChosenInventoryId(inv.id);
        setChosenDrug(inv.name);
        setDrugUnit(inv.unit);
        setDrugQty(10);
      }
      return;
    }

    setChosenInventoryId("");
    setChosenDrug(value);
    const found = COMMON_DRUGS.find((d) => d.name === value);
    if (found) {
      setDrugQty(found.defaultQty);
      setDrugUnit(found.defaultUnit);
      setMorningDose(found.defaultMorning);
      setNoonDose(found.defaultNoon);
      setAfternoonDose(found.defaultAfternoon);
      setEveningDose(found.defaultEvening);
      setMealTiming(found.defaultMeal);
    }
  };

  const handleAddMedication = () => {
    if (allergyWarning) {
      showToast("Cảnh báo: Không thể thêm thuốc xung đột với tiền sử dị ứng của bệnh nhân!", "warning");
      return;
    }

    const dosageStr = `Sáng: ${morningDose} - Trưa: ${noonDose} - Chiều: ${afternoonDose} - Tối: ${eveningDose} (${drugUnit})`;

    const newMed: PrescribedMedication = {
      id: `med-${Date.now()}`,
      inventoryItemId: chosenInventoryId || null,
      name: chosenDrug,
      dosage: dosageStr,
      quantity: drugQty,
      unit: drugUnit,
      instructions: mealTiming
    };

    setSelectedMedications([...selectedMedications, newMed]);
  };

  const handleRemoveMedication = (id: string) => {
    setSelectedMedications(selectedMedications.filter((m) => m.id !== id));
  };

  const handleSavePrescription = async (status: "signed" | "draft") => {
    if (!patientName || selectedMedications.length === 0) {
      showToast("Vui lòng nhập tên bệnh nhân và kê ít nhất 1 loại thuốc.", "warning");
      return;
    }

    try {
      await prescriptionService.create({
        patientId: patientIdInput || "11111111-1111-1111-1111-111111111111",
        patientName,
        patientCode: patientCode || undefined,
        doctorId: user?.id,
        doctorName: user?.fullName || "Bác sĩ Điều trị",
        diagnosis: diagnosis || "Điều trị nha khoa",
        medicalNotes: medicalNotes || undefined,
        isDraft: status === "draft",
        items: selectedMedications.map((m) => ({
          inventoryItemId: m.inventoryItemId ?? null,
          medicationName: m.name,
          dosage: m.dosage,
          quantity: m.quantity,
          unit: m.unit,
          instructions: m.instructions
        }))
      });

      setIsCreateOpen(false);
      showToast(
        status === "signed"
          ? "Đã ký và phát hành đơn thuốc thành công."
          : "Đã lưu bản nháp đơn thuốc.",
        "success"
      );

      setPatientName("");
      setDiagnosis("");
      setMedicalNotes("");
      setSelectedMedications([]);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể lưu đơn thuốc.", "error");
    }
  };

  const handleDispensePrescription = async (pres: Prescription) => {
    setDispensingId(pres.id);
    try {
      const res = await prescriptionService.dispense(pres.id);
      const summary = res.data.dispensedItems
        .map((i) => `${i.medicationName} (${i.batches.map((b) => `${b.batchNumber}: -${b.consumedQuantity}`).join(", ")})`)
        .join("; ");
      showToast(
        summary ? `Đã cấp thuốc & trừ kho FEFO: ${summary}` : "Đã xác nhận cấp thuốc thành công.",
        "success"
      );
      setIsDetailOpen(false);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể cấp thuốc.", "error");
    } finally {
      setDispensingId(null);
    }
  };

  const todayIsoPrefix = new Date().toISOString().slice(0, 10);
  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchesSearch =
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    if (dateFilter === "today") {
      return matchesSearch && p.rawCreatedAt.startsWith(todayIsoPrefix);
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-[var(--text-h1)] font-semibold text-[var(--color-text)] tracking-tight flex items-center gap-2">
            <Pill className="w-6 h-6 text-emerald-600" />
            <span>Đơn thuốc Điện tử</span>
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-muted)] mt-1">
            Kê đơn theo phác đồ, kiểm tra dị ứng thuốc và ký điện tử trước khi chuyển thu ngân/nhà thuốc.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Kê đơn thuốc mới</span>
        </button>
      </div>

      {/* 2. Filter tabs & Search Bar */}
      <div className="p-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDateFilter("today")}
            className={`px-3 py-1.5 rounded-[var(--radius)] text-[var(--text-sm)] font-semibold transition cursor-pointer ${
              dateFilter === "today"
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
            }`}
          >
            Đơn thuốc trong ngày (Hôm nay)
          </button>
          <button
            type="button"
            onClick={() => setDateFilter("all")}
            className={`px-3 py-1.5 rounded-[var(--radius)] text-[var(--text-sm)] font-semibold transition cursor-pointer ${
              dateFilter === "all"
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
            }`}
          >
            Tất cả đơn thuốc
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên bệnh nhân, mã đơn, chẩn đoán..."
            className="w-full pl-9 pr-3 py-2 text-[var(--text-sm)] border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
          />
        </div>
      </div>

      {/* 3. Danh sách Đơn thuốc DataTable */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[var(--text-sm)]">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--text-xs)] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider bg-[var(--color-bg)]">
                <th className="py-3 px-4">Mã đơn thuốc</th>
                <th className="py-3 px-4">Bệnh nhân</th>
                <th className="py-3 px-4">Chẩn đoán</th>
                <th className="py-3 px-4">Số loại thuốc</th>
                <th className="py-3 px-4">Bác sĩ kê</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Không tìm thấy đơn thuốc nào.
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((pres) => (
                  <tr key={pres.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-[var(--color-primary)]">
                      {pres.code}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[var(--color-text)]">{pres.patientName}</p>
                      <p className="text-[var(--text-xs)] text-[var(--color-text-muted)]">{pres.patientCode}</p>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-[var(--color-text)]">
                      {pres.diagnosis}
                    </td>
                    <td className="py-3 px-4 tabular-nums">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                        {pres.medications.length} loại thuốc
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--color-text)] font-medium">
                      {pres.doctorName}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-xs)] text-[var(--color-text-muted)] tabular-nums">
                      {pres.createdDate}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {pres.status === "Dispensed" ? (
                        <span className="px-2.5 py-0.5 rounded text-[var(--text-xs)] font-semibold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã cấp thuốc</span>
                        </span>
                      ) : pres.status === "Issued" ? (
                        <span className="px-2.5 py-0.5 rounded text-[var(--text-xs)] font-semibold bg-sky-100 text-sky-800 inline-flex items-center gap-1">
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Đã phát hành</span>
                        </span>
                      ) : pres.status === "Cancelled" ? (
                        <span className="px-2.5 py-0.5 rounded text-[var(--text-xs)] font-semibold bg-rose-100 text-rose-800">
                          Đã hủy
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded text-[var(--text-xs)] font-semibold bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)]">
                          Bản nháp
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {(pres.status === "Issued" || pres.status === "Draft") && (
                        <button
                          type="button"
                          disabled={dispensingId === pres.id}
                          onClick={() => handleDispensePrescription(pres)}
                          className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-[var(--text-xs)] font-semibold transition cursor-pointer disabled:opacity-50"
                        >
                          {dispensingId === pres.id ? "Đang cấp..." : "Cấp thuốc"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPrescription(pres);
                          setIsDetailOpen(true);
                        }}
                        className="px-3 py-1.5 rounded border border-[var(--color-border)] hover:bg-[var(--color-bg)] text-[var(--text-xs)] font-semibold text-[var(--color-text)] transition cursor-pointer"
                      >
                        Xem & In
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Drawer Kê đơn thuốc mới */}
      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Kê Đơn Thuốc Điện Tử Mới"
        width="wide"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Họ tên bệnh nhân" required id="p-name">
              <input
                id="p-name"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
              />
            </FormField>

            <FormField label="Mã hồ sơ bệnh nhân" id="p-code">
              <input
                id="p-code"
                type="text"
                value={patientCode}
                onChange={(e) => setPatientCode(e.target.value)}
                placeholder="BN-2026-..."
                className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
              />
            </FormField>
          </div>

          <FormField label="Chẩn đoán xác định" required id="p-diag">
            <input
              id="p-diag"
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Ví dụ: Viêm tủy cấp R46, sau phẫu thuật nhổ răng khôn..."
              className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </FormField>

          <div className="space-y-1.5">
            <FormField label="Lưu ý y tế / Tiền sử dị ứng của bệnh nhân" id="p-allergy">
              <input
                id="p-allergy"
                type="text"
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                placeholder="Ví dụ: Dị ứng Penicillin, đau dạ dày..."
                className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
              />
            </FormField>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Chọn nhanh tiền sử:</span>
              <button
                type="button"
                onClick={() => setMedicalNotes("Dị ứng Penicillin")}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 hover:bg-red-200 transition cursor-pointer"
              >
                + Dị ứng Penicillin
              </button>
              <button
                type="button"
                onClick={() => setMedicalNotes("Dị ứng NSAID / Aspirin (Đau dạ dày)")}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition cursor-pointer"
              >
                + Dị ứng NSAID / Aspirin
              </button>
              <button
                type="button"
                onClick={() => setMedicalNotes("Chưa ghi nhận dị ứng")}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Chưa ghi nhận
              </button>
            </div>
          </div>

          {/* Hộp thêm thuốc */}
          <div className="p-4 rounded-[var(--radius)] border border-emerald-200 bg-emerald-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[var(--text-sm)] font-bold text-emerald-950 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-emerald-600" />
                <span>Kê thêm thuốc vào đơn</span>
              </h4>
              <span className="text-[var(--text-xs)] text-emerald-800 font-medium">
                Kiểm tra dị ứng & tương tác thuốc tự động
              </span>
            </div>

            {allergyWarning && (
              <div className="p-3 rounded-[var(--radius)] bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] text-[var(--text-xs)] font-bold flex items-center gap-2 border border-red-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{allergyWarning}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[var(--text-xs)] font-semibold text-slate-700 mb-1">
                  Tên thuốc & Hàm lượng (Kho thuốc / Mẫu chuẩn)
                </label>
                <select
                  value={chosenInventoryId ? `inv:${chosenInventoryId}` : chosenDrug}
                  onChange={(e) => handleSelectDrug(e.target.value)}
                  className="w-full px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border)] rounded-[var(--radius)] bg-white text-[var(--color-text)] focus:outline-none"
                >
                  {inventoryDrugs.length > 0 && (
                    <optgroup label="Thuốc / Vật tư trong Kho (Tự động trừ FEFO khi cấp)">
                      {inventoryDrugs.map((item) => (
                        <option key={item.id} value={`inv:${item.id}`}>
                          [{item.code}] {item.name} — Tồn: {item.totalQuantityOnHand} {item.unit}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Danh mục thuốc tham khảo">
                    {COMMON_DRUGS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} ({d.type})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-xs)] font-semibold text-slate-700 mb-1">
                  Số lượng
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={drugQty}
                  onChange={(e) => setDrugQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border)] rounded-[var(--radius)] bg-white text-[var(--color-text)] tabular-nums focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[var(--text-xs)] font-semibold text-slate-700 mb-1">
                  Đơn vị
                </label>
                <select
                  value={drugUnit}
                  onChange={(e) => setDrugUnit(e.target.value)}
                  className="w-full px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border)] rounded-[var(--radius)] bg-white text-[var(--color-text)] focus:outline-none"
                >
                  <option value="Viên">Viên</option>
                  <option value="Gói">Gói</option>
                  <option value="Chai">Chai</option>
                  <option value="Ống">Ống</option>
                  <option value="Hộp">Hộp</option>
                </select>
              </div>
            </div>

            {/* Liều dùng chia theo Sáng - Trưa - Chiều - Tối */}
            <div>
              <label className="block text-[var(--text-xs)] font-semibold text-slate-700 mb-1.5">
                Liều dùng theo buổi trong ngày (Sáng - Trưa - Chiều - Tối)
              </label>
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 bg-white rounded border border-slate-200 text-center">
                  <span className="block text-[11px] font-bold text-slate-600 mb-1">Sáng</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={morningDose}
                    onChange={(e) => setMorningDose(Number(e.target.value))}
                    className="w-full px-2 py-1 text-center font-bold text-[var(--text-sm)] border rounded bg-slate-50 tabular-nums focus:outline-none"
                  />
                </div>
                <div className="p-2 bg-white rounded border border-slate-200 text-center">
                  <span className="block text-[11px] font-bold text-slate-600 mb-1">Trưa</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={noonDose}
                    onChange={(e) => setNoonDose(Number(e.target.value))}
                    className="w-full px-2 py-1 text-center font-bold text-[var(--text-sm)] border rounded bg-slate-50 tabular-nums focus:outline-none"
                  />
                </div>
                <div className="p-2 bg-white rounded border border-slate-200 text-center">
                  <span className="block text-[11px] font-bold text-slate-600 mb-1">Chiều</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={afternoonDose}
                    onChange={(e) => setAfternoonDose(Number(e.target.value))}
                    className="w-full px-2 py-1 text-center font-bold text-[var(--text-sm)] border rounded bg-slate-50 tabular-nums focus:outline-none"
                  />
                </div>
                <div className="p-2 bg-white rounded border border-slate-200 text-center">
                  <span className="block text-[11px] font-bold text-slate-600 mb-1">Tối</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={eveningDose}
                    onChange={(e) => setEveningDose(Number(e.target.value))}
                    className="w-full px-2 py-1 text-center font-bold text-[var(--text-sm)] border rounded bg-slate-50 tabular-nums focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Hướng dẫn uống trước/sau ăn */}
            <div>
              <label className="block text-[var(--text-xs)] font-semibold text-slate-700 mb-1">
                Lưu ý thời điểm dùng thuốc
              </label>
              <select
                value={mealTiming}
                onChange={(e) => setMealTiming(e.target.value)}
                className="w-full px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border)] rounded-[var(--radius)] bg-white text-[var(--color-text)] focus:outline-none"
              >
                <option value="Uống sau ăn no">Uống sau ăn no</option>
                <option value="Uống trước ăn 30 phút">Uống trước ăn 30 phút</option>
                <option value="Uống khi đau buốt (cách tối thiểu 4-6h)">Uống khi đau buốt (cách tối thiểu 4-6h)</option>
                <option value="Uống trước khi đi ngủ">Uống trước khi đi ngủ</option>
                <option value="Ngậm dưới lưỡi cho tan">Ngậm dưới lưỡi cho tan</option>
                <option value="Súc miệng 15ml trong 30 giây rồi nhổ bỏ">Súc miệng 15ml trong 30 giây rồi nhổ bỏ</option>
              </select>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddMedication}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] bg-emerald-700 text-white text-[var(--text-sm)] font-medium hover:bg-emerald-800 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm thuốc vào đơn</span>
              </button>
            </div>
          </div>

          {/* Danh sách thuốc đã thêm */}
          <div>
            <h4 className="text-[var(--text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Thuốc đã kê trong đơn ({selectedMedications.length})
            </h4>

            {selectedMedications.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 border border-dashed rounded text-center">
                Chưa có loại thuốc nào được thêm. Vui lòng chọn thuốc ở trên.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedMedications.map((med, idx) => (
                  <div
                    key={med.id}
                    className="p-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-[var(--text-sm)] font-bold text-[var(--color-text)]">
                        {idx + 1}. {med.name}
                      </p>
                      <p className="text-[var(--text-xs)] text-emerald-800 font-medium">
                        {med.dosage}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[var(--text-sm)] font-bold text-slate-800 tabular-nums">
                        SL: {med.quantity} {med.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(med.id)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Xóa thuốc này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer nút hành động */}
          <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-bg)] transition cursor-pointer"
            >
              Hủy
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSavePrescription("draft")}
                className="px-4 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--text-sm)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
              >
                Lưu bản nháp
              </button>
              <button
                type="button"
                onClick={() => handleSavePrescription("signed")}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Ký & Phát hành đơn</span>
              </button>
            </div>
          </div>
        </div>
      </Drawer>

      {/* 5. Drawer Xem & In đơn thuốc */}
      <Drawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedPrescription ? `Đơn thuốc: ${selectedPrescription.code}` : "Chi tiết đơn thuốc"}
        width="default"
      >
        {selectedPrescription && (
          <div className="space-y-6">
            <div className="p-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-slate-50 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-mono font-bold text-base text-emerald-800">
                  {selectedPrescription.code}
                </span>
                <span className="text-xs text-slate-500 tabular-nums">
                  {selectedPrescription.createdDate}
                </span>
              </div>
              <p className="text-[var(--text-sm)]">
                <strong>Bệnh nhân:</strong> {selectedPrescription.patientName} ({selectedPrescription.patientCode})
              </p>
              <p className="text-[var(--text-sm)]">
                <strong>Bác sĩ kê:</strong> {selectedPrescription.doctorName}
              </p>
              <p className="text-[var(--text-sm)]">
                <strong>Chẩn đoán:</strong> {selectedPrescription.diagnosis}
              </p>
              {selectedPrescription.medicalNotes && (
                <p className="text-xs text-amber-800 font-medium bg-amber-50 p-2 rounded border border-amber-200">
                  Lưu ý: {selectedPrescription.medicalNotes}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Danh mục thuốc chỉ định
              </h4>
              <div className="space-y-2">
                {selectedPrescription.medications.map((med, idx) => (
                  <div key={med.id} className="p-3 rounded border border-slate-200 bg-white">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-slate-900">
                        {idx + 1}. {med.name}
                      </p>
                      <span className="font-bold text-sm text-slate-800 tabular-nums">
                        {med.quantity} {med.unit}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-1 font-medium">{med.dosage}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{med.instructions}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] bg-slate-800 text-white text-[var(--text-sm)] font-medium hover:bg-slate-900 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In đơn thuốc</span>
                </button>
                {(selectedPrescription.status === "Issued" || selectedPrescription.status === "Draft") && (
                  <button
                    type="button"
                    disabled={dispensingId === selectedPrescription.id}
                    onClick={() => handleDispensePrescription(selectedPrescription)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] bg-emerald-600 text-white text-[var(--text-sm)] font-medium hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{dispensingId === selectedPrescription.id ? "Đang cấp..." : "Cấp thuốc & Trừ kho"}</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-bg)] transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default function PrescriptionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Đang tải đơn thuốc...</div>}>
      <PrescriptionsContent />
    </Suspense>
  );
}
