"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: string;
  title: string;
  message?: string | null;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export function NotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Notification[]>([]);
  const [unread, setUnread] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let active = true;

    async function refresh() {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (!active) return;
        setItems(data.notifications ?? []);
        setUnread(data.unread ?? 0);
      }
    }

    if (open) {
      void refresh();
      const t = setInterval(() => void refresh(), 30000);
      return () => {
        active = false;
        clearInterval(t);
      };
    }
  }, [open]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markAllRead() {
    const res = await fetch("/api/notifications", { method: "POST", body: JSON.stringify({ readAll: true }) });
    if (res.ok) {
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
      router.refresh();
    }
  }

  const typeColors: Record<string, string> = {
    FOLLOWUP_DUE: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
    FOLLOWUP_OVERDUE: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
    NEW_RESPONSE: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
    NEW_LEAD: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
    ONBOARDING_COMPLETED: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300",
    CAMPAIGN_INVITE_RESPONSE: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
    TEAM_INVITE: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300",
    EMAIL_FOLLOWUP: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:w-96">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-400">No notifications yet</p>}
            {items.map((n) => (
              <div
                key={n.id}
                className="border-b border-zinc-50 px-4 py-3 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/40"
              >
                <div className="flex items-start gap-2.5">
                  <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${typeColors[n.type] ?? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}>
                    {n.type.replaceAll("_", " ")}
                  </span>
                </div>
                <p className={n.readAt ? "mt-1.5 text-sm text-zinc-600 dark:text-zinc-300" : "mt-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100"}>
                  {n.title}
                </p>
                {n.message && <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{n.message}</p>}
                {n.link && !n.readAt && (
                  <Link
                    href={n.link}
                    onClick={() => setOpen(false)}
                    className="mt-1 inline-block text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    View →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}