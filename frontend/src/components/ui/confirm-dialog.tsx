"use client";

import React, { useEffect, useRef } from "react";
import clsx from "clsx";
import { AlertTriangle, X } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Hủy bỏ",
  isDestructive = true,
  isLoading = false
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !isLoading) {
          onClose();
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
        clearTimeout(timer);
      };
    }
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 transition-opacity animate-in fade-in duration-150"
        onClick={() => !isLoading && onClose()}
        aria-hidden="true"
      />

      {/* Dialog box */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="relative z-10 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] shadow-[var(--shadow-overlay)] p-6 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={clsx(
              "p-2.5 rounded-[var(--radius)] shrink-0",
              isDestructive
                ? "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]"
                : "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]"
            )}
          >
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-[18px] font-semibold text-[var(--color-text)]">
              {title}
            </h3>
            <p id="confirm-dialog-description" className="mt-2 text-[var(--text-sm)] text-[var(--color-text-muted)] leading-relaxed">
              {description}
            </p>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            aria-label="Đóng"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded transition disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-3.5 py-2 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-sm)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={clsx(
              "px-4 py-2 rounded-[var(--radius)] text-[var(--text-sm)] font-medium text-white transition disabled:opacity-60 cursor-pointer",
              isDestructive
                ? "bg-[var(--color-danger)] hover:opacity-90"
                : "bg-[var(--color-primary)] hover:opacity-90"
            )}
          >
            {isLoading ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
