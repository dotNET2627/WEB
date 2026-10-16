"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Filter,
  ChevronRight
} from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";

interface TreatmentStage {
  id: string;
  name: string;
  description: string;
  estimatedCost: number;
  status: "completed" | "in_progress" | "pending";
  completedDate?: string;
}

interface TreatmentPlan {
  id: string;
  code: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  doctorName: string;
  diagnosis: string;
  targetTeeth: string;
  progressPercent: number;
  totalCost: number;
  paidAmount: number;
  status: "in_progress" | "completed" | "paused";
  startDate: string;
  stages: TreatmentStage[];
}

const INITIAL_PLANS: TreatmentPlan[] = [
  {
    id: "plan-1",
    code: "DT-2026-014",
    patientId: "pat-001",
    patientName: "Trần Minh Quang",
    patientCode: "BN-2026-0891",
    doctorName: "BS. Nguyễn Văn Toàn",
    diagnosis: "Viêm tủy không hồi phục răng hàm R46, mòn cổ răng R24",
    targetTeeth: "R46, R24",
    progressPercent: 65,
    totalCost: 8500000,
    paidAmount: 5000000,
    status: "in_progress",
    startDate: "12/09/2026",
    stages: [
      {
        id: "stg-1",
        name: "Giai đoạn 1: Mở tủy & Đặt thuốc diệt tủy R46",
        description: "Làm sạch buồng tủy, khử trùng và đặt thuốc giảm đau",
        estimatedCost: 1500000,
        status: "completed",
        completedDate: "12/09/2026"
      },
      {
        id: "stg-2",
        name: "Giai đoạn 2: Trám bít ống tủy vĩnh viễn (Gutta Percha)",
        description: "Đo chiều dài làm việc, nong rửa ống tủy và bít kín",
        estimatedCost: 2000000,
        status: "in_progress"
      },
      {
        id: "stg-3",
        name: "Giai đoạn 3: Bọc mão sứ Zirconia bảo tồn răng R46",
        description: "Lấy dấu phục hình, chế tác mão sứ CAD/CAM và gắn vĩnh viễn",
        estimatedCost: 5000000,
        status: "pending"
      }
    ]
  },
  {
    id: "plan-2",
    code: "DT-2026-022",
    patientId: "pat-002",
    patientName: "Lê Hoàng Yến",
    patientCode: "BN-2026-0902",
    doctorName: "BS. Phạm Minh Đức",
    diagnosis: "Khớp cắn ngược loại III, răng chen chúc hàm dưới",
    targetTeeth: "Toàn hàm (FDI 11-48)",
    progressPercent: 30,
    totalCost: 35000000,
    paidAmount: 15000000,
    status: "in_progress",
    startDate: "05/02/2026",
    stages: [
      {
        id: "stg-1",
        name: "Giai đoạn 1: Nhổ răng tiền cối R14, R24 tạo khoảng",
        description: "Nhổ răng số 4 tạo khoảng lùi hàm trên",
        estimatedCost: 3000000,
        status: "completed",
        completedDate: "15/02/2026"
      },
      {
        id: "stg-2",
        name: "Giai đoạn 2: Gắn mắc cài sứ tự buộc & Kéo khoảng",
        description: "Thay chun và dây cung định kỳ mỗi tháng",
        estimatedCost: 22000000,
        status: "in_progress"
      },
      {
        id: "stg-3",
        name: "Giai đoạn 3: Tinh chỉnh khớp cắn & Đeo hàm duy trì",
        description: "Tháo mắc cài, làm máng duy trì trong suốt Vivera",
        estimatedCost: 10000000,
        status: "pending"
      }
    ]
  },
  {
    id: "plan-3",
    code: "DT-2026-008",
    patientId: "pat-004",
    patientName: "Nguyễn Thị Thảo",
    patientCode: "BN-2026-0740",
    doctorName: "BS. Hoàng Nam",
    diagnosis: "Viêm lợi nha chu mạn tính, sâu men răng R12, R11",
    targetTeeth: "R12, R11",
    progressPercent: 100,
    totalCost: 2400000,
    paidAmount: 2400000,
    status: "completed",
    startDate: "01/08/2026",
    stages: [
      {
        id: "stg-1",
        name: "Lấy cao răng dưới nướu & Thổi cát làm sạch",
        description: "Loại bỏ mảng bám vi khuẩn chân răng",
        estimatedCost: 600000,
        status: "completed",
        completedDate: "01/08/2026"
      },
      {
        id: "stg-2",
        name: "Trám răng thẩm mỹ Composite 3M R12, R11",
        description: "Tái tạo hình thể răng và màu sắc tự nhiên",
        estimatedCost: 1800000,
        status: "completed",
        completedDate: "05/08/2026"
      }
    ]
  }
];

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(amount);
}

