"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarClock, Check, RefreshCw, Plus, ArrowRight, Clock } from "lucide-react";

import { Button, Input, Select, Card, Spinner, EmptyState, Textarea, Field } from "@/components/ui/primitives";
import { StatusBadge, PriorityBadge, Avatar, Tabs, ConfirmDialog } from "@/components/ui/data";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { FollowupForm } from "@/components/followups/followup-form";
import { formatDate, timeAgo } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

type Followup = {
  id: string;
  contactType: string;
  dueDate: string;
  status: string;
  priority: string;
  notes: string | null;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
  brand: { id: string; name: string; email: string | null; status: { name: string; color: string | null } | null } | null;
  influencer: { id: string; name: string; instagramUsername: string | null; email: string | null } | null;
};

type Bucket = "today" | "overdue" | "upcoming" | "completed" | "all";

export function FollowupsView({ user }: { user: SessionUser }) {
  const { toast } = useToast();
  const [bucket, setBucket] = React.useState<Bucket>("today");
  const [rows, setRows] = React.useState<Followup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [members, setMembers] = React.useState<{ id: string; name: string; email: string }[]>([]);
  const [brands, setBrands] = React.useState<{ id: string; name: string }[]>([]);
  const [influencers, setInfluencers] = React.useState<{ id: string; name: string }[]>([]);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [reschedule, setReschedule] = React.useState<{ id: string; name: string; dueDate: string } | null>(null);
  const [rescheduleDate, setRescheduleDate] = React.useState("");
  const [outcome, setOutcome] = React.useState<{ id: string; name: string } | null>(null);
  const [outcomeValue, setOutcomeValue] = React.useState("INTERESTED");
  const [outcomeNotes, setOutcomeNotes] = React.useState("");
  const [completeTarget, setCompleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/followups?bucket=${bucket}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load follow-ups");
      setRows(data.followups ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load follow-ups");
    } finally {
      setLoading(false);
    }
  }, [bucket]);

  React.useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/options");
      const data = await res.json();
      if (!active) return;
      if (res.ok) {
        setMembers(data.members ?? []);
        const [b, i] = await Promise.all([
          fetch("/api/brands?pageSize=500").then((r) => r.json()).catch(() => ({ brands: [] })),
          fetch("/api/influencers?pageSize=500").then((r) => r.json()).catch(() => ({ influencers: [] })),
        ]);
        if (active) {
          setBrands(b.brands ?? []);
          setInfluencers(i.influencers ?? []);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const patchAction = async (id: string, body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/followups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      return data.followup;
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "error" });
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    if (!completeTarget) return;
    try {
      await patchAction(completeTarget.id, { action: "complete" });
      toast({ title: "Follow-up completed", variant: "success" });
      setCompleteTarget(null);
      load();
    } catch {
      setCompleteTarget(null);
    }
  };

  const doReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedule || !rescheduleDate) return;
    try {
      await patchAction(reschedule.id, { action: "reschedule", dueDate: rescheduleDate });
      toast({ title: "Follow-up rescheduled", variant: "success" });
      setReschedule(null);
      load();
    } catch {
      /* handled */
    }
  };

  const doOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcome) return;
    try {
      await patchAction(outcome.id, { action: "outcome", outcome: outcomeValue, notes: outcomeNotes || undefined });
      toast({ title: "Outcome recorded", variant: "success" });
      setOutcome(null);
      load();
    } catch {
      setOutcome(null);
    }
  };

  const bucketTabs = [
    { value: "today" as Bucket, label: "Due today" },
    { value: "overdue" as Bucket, label: "Overdue" },
    { value: "upcoming" as Bucket, label: "Upcoming" },
    { value: "completed" as Bucket, label: "Completed" },
    { value: "all" as Bucket, label: "All" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Follow-ups</h1>
          <p className="text-sm text-zinc-500">{rows.length} in current view</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Schedule follow-up
        </Button>
      </div>

      {error ? (
        <EmptyState icon={<CalendarClock className="h-5 w-5" />} title="Could not load follow-ups" description={error} />
      ) : (
        <Card>
          <Tabs tabs={bucketTabs} value={bucket} onChange={(v) => setBucket(v)} />
          <div className="flex items-center justify-end px-4 py-2">
            <Button variant="outline" onClick={load}>
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </Button>
          </div>
          {loading && rows.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState icon={<CalendarClock className="h-5 w-5" />} title="Nothing here" description={bucket === "today" ? "No follow-ups due today. Nice work!" : "No follow-ups match this view."} />
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {rows.map((f) => {
                const entityHref = f.brand ? `/brands/${f.brand.id}` : f.influencer ? `/influencers/${f.influencer.id}` : null;
                const entityName = f.brand?.name ?? f.influencer?.name ?? "—";
                const overdue = f.status === "PENDING" && new Date(f.dueDate) < new Date();
                return (
                  <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Avatar name={entityName} size="sm" color={f.brand ? "bg-indigo-500" : "bg-fuchsia-500"} />
                        {entityHref ? (
                          <Link href={entityHref} className="text-sm font-semibold text-zinc-800 hover:text-indigo-600 dark:text-zinc-100">
                            {entityName}
                          </Link>
                        ) : (
                          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{entityName}</span>
                        )}
                        <StatusBadge label={f.brand ? "Brand" : "Influencer"} />
                        {f.status === "PENDING" && (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <Clock className="h-3 w-3" /> {overdue ? "Overdue" : "Pending"}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">
                        {f.contactType} · due {formatDate(f.dueDate)} · {timeAgo(f.createdAt)}
                        {f.assignedTo ? ` · ${f.assignedTo.name}` : ""}
                      </p>
                      {f.notes && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{f.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={f.priority} />
                      <StatusBadge label={f.status} color={f.status === "COMPLETED" ? "#22c55e" : overdue ? "#ef4444" : "#f59e0b"} />
                      {f.status === "PENDING" && (
                        <div className="flex gap-1">
                          <button onClick={() => setCompleteTarget({ id: f.id, name: entityName })} className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40" title="Complete">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setReschedule({ id: f.id, name: entityName, dueDate: f.dueDate })} className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40" title="Reschedule">
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button onClick={() => setOutcome({ id: f.id, name: entityName })} className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40" title="Record outcome">
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <FollowupForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        entityName="New follow-up"
        members={members}
        brands={brands}
        influencers={influencers}
        defaultAssignedToId={user.id}
        onCreated={load}
      />

      <Modal open={!!reschedule} onClose={() => setReschedule(null)} title="Reschedule follow-up" description={reschedule?.name}>
        <form onSubmit={doReschedule} className="space-y-4">
          <Field label="New due date" required>
            <Input type="date" value={rescheduleDate || (reschedule?.dueDate ? reschedule.dueDate.split("T")[0] : "")} onChange={(e) => setRescheduleDate(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setReschedule(null)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Reschedule"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!outcome} onClose={() => setOutcome(null)} title="Record outcome" description={outcome?.name}>
        <form onSubmit={doOutcome} className="space-y-4">
          <Field label="Result" required>
            <Select value={outcomeValue} onChange={(e) => setOutcomeValue(e.target.value)}>
              <option value="INTERESTED">Interested</option>
              <option value="NOT_INTERESTED">Not interested</option>
              <option value="NO_RESPONSE">No response</option>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea rows={3} value={outcomeNotes} onChange={(e) => setOutcomeNotes(e.target.value)} placeholder="What happened on this call / reply?" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOutcome(null)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save outcome"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        onConfirm={complete}
        danger={false}
        loading={busy}
        title="Complete follow-up?"
        description={completeTarget ? `Mark the follow-up with ${completeTarget.name} as done.` : undefined}
        confirmLabel="Complete"
      />
    </div>
  );
}