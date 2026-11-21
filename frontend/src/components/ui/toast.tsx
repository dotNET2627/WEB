"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import clsx from "clsx";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message }]);

      // Auto dismiss after 5 seconds as per ADMIN_UI_RULES.md mục 6
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-[var(--status-success-fg)] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[var(--status-danger-fg)] shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-[var(--status-warning-fg)] shrink-0" />,
    info: <Info className="w-5 h-5 text-[var(--status-info-fg)] shrink-0" />
  };

  const borderClass: Record<ToastType, string> = {
    success: "border-l-4 border-l-[var(--status-success-fg)] bg-[var(--status-success-bg)]",
    error: "border-l-4 border-l-[var(--status-danger-fg)] bg-[var(--status-danger-bg)]",
    warning: "border-l-4 border-l-[var(--status-warning-fg)] bg-[var(--status-warning-bg)]",
    info: "border-l-4 border-l-[var(--status-info-fg)] bg-[var(--status-info-bg)]"
  };

  return (
    <div
      role="status"
      className={clsx(
        "pointer-events-auto flex items-start gap-3 p-3.5 rounded-[var(--radius)] border border-[var(--color-border)] shadow-[var(--shadow-overlay)] animate-in slide-in-from-bottom-2 duration-150",
        borderClass[toast.type]
      )}
    >
      {iconMap[toast.type]}
      <p className="flex-1 text-[var(--text-sm)] font-medium text-[var(--color-text)] leading-snug">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Đóng thông báo"
        className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
