"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { patientService } from "@/services/patient-service";
import type { PatientListItem, CreatePatientRequest, UpdatePatientRequest } from "@/types/patient";
import { DataTable, Column } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { PatientFormDrawer } from "@/features/patients/PatientFormDrawer";
import { Search, Plus, Trash2, Edit3, Eye } from "lucide-react";

function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return "—";
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.length < 7) return phone;
  const start = cleaned.substring(0, 3);
  const end = cleaned.substring(cleaned.length - 3);
  return `${start}****${end}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function calculateAge(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

function PatientsContent() {
  const { isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL query params
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialSearch = searchParams.get("search") || "";

  // Component state
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(20);

  // Drawer / Form state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<PatientListItem | null>(null);

  // Delete patient dialog
  const [patientToDelete, setPatientToDelete] = useState<PatientListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync debounced search (only reset page when user actively changes search term)
  const isFirstSearchRender = React.useRef(true);
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
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

    const qs = params.toString();
    const targetUrl = qs ? `/patients?${qs}` : "/patients";
    router.replace(targetUrl, { scroll: false });
  }, [page, debouncedSearch, router]);

  // Load patients from API
  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await patientService.getPatients({
        search: debouncedSearch || undefined,
        page,
        pageSize
      });
      setPatients(res.items);
      setTotalCount(res.totalCount);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách bệnh nhân.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => {
    let isCurrent = true;
    if (!isAuthLoading) {
      setIsLoading(true);
      setError(null);
      patientService
        .getPatients({
          search: debouncedSearch || undefined,
          page,
          pageSize
        })
        .then((res) => {
          if (isCurrent) {
            setPatients(res.items);
            setTotalCount(res.totalCount);
            setIsLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (isCurrent) {
            setError(err instanceof Error ? err.message : "Không thể tải danh sách bệnh nhân.");
            setIsLoading(false);
          }
        });
    }

    return () => {
      isCurrent = false;
    };
  }, [debouncedSearch, page, pageSize, isAuthLoading]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setPage(1);
  };

  const handleOpenCreate = () => {
    setPatientToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (p: PatientListItem) => {
    setPatientToEdit(p);
    setIsDrawerOpen(true);
  };

  // Create Patient Submit
  const handleCreatePatient = async (data: CreatePatientRequest) => {
    try {
      await patientService.create(data);
      showToast("Đã thêm hồ sơ bệnh nhân mới thành công.", "success");
      fetchPatients();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi khi thêm bệnh nhân.", "error");
      throw err;
    }
  };

  // Update Patient Submit
  const handleUpdatePatient = async (id: string, data: UpdatePatientRequest) => {
    try {
      await patientService.update(id, data);
      showToast("Đã cập nhật hồ sơ bệnh nhân thành công.", "success");
      fetchPatients();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi khi cập nhật bệnh nhân.", "error");
      throw err;
    }
  };

  // Delete Patient Confirm
  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      await patientService.delete(patientToDelete.id);
      showToast(`Đã xóa hồ sơ bệnh nhân ${patientToDelete.fullName}.`, "success");
      setPatientToDelete(null);
      fetchPatients();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi khi xóa hồ sơ bệnh nhân.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const isFiltered = !!debouncedSearch;

  // Table Columns Definition
  const columns: Column<PatientListItem>[] = useMemo(
    () => [
      {
        key: "patientCode",
        header: "Mã BN",
        width: "120px",
        sortable: true,
        render: (p) => (
          <span className="font-mono text-[var(--text-xs)] font-bold tabular-nums text-[var(--color-primary)]">
            {p.patientCode || `BN-${p.id.slice(0, 6).toUpperCase()}`}
          </span>
        )
      },
      {
        key: "fullName",
        header: "Họ và tên bệnh nhân",
        sortable: true,
        render: (p) => (
          <div>
            <Link
              href={`/patients/${p.id}`}
              className="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] hover:underline transition"
            >
              {p.fullName}
            </Link>
          </div>
        )
      },
      {
        key: "phoneNumber",
        header: "Số điện thoại",
        render: (p) => (
          <span className="tabular-nums font-mono text-[var(--text-sm)] text-[var(--color-text)]">
            {maskPhoneNumber(p.phoneNumber)}
          </span>
        )
      },
      {
        key: "dateOfBirth",
        header: "Ngày sinh & Tuổi",
        render: (p) => {
          const age = calculateAge(p.dateOfBirth);
          return (
            <span className="tabular-nums text-[var(--text-sm)] text-[var(--color-text)]">
              {formatDate(p.dateOfBirth)}
              {age !== null && (
                <span className="text-[var(--text-xs)] text-[var(--color-text-muted)] ml-1">
                  ({age} tuổi)
                </span>
              )}
            </span>
          );
        }
      },
      {
        key: "createdAt",
        header: "Ngày tạo",
        render: (p) => (
          <span className="tabular-nums text-[var(--text-xs)] text-[var(--color-text-muted)]">
            {formatDate(p.createdAt)}
          </span>
        )
      },
      {
        key: "actions",
        header: "Thao tác",
        align: "right",
        render: (p) => (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Link
              href={`/patients/${p.id}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--text-xs)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>Hồ sơ & Sơ đồ răng</span>
            </Link>

            <button
              type="button"
              onClick={() => handleOpenEdit(p)}
              aria-label={`Sửa hồ sơ ${p.fullName}`}
              className="p-1 rounded-[var(--radius)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setPatientToDelete(p)}
              aria-label={`Xóa hồ sơ ${p.fullName}`}
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
        <span className="text-[var(--color-text)] font-medium">Bệnh nhân</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-semibold text-[var(--color-text)] leading-tight">
              Quản lý Bệnh nhân
            </h1>
            <span className="px-2 py-0.5 rounded-[var(--radius)] bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] text-[var(--text-xs)] font-medium tabular-nums">
              {totalCount} hồ sơ
            </span>
          </div>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-muted)]">
            Tra cứu danh bạ hồ sơ, sơ đồ răng Odontogram 5 mặt giải phẫu, tiền sử bệnh lý và thư viện ảnh X-quang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm bệnh nhân</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            autoComplete="off"
            placeholder="Tìm theo họ tên, số điện thoại hoặc mã bệnh nhân..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
          />
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

      {/* Main DataTable */}
      <DataTable<PatientListItem>
        columns={columns}
        data={patients}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        error={error}
        onRetry={fetchPatients}
        onRowClick={(p) => router.push(`/patients/${p.id}`)}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isFiltered={isFiltered}
        onClearFilter={handleClearFilters}
        emptyTitle="Chưa có bệnh nhân nào"
        emptyDescription="Tiếp nhận và thêm bệnh nhân đầu tiên để bắt đầu lưu đồ nha bạ và lập kế hoạch điều trị."
        emptyAction={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm bệnh nhân mới</span>
          </button>
        }
      />

      {/* Create / Edit Patient Drawer */}
      <PatientFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setPatientToEdit(null);
        }}
        patientToEdit={patientToEdit}
        onSuccess={() => {
          setIsDrawerOpen(false);
          setPatientToEdit(null);
          fetchPatients();
        }}
        onSubmitCreate={handleCreatePatient}
        onSubmitUpdate={handleUpdatePatient}
      />

      {/* Delete Patient Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!patientToDelete}
        onClose={() => setPatientToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Vô hiệu hóa hồ sơ bệnh nhân"
        description={`Bạn có chắc chắn muốn xóa hồ sơ của bệnh nhân ${
          patientToDelete?.fullName || ""
        }? Toàn bộ lịch sử khám, sơ đồ răng và đơn thuốc sẽ được lưu vào kho lưu trữ theo luật định.`}
        confirmLabel="Xác nhận xóa"
        cancelLabel="Hủy bỏ"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function PatientsPage() {
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
      <PatientsContent />
    </React.Suspense>
  );
}
