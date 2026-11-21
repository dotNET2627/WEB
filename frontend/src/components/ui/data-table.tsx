import React from "react";
import clsx from "clsx";
import { ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, AlertCircle, Inbox } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  // Sorting
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (columnKey: string) => void;
  // Selection / Interaction
  onRowClick?: (row: T) => void;
  // Pagination
  page?: number;
  pageSize?: number;
  totalCount?: number;
  pageSizeOptions?: number[];
  onPageChange?: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  // Empty states
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  isFiltered?: boolean;
  onClearFilter?: () => void;
  // Density
  density?: "default" | "compact";
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  error = null,
  onRetry,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  page = 1,
  pageSize = 20,
  totalCount = 0,
  pageSizeOptions = [20, 50, 100],
  onPageChange,
  onPageSizeChange,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription = "Hiện tại chưa có mục nào được ghi nhận trong danh sách.",
  emptyAction,
  isFiltered = false,
  onClearFilter,
  density = "default",
  className
}: DataTableProps<T>) {
  const rowHeightClass = density === "compact" ? "h-[36px] py-1.5" : "h-[48px] py-2.5";
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className={clsx("w-full border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-surface)]", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[var(--text-table)] border-collapse">
          <thead className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <tr>
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                const alignClass =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left";

                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    aria-sort={isSorted ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                    className={clsx(
                      "px-4 py-3 font-semibold text-[var(--color-text)] select-none",
                      alignClass
                    )}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className={clsx(
                          "inline-flex items-center gap-1.5 hover:text-[var(--color-primary)] transition cursor-pointer font-semibold",
                          col.align === "right" && "flex-row-reverse"
                        )}
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-60" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--color-border)]">
            {/* Loading State: Skeletons */}
            {isLoading && (
              <>
                {Array.from({ length: Math.min(pageSize, 5) }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className={rowHeightClass}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4">
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                    <div className="p-3 bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] rounded-[var(--radius)]">
                      <AlertCircle className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <p className="font-semibold text-[var(--color-text)]">Đã xảy ra lỗi khi tải dữ liệu</p>
                    <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">{error}</p>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-bg)] transition cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Thử lại</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Empty State */}
            {!isLoading && !error && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                    <div className="p-3 bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] rounded-[var(--radius)]">
                      <Inbox className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <p className="font-semibold text-[var(--color-text)]">
                      {isFiltered ? "Không tìm thấy kết quả phù hợp" : emptyTitle}
                    </p>
                    <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">
                      {isFiltered ? "Hãy thử thay đổi hoặc xóa bộ lọc tìm kiếm." : emptyDescription}
                    </p>
                    {isFiltered && onClearFilter ? (
                      <button
                        type="button"
                        onClick={onClearFilter}
                        className="px-3 py-1.5 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-bg)] transition cursor-pointer"
                      >
                        Xóa bộ lọc
                      </button>
                    ) : (
                      emptyAction
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Normal Rows */}
            {!isLoading && !error && data.length > 0 && (
              data.map((row, index) => {
                const rowKey = keyExtractor(row);
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(row)}
                    className={clsx(
                      rowHeightClass,
                      "transition-colors",
                      onRowClick ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50/50"
                    )}
                  >
                    {columns.map((col) => {
                      const alignClass =
                        col.align === "right"
                          ? "text-right tabular-nums"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left";

                      return (
                        <td key={col.key} className={clsx("px-4", alignClass)}>
                          {col.render ? col.render(row, index) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && !error && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-sm)]">
          <div className="text-[var(--color-text-muted)] tabular-nums">
            Hiển thị <span className="font-semibold text-[var(--color-text)]">{startItem}–{endItem}</span> trên{" "}
            <span className="font-semibold text-[var(--color-text)]">{totalCount}</span>
          </div>

          <div className="flex items-center gap-4">
            {onPageSizeChange && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-text-muted)]">Số hàng:</span>
                <select
                  aria-label="Số hàng mỗi trang"
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] text-[var(--text-sm)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] cursor-pointer"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {onPageChange && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  className="px-2.5 py-1 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-sm)] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:not-disabled:bg-[var(--color-bg)] transition cursor-pointer"
                  aria-label="Trang trước"
                >
                  Trước
                </button>
                <span className="px-2 font-medium tabular-nums text-[var(--color-text)]">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                  className="px-2.5 py-1 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-sm)] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:not-disabled:bg-[var(--color-bg)] transition cursor-pointer"
                  aria-label="Trang sau"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
