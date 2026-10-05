"use client";

import React, { useEffect, useRef } from "react";
import clsx from "clsx";
import { X } from "lucide-react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "default" | "wide"; // default: 560px, wide: 720px
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = "default"
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Esc key and focus management
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      // Focus first focusable element inside drawer
      const timer = setTimeout(() => {
        const focusable = drawerRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      }, 50);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
        clearTimeout(timer);
        previouslyFocusedElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = width === "wide" ? "max-w-[720px]" : "max-w-[560px]";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={clsx(
          "relative z-10 flex flex-col w-full h-full bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-[var(--shadow-overlay)]",
          widthClass
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <div>
            <h2 id="drawer-title" className="text-[18px] font-semibold text-[var(--color-text)] leading-snug">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-muted)]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-slate-200/60 rounded-[var(--radius)] transition cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
