"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, Plus, Check, Trash2, Loader2, ListTodo } from "lucide-react";
import {
  addDays,
  format,
  isSameDay,
  parseISO,
  startOfDay,
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

export function TodoPanel() {
  const { toast } = useToast();
  const [tasks, setTasks] = React.useState<TaskRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [title, setTitle] = React.useState("");
  const [dueDate, setDueDate] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    const from = format(new Date(), "yyyy-MM-dd");
    const to = format(addDays(new Date(), 7), "yyyy-MM-dd");
    try {
      const res = await fetch(`/api/tasks?from=${from}&to=${to}`);
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
    const from = format(new Date(), "yyyy-MM-dd");
    const to = format(addDays(new Date(), 7), "yyyy-MM-dd");
    fetch(`/api/tasks?from=${from}&to=${to}`)
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
  }, []);

  const today = startOfDay(new Date());

  const pending = tasks.filter((t) => t.status === "PENDING");
  const todayTasks = pending.filter((t) => isSameDay(parseISO(t.dueDate), today));
  const upcoming = pending
    .filter((t) => parseISO(t.dueDate) > today)
    .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())
    .slice(0, 8);
  const doneToday = tasks.filter(
    (t) => t.status === "COMPLETED" && t.completedAt && isSameDay(parseISO(t.completedAt), today)
  ).length;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await createTask(toFormData({ title: trimmed, dueDate }));
      setTitle("");
      setDueDate(format(new Date(), "yyyy-MM-dd"));
      toast({ title: "Task added", variant: "success" });
      void refresh();
    } catch (error: any) {
      toast({ title: "Could not add task", description: error?.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(id: string) {
    if (busyId) return;
    setBusyId(id);
    try {
      await completeTask(toFormData({ id }));
      void refresh();
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
      void refresh();
    } catch (error: any) {
      toast({ title: "Could not delete task", description: error?.message, variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  function TaskItem({ task, sub }: { task: TaskRow; sub: string }) {
    return (
      <li className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-amber-50">
        <button
          onClick={() => handleComplete(task.id)}
          disabled={busyId === task.id}
          aria-label="Complete task"
          className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
            "border-zinc-300 text-white hover:border-amber-500 hover:bg-amber-400"
          )}
        >
          {busyId === task.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Check className="h-2.5 w-2.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-snug text-zinc-800">{task.title}</p>
          <p className="flex items-center gap-1 text-[11px] text-zinc-400">
            {sub}
            {task.shiftedCount > 0 && (
              <span
                className="rounded bg-amber-100 px-1 py-px text-[10px] font-semibold text-amber-700"
                title={`Rolled forward ${task.shiftedCount} day${task.shiftedCount > 1 ? "s" : ""}`}
              >
                shifted
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => handleDelete(task.id)}
          disabled={busyId === task.id}
          aria-label="Delete task"
          className="hidden shrink-0 rounded p-1 text-zinc-300 hover:bg-red-50 hover:text-red-500 group-hover:block"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </li>
    );
  }

  return (
    <div className="border-t border-zinc-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          <ListTodo className="h-3.5 w-3.5 text-amber-600" />
          To-do
        </p>
        <Link
          href="/calendar"
          title="Open calendar"
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Calendar
        </Link>
      </div>

      <form onSubmit={handleAdd} className="mb-2 flex items-center gap-1.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="h-8 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-8 rounded-lg border border-zinc-300 bg-white px-1.5 text-xs text-zinc-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
        />
        <button
          type="submit"
          disabled={saving || !title.trim()}
          aria-label="Add task"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-zinc-950 hover:bg-amber-500 disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      </form>

      {loading ? (
        <div className="space-y-1.5 py-1">
          <div className="h-6 animate-pulse rounded bg-zinc-100" />
          <div className="h-6 animate-pulse rounded bg-zinc-100" />
        </div>
      ) : todayTasks.length === 0 && upcoming.length === 0 ? (
        <p className="py-1 text-center text-[11px] text-zinc-400">All caught up – no pending tasks</p>
      ) : (
        <div className="space-y-2">
          {todayTasks.length > 0 && (
            <div>
              <p className="px-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Today</p>
              <ul className="space-y-0.5">
                {todayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    sub={task.shiftedCount > 0 && task.originalDueDate ? `from ${format(parseISO(task.originalDueDate), "MMM d")}` : "today"}
                  />
                ))}
              </ul>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <p className="px-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Upcoming</p>
              <ul className="space-y-0.5">
                {upcoming.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    sub={format(parseISO(task.dueDate), "EEE, MMM d")}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {doneToday > 0 && (
        <p className="mt-2 px-2 text-[11px] text-zinc-400">
          <Check className="mr-0.5 inline h-3 w-3 text-emerald-500" />
          {doneToday} done today
        </p>
      )}
    </div>
  );
}
