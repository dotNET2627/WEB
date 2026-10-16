"use client";

import React, { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard View Error:", error);
  }, [error]);

  return (
    <div className="py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg p-6 rounded-[var(--radius)] border border-red-300 bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-red-100 text-red-700 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h2 className="text-[18px] font-bold text-[var(--status-danger-fg)]">
              Không thể tải phân hệ quản lý
            </h2>
            <p className="mt-1 text-[var(--text-sm)] text-red-800">
              {error.message || "Đã xảy ra lỗi khi nạp dữ liệu phân hệ. Phiên làm việc của bạn vẫn được bảo vệ."}
            </p>

            {error?.digest && (
              <p className="mt-2 text-[var(--text-xs)] font-mono text-red-700">
                Mã tham chiếu hỗ trợ: {error.digest}
              </p>
            )}

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-white text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thử lại phân hệ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
