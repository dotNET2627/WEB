import React from "react";
import clsx from "clsx";

export type StatusVariant = "neutral" | "info" | "success" | "warning" | "danger" | "primary";

interface StatusTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  children: React.ReactNode;
}

const variantStyles: Record<StatusVariant, string> = {
  neutral: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)]",
  info: "bg-[var(--status-info-bg)] text-[var(--status-info-fg)]",
  success: "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
  warning: "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]",
  danger: "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]",
  primary: "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]",
};

/**
 * StatusTag: Thẻ trạng thái chức năng tuân thủ ADMIN_UI_RULES.md mục 7.
 * Nhãn chữ bắt buộc, nền chữ theo token tương phản >= 4.5:1, bo góc --radius (8px), KHÔNG có chấm tròn màu.
 */
export function StatusTag({ variant = "neutral", children, className, ...props }: StatusTagProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-[var(--radius)] px-2 py-0.5 text-[var(--text-xs)] font-medium leading-normal tracking-normal select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
