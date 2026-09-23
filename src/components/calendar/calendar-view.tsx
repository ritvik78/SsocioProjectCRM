"use client";

import * as React from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Trash2,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { completeTask, createTask, deleteTask } from "@/lib/actions";
import { toFormData, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  notes?: string | null;
  shiftedCount: number;
  originalDueDate?: string | null;
  completedAt?: string | null;
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#6b7280",
  MEDIUM: "#3b82f6",
  HIGH: "#f59e0b",
  URGENT: "#ef4444",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView() {
  const { toast } = useToast();
  const [cursor, setCursor] = React.useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = React.useState<Date>(new Date());
  const [tasks, setTasks] = React.useState<TaskRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [addTitle, setAddTitle] = React.useState("");
  const [saving, setSaving] = React.useState(false);

const gridStart = React.useMemo(() => startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 }), [cursor]);
  const gridEnd = React.useMemo(() => endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 }), [cursor]);
  const days = React.useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);

  const refresh = React.useCallback(async (from: Date, to: Date) => {
    try {
      const res = await fetch(
        `/api/tasks?from=${format(from, "yyyy-MM-dd")}&to=${format(to, "yyyy-MM-dd")}`
      );
      const data = await res.json();
      setTasks(data.tasks ?? []);
    } catch {
      // ignore transient fetch failures
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/tasks?from=${format(gridStart, "yyyy-MM-dd")}&to=${format(gridEnd, "yyyy-MM-dd")}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setTasks(data.tasks ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gridStart, gridEnd]);

  const byDay = React.useMemo(() => {
    const map: Record<string, TaskRow[]> = {};
    for (const t of tasks) {
      const key = format(parseISO(t.dueDate), "yyyy-MM-dd");
      (map[key] ??= []).push(t);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        if (a.status !== b.status) return a.status === "PENDING" ? -1 : 1;
        return a.title.localeCompare(b.title);
      });
    }
    return map;
  }, [tasks]);

  const selectedKey = format(selectedDay, "yyyy-MM-dd");
  const selectedTasks = byDay[selectedKey] ?? [];
  const pendingSelected = selectedTasks.filter((t) => t.status === "PENDING");

  async function handleComplete(id: string) {
    if (busyId) return;
    setBusyId(id);
    try {
      await completeTask(toFormData({ id }));
      void refresh(gridStart, gridEnd);
    } catch (error: any) {
      toast({ title: "Could not update task", description: error?.message, variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (busyId) return;
    setBusyId(id);
    try {
      await deleteTask(toFormData({ id }));
      void refresh(gridStart, gridEnd);
    } catch (error: any) {
      toast({ title: "Could not delete task", description: error?.message, variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = addTitle.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await createTask(toFormData({ title: trimmed, dueDate: format(selectedDay, "yyyy-MM-dd") }));
      setAddTitle("");
      toast({ title: "Task added", variant: "success" });
      void refresh(gridStart, gridEnd);
    } catch (error: any) {
      toast({ title: "Could not add task", description: error?.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
            <CalendarDays className="h-5 w-5 text-amber-600" />
            Calendar
          </h1>
          <p className="text-sm text-zinc-500">Your personal to-do list by day. Unfinished tasks roll to the next day as pending.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Today
          </button>
          <button
            onClick={() => setCursor((c) => addMonths(c, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-1 min-w-32 text-sm font-bold text-zinc-900">{format(cursor, "MMMM yyyy")}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayTasks = byDay[key] ?? [];
              const pendingCount = dayTasks.filter((t) => t.status === "PENDING").length;
              const shiftedCount = dayTasks.filter((t) => t.shiftedCount > 0).length;
              const inMonth = isSameMonth(day, cursor);
              const selected = isSameDay(day, selectedDay);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "group relative min-h-20 border-b border-r border-zinc-100 p-1.5 text-left align-top transition-colors hover:bg-amber-50/60",
                    !inMonth && "bg-zinc-50/50 text-zinc-300",
                    selected && "bg-amber-50 ring-2 ring-inset ring-amber-400"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      isToday(day) ? "bg-amber-400 text-zinc-950" : inMonth ? "text-zinc-700" : "text-zinc-300"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium",
                          t.status === "COMPLETED" ? "bg-zinc-100 text-zinc-400 line-through" : "bg-amber-100/80 text-zinc-800"
                        )}
                        title={t.title}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: t.status === "COMPLETED" ? "#a1a1aa" : PRIORITY_COLORS[t.priority] ?? "#3b82f6" }}
                        />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && <p className="px-1 text-[10px] font-semibold text-zinc-400">+{dayTasks.length - 3} more</p>}
                  </div>
                  {pendingCount > 0 && (
                    <span className="absolute bottom-1 right-1 text-[9px] font-bold text-zinc-400">
                      {pendingCount} pending
                    </span>
                  )}
                  {shiftedCount > 0 && (
                    <span className="absolute bottom-1 left-1 flex items-center gap-0.5 text-[9px] font-bold text-amber-600">
                      <ArrowUpRight className="h-2.5 w-2.5" />{shiftedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="w-full lg:w-80">
          <div className="rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <h2 className="text-sm font-bold text-zinc-900">{format(selectedDay, "EEEE, MMMM d")}</h2>
              <span className="text-xs font-semibold text-zinc-400">
                {pendingSelected.length} pending
              </span>
            </div>

            <div className="p-3">
              <form onSubmit={handleAdd} className="mb-3 flex items-center gap-1.5">
                <input
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="Add task for this day…"
                  className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                />
                <button
                  type="submit"
                  disabled={saving || !addTitle.trim()}
                  aria-label="Add task"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-zinc-950 hover:bg-amber-500 disabled:opacity-40"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
              </form>

              {loading ? (
                <div className="space-y-1.5 py-1">
                  <div className="h-9 animate-pulse rounded bg-zinc-100" />
                  <div className="h-9 animate-pulse rounded bg-zinc-100" />
                </div>
              ) : selectedTasks.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-400">No tasks on this day.</p>
              ) : (
                <ul className="space-y-1">
                  {selectedTasks.map((t) => (
                    <li key={t.id} className={cn("group flex items-start gap-2 rounded-lg border border-zinc-100 p-2", t.status === "COMPLETED" && "bg-zinc-50")}>
                      <button
                        onClick={() => handleComplete(t.id)}
                        disabled={busyId === t.id || t.status === "COMPLETED"}
                        aria-label={t.status === "COMPLETED" ? "Completed" : "Complete task"}
                        className={cn(
                          "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                          t.status === "COMPLETED"
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-zinc-300 text-white hover:border-amber-500 hover:bg-amber-400"
                        )}
                      >
                        {busyId === t.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Check className="h-2.5 w-2.5" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-medium text-zinc-800", t.status === "COMPLETED" && "text-zinc-400 line-through")}>
                          {t.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                          <span className="inline-flex items-center gap-1 font-medium" style={{ color: PRIORITY_COLORS[t.priority] ?? "#3b82f6" }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRIORITY_COLORS[t.priority] ?? "#3b82f6" }} />
                            {t.priority}
                          </span>
                          {t.shiftedCount > 0 && (
                            <span className="rounded bg-amber-100 px-1 py-px text-[10px] font-semibold text-amber-700">
                              shifted ×{t.shiftedCount}
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={busyId === t.id}
                        aria-label="Delete task"
                        className="shrink-0 rounded p-1 text-zinc-300 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
