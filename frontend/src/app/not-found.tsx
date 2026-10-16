import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-md p-8 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] flex items-center justify-center mx-auto">
          <FileQuestion className="w-7 h-7" />
        </div>

        <div>
          <span className="font-mono text-[var(--text-xs)] font-bold text-[var(--color-primary)]">
            LỖI 404
          </span>
          <h1 className="text-[20px] font-semibold text-[var(--color-text)] mt-1">
            Không tìm thấy trang yêu cầu
          </h1>
          <p className="mt-2 text-[var(--text-sm)] text-[var(--color-text-muted)]">
            Đường dẫn này không tồn tại hoặc bạn không có quyền truy cập vào tài nguyên này.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-3 border-t border-[var(--color-border)]">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Về tổng quan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
