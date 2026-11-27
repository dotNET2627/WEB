"use client";

import { useState } from "react";
import { insuranceService } from "@/services/insurance-service";
import type {
  CreateClaimItemDto,
  CreateInsuranceClaimRequest,
  InsuranceType,
} from "@/types/insurance";
import { formatVND } from "@/lib/format";

interface CreateInsuranceClaimModalProps {
  clinicId: string;
  patientId?: string;
  patientName?: string;
  invoiceId?: string;
  appointmentId?: string;
  onClose: () => void;
  onSuccess: (claimId: string) => void;
}

interface ClaimLineItem extends CreateClaimItemDto {
  _key: number;
}

let _keyCounter = 0;
const nextKey = () => ++_keyCounter;

function emptyClaimLine(): ClaimLineItem {
  return { _key: nextKey(), description: "", quantity: 1, unitPrice: 0 };
}

const COMMON_PRIVATE_PROVIDERS = [
  "Bảo hiểm Bảo Việt (BaoViet Care)",
  "Bảo hiểm PVI (PVI Care)",
  "Insmart (Bảo lãnh viện phí)",
  "Bảo hiểm Generali",
  "Bảo hiểm Manulife",
  "Bảo hiểm Liberty",
  "Bảo hiểm Bảo Minh",
  "Bảo hiểm Bưu điện (PTI)",
  "Bảo hiểm VietinBank (VBI)",
  "Bảo hiểm Dai-ichi Life",
  "Bảo hiểm AIA",
  "Bảo hiểm Prudential",
];

