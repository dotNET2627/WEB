import React from "react";
import clsx from "clsx";

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * FormField: Thành phần bọc trường nhập liệu tuân thủ ADMIN_UI_RULES.md mục 5:
 * - Nhãn nằm TRÊN ô nhập, luôn hiển thị
 * - Trường bắt buộc ghi "(bắt buộc)" bằng chữ thường
 * - Thông báo lỗi hiển thị ngay dưới ô nhập, gắn role="alert"
 */
export function FormField({
  label,
  required = false,
  error,
  hint,
  id,
  children,
  className
}: FormFieldProps) {
  const errorId = id ? `${id}-error` : undefined;
  const hintId = id ? `${id}-hint` : undefined;

  return (
    <div className={clsx("flex flex-col space-y-1.5", className)}>
      <label htmlFor={id} className="text-[var(--text-sm)] font-medium text-[var(--color-text)] flex items-center gap-1.5">
        <span>{label}</span>
        {required && (
          <span className="text-[var(--text-xs)] text-[var(--color-danger)] font-normal">
            (bắt buộc)
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <p id={hintId} className="text-[var(--text-xs)] text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-[var(--text-xs)] text-[var(--color-danger)] font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
