"use client";

import * as React from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error" | "warning";
type Toast = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextType = {
  toast: (opts: { title: string; description?: string; variant?: ToastVariant }) => void;
};

const ToastContext = React.createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const variants: Record<ToastVariant, { icon: React.ReactNode; ring: string }> = {
  default: { icon: <Info className="h-4 w-4 text-zinc-500" />, ring: "border-zinc-200 dark:border-zinc-800" },
  success: { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, ring: "border-emerald-200 dark:border-emerald-900" },
  error: { icon: <AlertTriangle className="h-4 w-4 text-red-500" />, ring: "border-red-200 dark:border-red-900" },
  warning: { icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, ring: "border-amber-200 dark:border-amber-900" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const idRef = React.useRef(0);

  const remove = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (opts: { title: string; description?: string; variant?: ToastVariant }) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, title: opts.title, description: opts.description, variant: opts.variant ?? "default" }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const v = variants[t.variant];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg dark:bg-zinc-900 animate-in slide-in-from-bottom-2",
                v.ring
              )}
            >
              {v.icon}
              <div className="flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs text-zinc-500">{t.description}</p>}
              </div>
              <button onClick={() => remove(t.id)} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}