export function CreateInsuranceClaimModal({
  clinicId,
  patientId = "",
  patientName = "",
  invoiceId,
  appointmentId,
  onClose,
  onSuccess,
}: CreateInsuranceClaimModalProps) {
  const [targetPatientId, setTargetPatientId] = useState(patientId);
  const [targetPatientName, setTargetPatientName] = useState(patientName);

  const [insuranceType, setInsuranceType] = useState<InsuranceType>("SocialHealth");
  const [providerName, setProviderName] = useState("Bảo hiểm Xã hội Việt Nam (BHYT)");
  const [cardNumber, setCardNumber] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [coverageRate, setCoverageRate] = useState<number>(80);
  const [diagnosis, setDiagnosis] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<ClaimLineItem[]>([emptyClaimLine()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  function updateItem(key: number, patch: Partial<ClaimLineItem>) {
    setItems((prev) =>
      prev.map((i) => (i._key === key ? { ...i, ...patch } : i))
    );
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((i) => i._key !== key));
  }

  function handleTypeChange(type: InsuranceType) {
    setInsuranceType(type);
    if (type === "SocialHealth") {
      setProviderName("Bảo hiểm Xã hội Việt Nam (BHYT)");
      setCoverageRate(80);
    } else {
      setProviderName("Bảo hiểm Bảo Việt (BaoViet Care)");
      setCoverageRate(100);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetPatientId.trim()) {
      setError("Vui lòng chọn hoặc nhập mã bệnh nhân.");
      return;
    }
    if (!cardNumber.trim()) {
      setError("Vui lòng nhập số thẻ bảo hiểm.");
      return;
    }
    if (items.length === 0 || items.some((i) => !i.description.trim())) {
      setError("Vui lòng nhập đầy đủ mô tả dịch vụ cho tất cả các dòng.");
      return;
    }

    setLoading(true);
    setError(null);

    const body: CreateInsuranceClaimRequest = {
      patientId: targetPatientId,
      clinicId,
      insuranceType,
      providerName: providerName.trim(),
      cardNumber: cardNumber.trim(),
      policyNumber: policyNumber.trim() || null,
      coverageRate: coverageRate > 0 ? coverageRate : null,
      invoiceId: invoiceId || null,
      appointmentId: appointmentId || null,
      diagnosis: diagnosis.trim() || null,
      doctorName: doctorName.trim() || null,
      notes: notes.trim() || null,
      items: items.map(({ _key, ...rest }) => rest),
    };

    try {
      const { id } = await insuranceService.create(body);
      onSuccess(id);
    } catch (err) {
      console.error(err);
      setError("Không thể tạo hồ sơ bồi thường bảo hiểm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col my-auto max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-linear-to-r from-blue-700 to-indigo-800 px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-bold">
              Tạo hồ sơ yêu cầu bồi thường bảo hiểm
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {/* Patient Header */}
            {targetPatientName && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-900">
                👤 Bệnh nhân: <span className="font-bold">{targetPatientName}</span>
                {invoiceId && (
                  <span className="ml-2 text-xs text-blue-600">· Hóa đơn: {invoiceId.slice(0, 8)}...</span>
                )}
              </div>
            )}

            {!patientId && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Mã ID Bệnh nhân *
                </label>
                <input
                  type="text"
                  value={targetPatientId}
                  onChange={(e) => setTargetPatientId(e.target.value)}
                  placeholder="Nhập GUID bệnh nhân..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            )}

            {/* Insurance Type Radios */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                Loại hình bảo hiểm *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeChange("SocialHealth")}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-bold transition-all ${
                    insuranceType === "SocialHealth"
                      ? "border-red-500 bg-red-50/60 text-red-700 shadow-xs"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>🏥</span>
                  <span>Bảo hiểm Y tế (BHYT)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange("Private")}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-bold transition-all ${
                    insuranceType === "Private"
                      ? "border-blue-600 bg-blue-50/60 text-blue-700 shadow-xs"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>🛡️</span>
                  <span>Bảo hiểm tư nhân</span>
                </button>
              </div>
            </div>

            {/* Provider and Card Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Đơn vị bảo hiểm *
                </label>
                {insuranceType === "SocialHealth" ? (
                  <input
                    type="text"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                  />
                ) : (
                  <select
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {COMMON_PRIVATE_PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Số thẻ bảo hiểm *
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder={insuranceType === "SocialHealth" ? "VD: DN4791234567890" : "VD: BV99887766"}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {insuranceType === "Private" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Số hợp đồng (Policy No)
                  </label>
                  <input
                    type="text"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder="VD: POL-2026-X88"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Tỷ lệ bảo hiểm chi trả (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={coverageRate}
                  onChange={(e) => setCoverageRate(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Diagnosis & Doctor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Chẩn đoán bệnh lý
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="VD: Viêm tủy răng K04.0 / Sâu răng K02..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Bác sĩ chỉ định / điều trị
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="VD: Bác sĩ Nguyễn Văn A"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Claim items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Dịch vụ / Thủ thuật yêu cầu bồi thường *
                </label>
                <button
                  type="button"
                  onClick={() => setItems((p) => [...p, emptyClaimLine()])}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  + Thêm dịch vụ
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={item._key}
                    className="grid grid-cols-12 gap-2 items-center rounded-lg border border-gray-200 p-2.5 bg-gray-50/50"
                  >
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item._key, { description: e.target.value })}
                        placeholder="Tên dịch vụ..."
                        className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={item.toothNumber ?? ""}
                        onChange={(e) => updateItem(item._key, { toothNumber: e.target.value || undefined })}
                        placeholder="Răng số..."
                        className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item._key, { quantity: Math.max(1, Number(e.target.value)) })}
                        className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-center focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item._key, { unitPrice: Math.max(0, Number(e.target.value)) })}
                        placeholder="Đơn giá"
                        className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-right focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item._key)}
                        disabled={items.length === 1}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Ghi chú thêm
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ghi chú về hồ sơ bồi thường (tùy chọn)..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Total calculation */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex justify-between items-center text-sm">
              <span className="font-semibold text-gray-600">Tổng tiền yêu cầu bồi thường:</span>
              <span className="text-lg font-bold text-blue-900">{formatVND(totalAmount)}</span>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Đang tạo hồ sơ..." : "Tạo hồ sơ bảo hiểm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
