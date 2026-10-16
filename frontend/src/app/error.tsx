"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function RootError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected runtime exception for monitoring
    console.error("Root Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-md p-6 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div>
          <h1 className="text-[20px] font-semibold text-[var(--color-text)]">
            Đã xảy ra sự cố không mong muốn
          </h1>
          <p className="mt-2 text-[var(--text-sm)] text-[var(--color-text-muted)]">
            Hệ thống đã ghi nhận sự cố này. Bạn có thể bấm nút thử lại hoặc quay về trang chủ.
          </p>
        </div>

        {error?.digest && (
          <div className="p-2.5 rounded-[var(--radius)] bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] text-[var(--text-xs)] font-mono tabular-nums">
            Mã tham chiếu hỗ trợ: {error.digest}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--text-sm)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
          >
            <Home className="w-4 h-4 text-[var(--color-text-muted)]" />
            <span>Trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
