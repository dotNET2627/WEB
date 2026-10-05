"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { doctorService } from "@/services/doctor-service";
import type { Doctor, CreateDoctorRequest } from "@/types/doctor";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusTag } from "@/components/ui/status-tag";
import { DoctorDetailDrawer } from "@/components/doctors/doctor-detail-drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { Search, Plus, Filter, UserCheck, Trash2, Edit3, X } from "lucide-react";

const SPECIALTIES = [
  "Răng Tổng quát",
  "Chỉnh nha - Niềng răng",
  "Cấy ghép Implant",
  "Phục hình Răng sứ",
  "Nha chu & Điều trị tủy",
  "Phẫu thuật trong miệng",
  "Nha khoa Trẻ em"
];

function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return "—";
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.length < 7) return phone;
  const start = cleaned.substring(0, 3);
  const end = cleaned.substring(cleaned.length - 3);
  return `${start}****${end}`;
}

function DoctorsContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL query params
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialSearch = searchParams.get("search") || "";
  const initialSpecialty = searchParams.get("specialty") || "";

  // Component state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(20);

  // Drawer & Modals state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Create doctor modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createUserId, setCreateUserId] = useState("");
  const [createLicense, setCreateLicense] = useState("");
  const [createSpecialty, setCreateSpecialty] = useState(SPECIALTIES[0]);
  const [createExp, setCreateExp] = useState(1);
  const [createBio, setCreateBio] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Delete doctor dialog
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sync state to URL search params as per ADMIN_UI_RULES.md mục 4
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (specialty) params.set("specialty", specialty);

    const qs = params.toString();
    const targetUrl = qs ? `/doctors?${qs}` : "/doctors";
    router.replace(targetUrl, { scroll: false });
  }, [page, debouncedSearch, specialty, router]);

  // Load doctors from API
  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const clinicId =
        user?.activeClinicId && user.activeClinicId !== "00000000-0000-0000-0000-000000000000"
          ? user.activeClinicId
          : undefined;
      const res = await doctorService.getDoctors({
        clinicId,
        specialty: specialty || undefined,
        searchTerm: debouncedSearch || undefined,
        page,
        pageSize
      });

      setDoctors(res.items);
      setTotalCount(res.totalCount);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách bác sĩ.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.activeClinicId, specialty, debouncedSearch, page, pageSize]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchDoctors();
    }
  }, [fetchDoctors, isAuthLoading]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSpecialty("");
    setPage(1);
  };

  const handleOpenDoctorDetail = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setIsDrawerOpen(true);
  };

  const handleDoctorUpdated = (updated: Doctor) => {
    setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    if (selectedDoctor?.id === updated.id) {
      setSelectedDoctor(updated);
    }
  };

  // Create doctor submit
  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!createUserId.trim()) {
      errors.userId = "Vui lòng nhập ID tài khoản người dùng của Bác sĩ.";
    }
    if (!createLicense.trim()) {
      errors.license = "Số chứng chỉ hành nghề không được để trống.";
    }
    if (createExp < 0) {
      errors.exp = "Số năm kinh nghiệm không thể âm.";
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    const clinicId = user?.activeClinicId;
    if (!clinicId) {
      showToast("Chưa xác định được chi nhánh hiện tại.", "error");
      return;
    }

    setIsCreating(true);
    try {
      const payload: CreateDoctorRequest = {
        userId: createUserId.trim(),
        clinicId,
        medicalLicenseNumber: createLicense.trim(),
        yearsOfExperience: Number(createExp),
        specialty: createSpecialty,
        biography: createBio.trim() || undefined
      };

      await doctorService.createDoctor(payload);
      showToast("Đã thêm bác sĩ vào chi nhánh thành công.", "success");
      setIsCreateModalOpen(false);
      // Reset form
      setCreateUserId("");
      setCreateLicense("");
      setCreateExp(1);
      setCreateBio("");
      setCreateErrors({});
      fetchDoctors();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi khi thêm bác sĩ.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // Delete doctor submit
  const handleConfirmDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    setIsDeleting(true);
    try {
      await doctorService.deleteDoctor(doctorToDelete.id);
      showToast(`Đã xóa hồ sơ bác sĩ ${doctorToDelete.doctorName || ""} khỏi chi nhánh.`, "success");
      setDoctorToDelete(null);
      fetchDoctors();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi khi xóa bác sĩ.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const isFiltered = !!debouncedSearch || !!specialty;

  // Table columns definition
  const columns: Column<Doctor>[] = useMemo(
    () => [
      {
        key: "doctorName",
        header: "Bác sĩ",
        sortable: true,
        render: (doc) => (
          <div>
            <p className="font-semibold text-[var(--color-text)]">
              {doc.doctorName || "Bác sĩ chuyên khoa"}
            </p>
            <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] mt-0.5">
              {doc.email || "—"} • SĐT: {maskPhoneNumber(doc.phoneNumber)}
            </p>
          </div>
        )
      },
      {
        key: "medicalLicenseNumber",
        header: "Số CCHN",
        align: "left",
        sortable: true,
        render: (doc) => (
          <span className="tabular-nums font-mono text-[var(--text-xs)] font-medium text-[var(--color-text)]">
            {doc.medicalLicenseNumber || "Chưa cấp"}
          </span>
        )
      },
      {
        key: "specialty",
        header: "Chuyên khoa",
        render: (doc) => (
          <StatusTag variant="info">
            {doc.specialty || "Răng Tổng quát"}
          </StatusTag>
        )
      },
      {
        key: "yearsOfExperience",
        header: "Kinh nghiệm",
        align: "right",
        sortable: true,
        render: (doc) => (
          <span className="tabular-nums text-[var(--color-text)] font-medium">
            {doc.yearsOfExperience} năm
          </span>
        )
      },
      {
        key: "workSchedules",
        header: "Ca trực tuần",
        align: "center",
        render: (doc) => {
          const count = doc.workSchedules?.length || 0;
          return (
            <span className="tabular-nums text-[var(--text-sm)] font-medium text-[var(--color-text)]">
              {count > 0 ? `${count} ca/tuần` : "Chưa xếp ca"}
            </span>
          );
        }
      },
      {
        key: "actions",
        header: "Thao tác",
        align: "right",
        render: (doc) => (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleOpenDoctorDetail(doc)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--text-xs)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Hồ sơ & Ca trực</span>
            </button>

            <button
              type="button"
              onClick={() => setDoctorToDelete(doc)}
              aria-label={`Xóa bác sĩ ${doc.doctorName || ""}`}
              className="p-1 rounded-[var(--radius)] text-[var(--status-danger-fg)] hover:bg-[var(--status-danger-bg)] transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      }
    ],
    []
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[var(--text-sm)] text-[var(--color-text-muted)] flex items-center gap-2">
        <Link href="/dashboard" className="hover:text-[var(--color-text)] transition">
          Tổng quan
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text)] font-medium">Bác sĩ</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-semibold text-[var(--color-text)] leading-tight">
              Đội ngũ Bác sĩ
            </h1>
            <span className="px-2 py-0.5 rounded-[var(--radius)] bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] text-[var(--text-xs)] font-medium tabular-nums">
              {totalCount} bác sĩ
            </span>
          </div>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-muted)]">
            Quản lý danh sách bác sĩ, chứng chỉ hành nghề, chuyên khoa và ma trận ca trực tuần hoàn tại cơ sở.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm bác sĩ</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            autoComplete="off"
            placeholder="Tìm theo họ tên hoặc số chứng chỉ hành nghề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
            <select
              aria-label="Lọc theo chuyên khoa"
              value={specialty}
              onChange={(e) => {
                setSpecialty(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] cursor-pointer"
            >
              <option value="">Tất cả chuyên khoa</option>
              {SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-2.5 py-1.5 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-xs)] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable<Doctor>
        columns={columns}
        data={doctors}
        keyExtractor={(doc) => doc.id}
        isLoading={isLoading}
        error={error}
        onRetry={fetchDoctors}
        onRowClick={handleOpenDoctorDetail}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isFiltered={isFiltered}
        onClearFilter={handleClearFilters}
        emptyTitle="Chưa có bác sĩ trong chi nhánh"
        emptyDescription="Bắt đầu thêm bác sĩ để gán chuyên khoa và phân bổ ca trực khám bệnh."
        emptyAction={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm bác sĩ đầu tiên</span>
          </button>
        }
      />

      {/* Doctor Detail Drawer */}
      <DoctorDetailDrawer
        doctor={selectedDoctor}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedDoctor(null);
        }}
        onDoctorUpdated={handleDoctorUpdated}
      />

      {/* Create Doctor Dialog */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 transition-opacity"
            onClick={() => !isCreating && setIsCreateModalOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-doc-title"
            className="relative z-10 w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] shadow-[var(--shadow-overlay)] p-6 space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 id="create-doc-title" className="text-[18px] font-semibold text-[var(--color-text)]">
                  Thêm bác sĩ vào chi nhánh
                </h2>
              </div>
              <button
                type="button"
                disabled={isCreating}
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Đóng"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <FormField
                label="Mã User tài khoản (User ID)"
                required
                id="create-userid"
                error={createErrors.userId}
                hint="Nhập UUID của tài khoản người dùng đã được tạo trong hệ thống"
              >
                <input
                  id="create-userid"
                  type="text"
                  value={createUserId}
                  onChange={(e) => setCreateUserId(e.target.value)}
                  placeholder="ví dụ: 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                  className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] font-mono text-[var(--text-sm)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                />
              </FormField>

              <FormField
                label="Số chứng chỉ hành nghề (CCHN)"
                required
                id="create-cchn"
                error={createErrors.license}
                hint="Được cấp bởi Bộ Y tế hoặc Sở Y tế"
              >
                <input
                  id="create-cchn"
                  type="text"
                  value={createLicense}
                  onChange={(e) => setCreateLicense(e.target.value)}
                  placeholder="ví dụ: 012345/BYT-CCHN"
                  className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  label="Chuyên khoa chính"
                  required
                  id="create-specialty"
                >
                  <select
                    id="create-specialty"
                    value={createSpecialty}
                    onChange={(e) => setCreateSpecialty(e.target.value)}
                    className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] cursor-pointer"
                  >
                    {SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Số năm kinh nghiệm"
                  required
                  id="create-exp"
                  error={createErrors.exp}
                >
                  <input
                    id="create-exp"
                    type="number"
                    min="0"
                    max="60"
                    value={createExp}
                    onChange={(e) => setCreateExp(Number(e.target.value))}
                    className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                  />
                </FormField>
              </div>

              <FormField
                label="Giới thiệu chuyên môn"
                id="create-bio"
                hint="Tóm tắt quá trình đào tạo và bằng cấp"
              >
                <textarea
                  id="create-bio"
                  rows={2}
                  value={createBio}
                  onChange={(e) => setCreateBio(e.target.value)}
                  className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                />
              </FormField>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-sm)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition disabled:opacity-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50 cursor-pointer"
                >
                  {isCreating ? "Đang thêm..." : "Thêm bác sĩ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Doctor Confirm Dialog as per ADMIN_UI_RULES.md mục 6 */}
      <ConfirmDialog
        isOpen={!!doctorToDelete}
        onClose={() => setDoctorToDelete(null)}
        onConfirm={handleConfirmDeleteDoctor}
        title="Xóa bác sĩ khỏi chi nhánh"
        description={`Bạn có chắc chắn muốn xóa bác sĩ ${
          doctorToDelete?.doctorName || doctorToDelete?.medicalLicenseNumber || ""
        } khỏi cơ sở chi nhánh này? Mọi phân công ca trực tương ứng sẽ được giải phóng.`}
        confirmLabel="Xóa bác sĩ"
        cancelLabel="Hủy bỏ"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6 max-w-7xl animate-pulse p-4">
          <div className="h-8 w-64 bg-slate-200 rounded" />
          <div className="h-10 bg-slate-200 rounded" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      }
    >
      <DoctorsContent />
    </React.Suspense>
  );
}