export default function TreatmentPlansPage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<TreatmentPlan[]>(INITIAL_PLANS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states for Create Plan
  const [patientName, setPatientName] = useState("");
  const [patientCode, setPatientCode] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [targetTeeth, setTargetTeeth] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<number>(5000000);

  const handleOpenDetail = (plan: TreatmentPlan) => {
    setSelectedPlan(plan);
    setIsDetailOpen(true);
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !diagnosis) {
      showToast("Vui lòng điền đầy đủ tên bệnh nhân và chẩn đoán.", "warning");
      return;
    }

    const newPlan: TreatmentPlan = {
      id: `plan-${Date.now()}`,
      code: `DT-2026-0${plans.length + 1}`,
      patientId: `pat-${Date.now()}`,
      patientName,
      patientCode: patientCode || `BN-2026-0${Math.floor(100 + Math.random() * 900)}`,
      doctorName: "Bác sĩ Phụ trách",
      diagnosis,
      targetTeeth: targetTeeth || "Răng chỉ định",
      progressPercent: 0,
      totalCost: estimatedCost,
      paidAmount: 0,
      status: "in_progress",
      startDate: new Date().toLocaleDateString("vi-VN"),
      stages: [
        {
          id: `stg-${Date.now()}-1`,
          name: "Giai đoạn 1: Chuẩn bị & Điều trị ban đầu",
          description: diagnosis,
          estimatedCost: estimatedCost * 0.4,
          status: "in_progress"
        },
        {
          id: `stg-${Date.now()}-2`,
          name: "Giai đoạn 2: Phục hồi chức năng & Hoàn tất",
          description: "Kiểm tra khớp cắn và bảo tồn mô răng",
          estimatedCost: estimatedCost * 0.6,
          status: "pending"
        }
      ]
    };

    setPlans([newPlan, ...plans]);
    setIsCreateOpen(false);
    showToast(`Đã khởi tạo phác đồ điều trị ${newPlan.code} thành công.`, "success");
    setPatientName("");
    setDiagnosis("");
    setTargetTeeth("");
  };

  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.targetTeeth.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-[var(--text-h1)] font-semibold text-[var(--color-text)] tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[var(--color-primary)]" />
            <span>Phác đồ Điều trị Nha khoa</span>
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-muted)] mt-1">
            Theo dõi tiến trình các giai đoạn can thiệp, vị trí răng điều trị và dự toán chi phí.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lập phác đồ mới</span>
        </button>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="p-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên BN, mã phác đồ, số răng..."
            className="w-full pl-9 pr-3 py-2 text-[var(--text-sm)] border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="paused">Tạm dừng</option>
          </select>
        </div>
      </div>

      {/* 3. DataTable Phác đồ */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[var(--text-sm)]">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--text-xs)] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider bg-[var(--color-bg)]">
                <th className="py-3 px-4">Mã phác đồ</th>
                <th className="py-3 px-4">Tên bệnh nhân</th>
                <th className="py-3 px-4">Chẩn đoán</th>
                <th className="py-3 px-4">Số răng điều trị</th>
                <th className="py-3 px-4">Tiến độ</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Chi phí dự kiến</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Không tìm thấy phác đồ điều trị nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-[var(--color-primary)]">
                      {plan.code}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[var(--color-text)]">{plan.patientName}</p>
                      <p className="text-[var(--text-xs)] text-[var(--color-text-muted)]">{plan.patientCode}</p>
                    </td>
                    <td className="py-3 px-4 max-w-[220px]">
                      <p className="line-clamp-2 text-[var(--color-text)] text-[var(--text-sm)]">{plan.diagnosis}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-1 rounded text-[var(--text-xs)] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                        {plan.targetTeeth}
                      </span>
                    </td>
                    <td className="py-3 px-4 min-w-[140px]">
                      <div className="flex items-center justify-between text-[var(--text-xs)] mb-1">
                        <span className="font-semibold text-slate-700">{plan.progressPercent}%</span>
                        <span className="text-slate-400">
                          {plan.stages.filter((s) => s.status === "completed").length}/{plan.stages.length} giai đoạn
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${plan.progressPercent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {plan.status === "in_progress" && (
                        <span className="px-2.5 py-1 rounded text-[var(--text-xs)] font-semibold bg-[var(--status-info-bg)] text-[var(--status-info-fg)]">
                          Đang thực hiện
                        </span>
                      )}
                      {plan.status === "completed" && (
                        <span className="px-2.5 py-1 rounded text-[var(--text-xs)] font-semibold bg-[var(--status-success-bg)] text-[var(--status-success-fg)]">
                          Hoàn thành
                        </span>
                      )}
                      {plan.status === "paused" && (
                        <span className="px-2.5 py-1 rounded text-[var(--text-xs)] font-semibold bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]">
                          Tạm dừng
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <p className="font-semibold text-[var(--color-text)]">{formatVND(plan.totalCost)}</p>
                      <p className="text-[var(--text-xs)] text-emerald-700">Đã thu: {formatVND(plan.paidAmount)}</p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(plan)}
                        className="px-3 py-1.5 rounded border border-[var(--color-border)] hover:bg-[var(--color-bg)] text-[var(--text-xs)] font-semibold text-[var(--color-text)] transition cursor-pointer"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Drawer Xem chi tiết các giai đoạn điều trị */}
      <Drawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedPlan ? `Phác đồ điều trị: ${selectedPlan.code}` : "Chi tiết phác đồ"}
        width="wide"
      >
        {selectedPlan && (
          <div className="space-y-6">
            {/* Header tóm tắt */}
            <div className="p-4 rounded-[var(--radius)] bg-slate-50 bg-[var(--color-bg)] border border-slate-200 border-[var(--color-border)] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[var(--text-base)] font-bold text-slate-900 text-[var(--color-text)]">
                    {selectedPlan.patientName} ({selectedPlan.patientCode})
                  </h3>
                  <p className="text-[var(--text-xs)] text-slate-500 text-[var(--color-text-muted)]">
                    Bác sĩ: {selectedPlan.doctorName} • Ngày bắt đầu: {selectedPlan.startDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[var(--text-xs)] text-slate-500 text-[var(--color-text-muted)]">Tổng chi phí dự toán</p>
                  <p className="text-lg font-bold text-emerald-800 tabular-nums">
                    {formatVND(selectedPlan.totalCost)}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 border-[var(--color-border)] text-[var(--text-sm)]">
                <p>
                  <strong>Chẩn đoán lâm sàng:</strong> {selectedPlan.diagnosis}
                </p>
                <p className="mt-1">
                  <strong>Răng điều trị:</strong> <span className="font-semibold text-indigo-700">{selectedPlan.targetTeeth}</span>
                </p>
              </div>
            </div>

            {/* Các giai đoạn điều trị */}
            <div>
              <h4 className="text-[var(--text-sm)] font-bold text-slate-900 text-[var(--color-text)] uppercase tracking-wider mb-3">
                Lộ trình các giai đoạn can thiệp
              </h4>

              <div className="space-y-3">
                {selectedPlan.stages.map((stage, idx) => (
                  <div
                    key={stage.id}
                    className="p-4 rounded-[var(--radius)] border border-slate-200 border-[var(--color-border)] bg-white bg-[var(--color-surface)] flex items-start gap-3 shadow-xs"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[var(--text-sm)] font-bold text-[var(--color-text)]">
                          {stage.name}
                        </p>
                        <span className="text-[var(--text-sm)] font-semibold text-emerald-800 tabular-nums">
                          {formatVND(stage.estimatedCost)}
                        </span>
                      </div>
                      <p className="text-[var(--text-xs)] text-[var(--color-text-muted)]">
                        {stage.description}
                      </p>
                      {stage.completedDate && (
                        <p className="text-[11px] text-emerald-700 font-medium pt-1">
                          ✓ Hoàn tất ngày: {stage.completedDate}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nút hành động */}
            <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
              <Link
                href={`/patients/${selectedPlan.patientId}`}
                className="text-[var(--text-sm)] font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
              >
                <span>Xem Sơ đồ răng FDI bệnh nhân</span>
                <ChevronRight className="w-4 h-4" />
              </Link>

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

      {/* 5. Drawer Lập phác đồ điều trị mới */}
      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Khởi tạo Phác đồ Điều trị Mới"
        width="default"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <FormField label="Họ tên bệnh nhân" required id="new-p-name">
            <input
              id="new-p-name"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </FormField>

          <FormField label="Mã hồ sơ bệnh nhân (tùy chọn)" id="new-p-code">
            <input
              id="new-p-code"
              type="text"
              value={patientCode}
              onChange={(e) => setPatientCode(e.target.value)}
              placeholder="BN-2026-..."
              className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </FormField>

          <FormField label="Vị trí răng can thiệp (ký hiệu FDI)" required id="new-teeth">
            <input
              id="new-teeth"
              type="text"
              value={targetTeeth}
              onChange={(e) => setTargetTeeth(e.target.value)}
              placeholder="Ví dụ: R16, R26 hoặc Toàn hàm"
              className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </FormField>

          <FormField label="Chẩn đoán & Chỉ định điều trị" required id="new-diag">
            <textarea
              id="new-diag"
              rows={3}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Chẩn đoán tủy, nha chu hoặc khớp cắn..."
              className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </FormField>

          <FormField label="Dự toán chi phí ban đầu (VNĐ)" required id="new-cost">
            <input
              id="new-cost"
              type="number"
              step={500000}
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(Number(e.target.value))}
              className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </FormField>

          <div className="pt-4 border-t border-[var(--color-border)] flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-bg)] transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
            >
              Tạo phác đồ
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
