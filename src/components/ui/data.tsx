"use client";

import * as React from "react";
import { Check, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { cn, initials } from "@/lib/utils";

/* --------------------------------- Badges ---------------------------------- */

export function Badge({
  children,
  color = "#6b7280",
  className,
  dot = true,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      style={{ backgroundColor: `${color}1a`, color }}
    >
      {dot && <Circle className="h-1.5 w-1.5 fill-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ label, color }: { label?: string | null; color?: string | null }) {
  if (!label) return <span className="text-xs text-zinc-400">—</span>;
  return <Badge color={color ?? "#6b7280"}>{label}</Badge>;
}

export function PriorityBadge({ priority }: { priority?: string | null }) {
  const colors: Record<string, string> = {
    LOW: "#6b7280",
    MEDIUM: "#3b82f6",
    HIGH: "#f59e0b",
    URGENT: "#ef4444",
  };
  return <Badge color={colors[priority ?? ""] ?? "#6b7280"}>{priority ?? "—"}</Badge>;
}

/* ---------------------------------- Avatar --------------------------------- */

export function Avatar({
  name,
  size = "md",
  className,
  color,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: string;
}) {
  const sizes: Record<string, string> = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };
  const bg = color ?? "bg-amber-400 text-zinc-950 font-bold";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold shadow-xs",
        sizes[size],
        bg,
        className
      )}
      title={name}
    >
      {initials(name || "?")}
    </span>
  );
}

/* ---------------------------------- Table ---------------------------------- */

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full text-left text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b border-zinc-200 bg-amber-50/50 text-xs font-bold uppercase tracking-wide text-zinc-900", className)}
      {...props}
    />
  );
}

export function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60" {...props} />;
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("whitespace-nowrap px-3 py-3 font-semibold", className)} {...props} />;
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-3 align-middle", className)} {...props} />;
}

/* -------------------------------- Pagination ------------------------------- */

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  pageSize,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  pageSize: number;
}) {
  if (totalPages <= 1) {
    return (
      <div className="flex justify-end px-4 py-3 text-xs text-zinc-500">
        {total} {total === 1 ? "record" : "records"}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="text-xs text-zinc-500">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 text-xs text-zinc-600">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- Empty state ------------------------------- */

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-12 text-center text-sm text-zinc-400">
        {message}
      </td>
    </tr>
  );
}

/* ---------------------------------- Tabs ----------------------------------- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            value === tab.value
              ? "border-amber-500 text-amber-950 font-bold bg-amber-50/60 rounded-t-lg"
              : "border-transparent text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                value === tab.value
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Confirm dialog ----------------------------- */

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  danger = false,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-zinc-950/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-medium text-white disabled:opacity-50",
              danger ? "bg-red-600 hover:bg-red-500" : "bg-indigo-600 hover:bg-indigo-500"
            )}
          >
            {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Toggle switch ------------------------------ */

export function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-40",
        checked ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"
      )}
    >
      <span
        className={cn(
          "inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4.5 translate-x-[18px]" : "translate-x-0.5"
        )}
      >
        {checked && <Check className="h-2.5 w-2.5 text-indigo-600" />}
      </span>
    </button>
  );
}