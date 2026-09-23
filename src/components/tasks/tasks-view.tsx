"use client";

import * as React from "react";
import { Plus, Search, RefreshCw, Pencil, Trash2, Check, Loader2, ListTodo } from "lucide-react";

import { Button, Input, Select, Card, Spinner, EmptyState } from "@/components/ui/primitives";
import { Table, THead, TBody, TH, TD, EmptyRow, ConfirmDialog, Tabs, StatusBadge, PriorityBadge } from "@/components/ui/data";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import dynamic from "next/dynamic";
import { FormSkeleton } from "@/components/ui/skeletons";
import { cn, formatDate, toFormData } from "@/lib/utils";
import { completeTask, createTask, deleteTask, updateTask } from "@/lib/actions";
import type { TaskFormValues } from "./task-form";

const TaskForm = dynamic(
  () => import("./task-form").then((m) => m.TaskForm),
  { loading: () => <FormSkeleton /> }
);

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
  createdAt: string;
};

type Bucket = "today" | "upcoming" | "completed" | "all";

const BUCKETS: { value: Bucket; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All tasks" },
];

export function TasksView() {
  const { toast } = useToast();

  const [rows, setRows] = React.useState<TaskRow[]>([]);
  const [bucket, setBucket] = React.useState<Bucket>("today");
  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TaskRow | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleting, setDeleting] = React.useState<TaskRow | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const requestRef = React.useRef(0);

  const run = React.useCallback(
    async (opts: { bucket: Bucket; search: string; priority: string }) => {
      const id = ++requestRef.current;
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ bucket: opts.bucket });
        if (opts.search.trim()) params.set("q", opts.search.trim());
        if (opts.priority) params.set("priority", opts.priority);
        const res = await fetch(`/api/tasks?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load tasks");
        if (id === requestRef.current) setRows(data.tasks ?? []);
      } catch (e: any) {
        if (id === requestRef.current) setError(e.message ?? "Failed to load tasks");
      } finally {
        if (id === requestRef.current) setLoading(false);
      }
    },
    []
  );

  const runNow = () => void run({ bucket, search, priority: priorityFilter });

  React.useEffect(() => {
    const t = setTimeout(() => {
      void run({ bucket, search, priority: priorityFilter });
    }, 250);
    return () => clearTimeout(t);
  }, [search, bucket, priorityFilter, run]);

  const applyBucket = (nb: Bucket) => {
    setBucket(nb);
  };

  const applyPriority = (np: string) => {
    setPriorityFilter(np);
  };

  const resetFilters = () => {
    const nb = "today";
    setBucket(nb);
    setSearch("");
    setPriorityFilter("");
    void run({ bucket: nb, search: "", priority: "" });
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (t: TaskRow) => {
    setEditing(t);
    setModalOpen(true);
  };

  const submit = async (values: TaskFormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateTask(toFormData({ ...values, id: editing.id }));
        toast({ title: "Task updated", variant: "success" });
      } else {
        await createTask(toFormData(values));
        toast({ title: "Task added", variant: "success" });
      }
      setModalOpen(false);
      runNow();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const doComplete = async (t: TaskRow) => {
    if (t.status === "COMPLETED") return;
    setBusyId(t.id);
    try {
      await completeTask(toFormData({ id: t.id }));
      runNow();
    } catch (e: any) {
      toast({ title: "Could not update task", description: e.message, variant: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteTask(toFormData({ id: deleting.id }));
      toast({ title: "Task deleted", variant: "success" });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "error" });
    } finally {
      setDeleteLoading(false);
      setDeleting(null);
      runNow();
    }
  };

  const hasFilters = search.trim() !== "" || priorityFilter !== "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
            <ListTodo className="h-5 w-5 text-amber-600" />
            To-do
          </h1>
          <p className="text-sm text-zinc-500">
            {rows.length} task{rows.length === 1 ? "" : "s"}. Tasks not completed on their due day roll to the next day as pending.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </div>

      <Tabs
        tabs={BUCKETS}
        value={bucket}
        onChange={applyBucket}
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runNow()}
              placeholder="Search tasks…"
              className="pl-9"
            />
          </div>
          <Select value={priorityFilter} onChange={(e) => applyPriority(e.target.value)} className="w-36">
            <option value="">All priorities</option>
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
          {hasFilters && (
            <Button variant="ghost" onClick={resetFilters}>
              Clear
            </Button>
          )}
          <Button variant="outline" onClick={runNow}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </Card>

      {error ? (
        <EmptyState icon={<ListTodo className="h-5 w-5" />} title="Could not load tasks" description={error} />
      ) : loading && rows.length === 0 ? (
        <Card className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH className="w-10"></TH>
                <TH>Task</TH>
                <TH>Due date</TH>
                <TH>Status</TH>
                <TH>Priority</TH>
                <TH>Created</TH>
                <TH className="w-20 text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {rows.length === 0 ? (
                <EmptyRow
                  colSpan={7}
                  message={
                    bucket === "today"
                      ? "Nothing due today. Add a task to get started."
                      : bucket === "completed"
                        ? "No completed tasks yet."
                        : "No tasks match your filters."
                  }
                />
              ) : (
                rows.map((t) => {
                  const shifted = t.shiftedCount > 0;
                  return (
                    <tr key={t.id} className="hover:bg-zinc-50">
                      <TD>
                        <button
                          onClick={() => doComplete(t)}
                          disabled={busyId === t.id || t.status === "COMPLETED"}
                          aria-label={t.status === "COMPLETED" ? "Completed" : "Complete task"}
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                            t.status === "COMPLETED"
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-zinc-300 text-white hover:border-amber-500 hover:bg-amber-400"
                          )}
                        >
                          {busyId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        </button>
                      </TD>
                      <TD>
                        <p className={cn("truncate font-medium text-zinc-900", t.status === "COMPLETED" && "text-zinc-400 line-through")}>
                          {t.title}
                        </p>
                        {t.notes && <p className="truncate text-xs text-zinc-400">{t.notes}</p>}
                        {shifted && t.status === "PENDING" && (
                          <span
                            className="mt-0.5 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-700"
                            title={`Carried over ${t.shiftedCount} day${t.shiftedCount > 1 ? "s" : ""}`}
                          >
                            rolled {t.shiftedCount} day{t.shiftedCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </TD>
                      <TD className="text-sm text-zinc-600">
                        {formatDate(t.dueDate)}
                        {shifted && t.originalDueDate && (
                          <p className="text-xs text-zinc-400">from {formatDate(t.originalDueDate)}</p>
                        )}
                      </TD>
                      <TD>
                        <StatusBadge
                          label={t.status === "COMPLETED" ? "Completed" : "Pending"}
                          color={t.status === "COMPLETED" ? "#10b981" : "#f59e0b"}
                        />
                      </TD>
                      <TD>
                        <PriorityBadge priority={t.priority} />
                      </TD>
                      <TD className="text-xs text-zinc-500">{formatDate(t.createdAt)}</TD>
                      <TD>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(t)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleting(t)} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TD>
                    </tr>
                  );
                })
              )}
            </TBody>
          </Table>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit task" : "Add task"}
        description={editing ? "Update the task details" : "Create a new to-do item"}
        size="sm"
      >
        <TaskForm
          initial={
            editing
              ? {
                  title: editing.title,
                  dueDate: editing.dueDate.slice(0, 10),
                  priority: editing.priority,
                  notes: editing.notes ?? "",
                }
              : undefined
          }
          submitting={submitting}
          onSubmit={submit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={doDelete}
        danger
        loading={deleteLoading}
        title="Delete task?"
        description={`This permanently deletes "${deleting?.title}".`}
        confirmLabel="Delete"
      />
    </div>
  );
}