"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      <title>404 - Không tìm thấy đường link | Dental Care</title>
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--color-bg)]">
        <div className="w-full max-w-lg p-6 sm:p-8 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-center space-y-6">
          {/* Biểu tượng trạng thái */}
          <div className="w-16 h-16 rounded-full bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] flex items-center justify-center mx-auto">
            <FileQuestion className="w-8 h-8" aria-hidden="true" />
          </div>

          {/* Nội dung thông báo lỗi */}
          <div className="space-y-2">
            <div className="inline-block px-3 py-1 rounded-[var(--radius)] bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] text-[var(--text-xs)] font-semibold tracking-wider tabular-nums">
              MÃ LỖI: 404
            </div>
            <h1 className="text-[22px] sm:text-[24px] font-semibold text-[var(--color-text)] tracking-tight">
              Không tìm thấy đường link
            </h1>
            <p className="text-[var(--text-sm)] text-[var(--color-text-muted)] max-w-md mx-auto leading-relaxed">
              Đường dẫn bạn vừa truy cập không tồn tại, đã bị gỡ bỏ hoặc bạn đã nhập chưa đúng địa chỉ trang web.
            </p>
          </div>

          {/* Các nút điều hướng */}
          <div className="pt-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-[var(--text-sm)] font-medium hover:bg-[var(--status-neutral-bg)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Quay lại trang trước</span>
            </button>

            <Link
              href="/portal"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              <span>Về cổng thông tin</span>
            </Link>
          </div>

          {/* Hướng dẫn trợ giúp ngắn */}
          <p className="text-[var(--text-xs)] text-[var(--color-text-muted)]">
            Cần hỗ trợ tra cứu hồ sơ? Vui lòng truy cập Cổng Bệnh nhân hoặc liên hệ bộ phận tiếp đón.
          </p>
        </div>
      </main>
    </>
  );
}
