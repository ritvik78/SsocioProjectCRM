"use client";

import * as React from "react";
import { Plus, Search, RefreshCw, Pencil, Trash2, Copy, FileText, Archive, ArchiveRestore } from "lucide-react";

import { Button, Input, Select, Card, Spinner, EmptyState, Textarea, Field } from "@/components/ui/primitives";
import { Table, THead, TBody, TH, TD, EmptyRow, StatusBadge, ConfirmDialog } from "@/components/ui/data";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { cn, formatDate } from "@/lib/utils";
import { EMAIL_CATEGORIES, TEMPLATE_VARIABLES } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  status: string;
  variables: string[] | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string } | null;
};

export function DraftsView({ user }: { user: SessionUser }) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<Template[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [showArchived, setShowArchived] = React.useState(false);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Template | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Template | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const canManage = user.permissions.has("drafts.manage");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/email/templates?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load drafts");
      let list = data.templates ?? [];
      if (!showArchived) list = list.filter((t: Template) => t.status === "ACTIVE");
      setRows(list);
    } catch (e: any) {
      setError(e.message ?? "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, showArchived]);

  React.useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (t: Template) => {
    setEditing(t);
    setModalOpen(true);
  };

  const submit = async (values: { name: string; category: string; subject: string; body: string; variables: string[]; status: string }) => {
    setSubmitting(true);
    try {
      const res = await fetch(editing ? `/api/email/templates/${editing.id}` : "/api/email/templates", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast({ title: editing ? "Draft updated" : "Draft created", variant: "success" });
      setModalOpen(false);
      load();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const duplicate = async (t: Template) => {
    try {
      const res = await fetch(`/api/email/templates/${t.id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to duplicate");
      toast({ title: "Duplicate created", description: data.template?.name, variant: "success" });
      load();
    } catch (e: any) {
      toast({ title: "Duplicate failed", description: e.message, variant: "error" });
    }
  };

  const toggleArchive = async (t: Template) => {
    try {
      const res = await fetch(`/api/email/templates/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: t.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: t.status === "ACTIVE" ? "Draft archived" : "Draft restored", variant: "success" });
      load();
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "error" });
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/email/templates/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast({ title: "Draft deleted", variant: "success" });
      setDeleting(null);
      load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "error" });
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const catLabels: Record<string, string> = Object.fromEntries(EMAIL_CATEGORIES.map((c) => [c.value, c.label]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Email Drafts</h1>
          <p className="text-sm text-zinc-500">Reusable templates for outreach & follow-ups</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New draft
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search drafts…" className="pl-9" />
          </div>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-48">
            <option value="">All categories</option>
            {EMAIL_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
          <Button variant={showArchived ? "primary" : "outline"} onClick={() => setShowArchived((v) => !v)}>
            <Archive className="h-4 w-4" /> Archived
          </Button>
          <Button variant="outline" onClick={load}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </Card>

      {error ? (
        <EmptyState icon={<FileText className="h-5 w-5" />} title="Could not load drafts" description={error} />
      ) : loading && rows.length === 0 ? (
        <Card className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Draft</TH>
                <TH>Category</TH>
                <TH>Variables</TH>
                <TH>Status</TH>
                <TH>Updated</TH>
                <TH className="w-28 text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {rows.length === 0 ? (
                <EmptyRow colSpan={6} message="No drafts found. Create your first template." />
              ) : (
                rows.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <TD className="max-w-[340px]">
                      <button onClick={() => openEdit(t)} className="block w-full text-left">
                        <p className="truncate font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-100">{t.name}</p>
                        <p className="truncate text-xs text-zinc-400">{t.subject}</p>
                      </button>
                    </TD>
                    <TD className="text-xs text-zinc-500">{catLabels[t.category] ?? t.category}</TD>
                    <TD>
                      <div className="flex max-w-[200px] flex-wrap gap-1">
                        {(t.variables ?? []).slice(0, 4).map((v) => (
                          <span key={v} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800">{`{{${v}}}`}</span>
                        ))}
                        {((t.variables ?? []).length) > 4 && (
                          <span className="text-[10px] text-zinc-400">+{((t.variables ?? []).length) - 4}</span>
                        )}
                      </div>
                    </TD>
                    <TD>
                      <StatusBadge label={t.status} color={t.status === "ACTIVE" ? "#22c55e" : "#6b7280"} />
                    </TD>
                    <TD className="text-xs text-zinc-400">{formatDate(t.updatedAt)}</TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        {canManage && (
                          <>
                            <button onClick={() => duplicate(t)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800" title="Duplicate">
                              <Copy className="h-4 w-4" />
                            </button>
                            <button onClick={() => toggleArchive(t)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800" title={t.status === "ACTIVE" ? "Archive" : "Restore"}>
                              {t.status === "ACTIVE" ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
                            </button>
                            <button onClick={() => openEdit(t)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleting(t)} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </TD>
                  </tr>
                ))
              )}
            </TBody>
          </Table>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit draft" : "New draft"}
        description="Email template with {{variable}} placeholders"
        size="xl"
      >
        <TemplateForm
          initial={
            editing
              ? { name: editing.name, category: editing.category, subject: editing.subject, body: editing.body, variables: editing.variables ?? [], status: editing.status }
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
        title="Delete draft?"
        description={`This permanently deletes "${deleting?.name}".`}
        confirmLabel="Delete"
      />
    </div>
  );
}

function TemplateForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: { name: string; category: string; subject: string; body: string; variables: string[]; status: string };
  submitting: boolean;
  onSubmit: (values: { name: string; category: string; subject: string; body: string; variables: string[]; status: string }) => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = React.useState(initial?.name ?? "");
  const [category, setCategory] = React.useState(initial?.category ?? EMAIL_CATEGORIES[0].value);
  const [subject, setSubject] = React.useState(initial?.subject ?? "");
  const [body, setBody] = React.useState(initial?.body ?? "");
  const [variables, setVariables] = React.useState<string[]>(initial?.variables ?? []);
  const [status, setStatus] = React.useState(initial?.status ?? "ACTIVE");

  const insertVariable = (key: string) => {
    setBody((b) => (b.trim().length ? `${b}\n\n{{${key}}}` : `{{${key}}}`));
    if (!variables.includes(key)) setVariables((v) => [...v, key]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast({ title: "Name, subject and body are required", variant: "error" });
      return;
    }
    onSubmit({ name: name.trim(), category, subject: subject.trim(), body, variables, status });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Influencer Outreach – Initial" />
        </Field>
        <Field label="Category" required>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {EMAIL_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </Field>
      </div>
      <Field label="Subject" required>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject with {{variables}}" />
      </Field>
      <Field label="Body" required>
        <Textarea rows={9} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write with {{brand_name}}, {{influencer_name}}…" />
      </Field>
      <div>
        <p className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">Insert variables</p>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                variables.includes(v.key)
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "border-zinc-200 text-zinc-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-400"
              )}
            >
              {`{{${v.key}}}`}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : initial ? "Save changes" : "Create draft"}</Button>
      </div>
    </form>
  );
}