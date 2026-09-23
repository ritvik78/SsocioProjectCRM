import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date?: Date | string | null, fallback = "—") {
  if (!date) return fallback;
  const d = new Date(date);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date?: Date | string | null, fallback = "—") {
  if (!date) return fallback;
  const d = new Date(date);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(date?: Date | string | null) {
  if (!date) return "";
  const d = new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatCurrency(value?: string | number | null, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatNumber(value?: number | null, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  return value.toLocaleString("en-IN");
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function toIsoDate(date?: Date | string | null) {
  if (!date) return undefined;
  const d = new Date(date);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/** Convert a plain object into FormData for server actions. Skips null/undefined. */
export function toFormData(obj: Record<string, unknown>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      fd.append(key, String(value));
    } else if (value instanceof Date) {
      fd.append(key, value.toISOString());
    }
  }
  return fd;
}

/**
 * Next.js `redirect()` throws a framework-handled control-flow exception from
 * server actions. When the action is invoked programmatically (`await action(fd)`)
 * inside a try/catch, that NEXT_REDIRECT rejection reaches the caller and would be
 * logged or toasted as a failure — but it actually means navigation is in flight.
 */
export function isNextRedirectError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const digest = (error as { digest?: unknown } | null)?.digest;
  const digestStr = typeof digest === "string" ? digest : "";
  return /^NEXT_(REDIRECT|NAVIGATE)/.test(message) || /^NEXT_(REDIRECT|NAVIGATE)/.test(digestStr);
}