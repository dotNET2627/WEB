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
  width?: "default" | "wide"; // default: ~580px, wide: ~820px
  placement?: "center" | "right"; // default: "center" (popup ở chính giữa màn hình)
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = "default",
  placement = "center"
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

      // Focus first focusable element inside drawer/modal
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

  const isCenter = placement === "center";

  // Width classes according to placement
  const widthClass = isCenter
    ? width === "wide"
      ? "max-w-[820px]"
      : "max-w-[580px]"
    : width === "wide"
      ? "max-w-[720px]"
      : "max-w-[560px]";

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 overflow-y-auto",
        isCenter
          ? "flex items-center justify-center p-4 sm:p-6"
          : "flex justify-end"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Drawer Dialog Panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={clsx(
          "relative z-10 flex flex-col w-full bg-white bg-[var(--color-surface)] shadow-2xl overflow-hidden",
          isCenter
            ? "max-h-[90vh] border border-slate-200 border-[var(--color-border)] rounded-[var(--radius)] my-auto"
            : "h-full border-l border-slate-200 border-[var(--color-border)]",
          widthClass
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 border-[var(--color-border)] bg-slate-50 bg-[var(--color-bg)] shrink-0">
          <div>
            <h2 id="drawer-title" className="text-[18px] font-semibold text-slate-900 text-[var(--color-text)] leading-snug">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-[var(--text-sm)] text-slate-600 text-[var(--color-text-muted)]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1 text-slate-500 text-[var(--color-text-muted)] hover:text-slate-800 hover:text-[var(--color-text)] hover:bg-slate-200/60 rounded-[var(--radius)] transition cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-white bg-[var(--color-surface)]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 border-[var(--color-border)] bg-slate-50 bg-[var(--color-bg)] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Aliases for semantic clarity across codebase
export const Modal = Drawer;
export const CenterModal = Drawer;
export type ModalProps = DrawerProps;
export type CenterModalProps = DrawerProps;
