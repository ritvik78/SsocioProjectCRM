"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw, Pencil, Trash2, Users, X } from "lucide-react";

import { Button, Input, Select, Card, Spinner, EmptyState } from "@/components/ui/primitives";
import { Table, THead, TBody, TH, TD, Pagination, EmptyRow, ConfirmDialog, StatusBadge, Avatar } from "@/components/ui/data";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import dynamic from "next/dynamic";
import type { InfluencerStatus, InfluencerFormValues } from "@/components/influencers/influencer-form";
import { FormSkeleton } from "@/components/ui/skeletons";
import { cn, formatNumber, formatDate } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

const InfluencerForm = dynamic(
  () => import("@/components/influencers/influencer-form").then((m) => m.InfluencerForm),
  { loading: () => <FormSkeleton /> }
);

type InfluencerRow = {
  id: string;
  name: string;
  instagramUsername: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  category: string | null;
  followers: number | null;
  engagementRate: number | null;
  status: InfluencerStatus | null;
  assignedTo: { id: string; name: string } | null;
  createdAt: string;
  nextFollowUpAt: string | null;
  _count: { followups: number; instagramOutreach: number; campaignInfluencers: number };
};

export function InfluencersView({ user }: { user: SessionUser }) {
  const { toast } = useToast();

  const [rows, setRows] = React.useState<InfluencerRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [statuses, setStatuses] = React.useState<InfluencerStatus[]>([]);
  const [members, setMembers] = React.useState<{ id: string; name: string; email: string }[]>([]);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [ownerFilter, setOwnerFilter] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [page, setPage] = React.useState(1);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<InfluencerRow | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleting, setDeleting] = React.useState<InfluencerRow | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const canAdd = user.permissions.has("influencers.add");
  const canEdit = user.permissions.has("influencers.edit");
  const canDelete = user.permissions.has("influencers.delete");

  const load = React.useCallback(
    async (o: { q?: string; status?: string; category?: string; owner?: string; sort?: string; page?: number } = {}) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(o.page ?? page), pageSize: "15" });
        const q = o.q ?? search;
        if (q) params.set("q", q);
        if (o.status ?? statusFilter) params.set("status", o.status ?? statusFilter);
        if (o.category ?? categoryFilter) params.set("category", o.category ?? categoryFilter);
        if (o.owner ?? ownerFilter) params.set("assignedTo", o.owner ?? ownerFilter);
        if ((o.sort ?? sort) !== "newest") params.set("sort", o.sort ?? sort);
        const res = await fetch(`/api/influencers?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load influencers");
        setRows(data.influencers ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      } catch (e: any) {
        setError(e.message ?? "Failed to load influencers");
      } finally {
        setLoading(false);
      }
    },
    [page, search, statusFilter, categoryFilter, ownerFilter, sort]
  );

  React.useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/options");
      const data = await res.json();
      if (active && res.ok) {
        setStatuses(data.influencerStatuses ?? []);
        setMembers(data.members ?? []);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (i: InfluencerRow) => {
    setEditing(i);
    setModalOpen(true);
  };

  const submit = async (values: InfluencerFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(editing ? `/api/influencers/${editing.id}` : "/api/influencers", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details?.name?.[0] || "Failed to save");
      toast({ title: editing ? "Influencer updated" : "Influencer added", variant: "success" });
      setModalOpen(false);
      setPage(1);
      load({ page: 1 });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/influencers/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast({ title: "Influencer deleted", variant: "success" });
      setDeleting(null);
      load({ page });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "error" });
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasFilters = search.trim() !== "" || statusFilter || categoryFilter || ownerFilter;
  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setOwnerFilter("");
    setSort("newest");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Influencers</h1>
          <p className="text-sm text-zinc-500">{total} influencer{total === 1 ? "" : "s"} in your pipeline</p>
        </div>
        {canAdd && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add influencer
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setPage(1) && load({ page: 1, q: e.currentTarget.value })}
              placeholder="Search name, @username, email, phone…"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-48">
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="w-36">
            <option value="">All categories</option>
            {["Fashion", "Beauty", "Fitness", "Food", "Travel", "Tech", "Lifestyle", "Gaming", "Comedy", "Education", "Business", "Parenting", "Other"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Select value={ownerFilter} onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }} className="w-40">
            <option value="">All owners</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="w-40">
            <option value="newest">Newest first</option>
            <option value="name">Name (A–Z)</option>
            <option value="followers">Most followers</option>
            <option value="last_contacted">Last contacted</option>
          </Select>
          {hasFilters && (
            <Button variant="ghost" onClick={resetFilters}>
              <X className="h-4 w-4" /> Clear
            </Button>
          )}
          <Button variant="outline" onClick={() => load({ page })}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </Card>

      {error ? (
        <EmptyState icon={<Users className="h-5 w-5" />} title="Could not load influencers" description={error} />
      ) : loading && rows.length === 0 ? (
        <Card className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Influencer</TH>
                <TH>Instagram</TH>
                <TH>Status</TH>
                <TH>Category</TH>
                <TH className="text-right">Followers</TH>
                <TH className="text-center">Follow-ups</TH>
                <TH>Next follow-up</TH>
                <TH>Owner</TH>
                <TH className="w-20 text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {rows.length === 0 ? (
                <EmptyRow colSpan={9} message="No influencers match your filters." />
              ) : (
                rows.map((i) => (
                  <tr key={i.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <TD>
                      <Link href={`/influencers/${i.id}`} className="group flex items-center gap-2.5">
                        <Avatar name={i.name} color="bg-fuchsia-500" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100">
                            {i.name}
                          </p>
                          <p className="truncate text-xs text-zinc-400">{i.city || i.email || ""}</p>
                        </div>
                      </Link>
                    </TD>
                    <TD>
                      {i.instagramUsername ? (
                        <a
                          href={`https://instagram.com/${i.instagramUsername.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-pink-600 hover:underline"
                        >
                          @{i.instagramUsername.replace(/^@/, "")}
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </TD>
                    <TD>
                      <StatusBadge label={i.status?.name} color={i.status?.color} />
                    </TD>
                    <TD className="text-xs text-zinc-500">{i.category || "—"}</TD>
                    <TD className="text-right text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {i.followers != null ? formatNumber(i.followers) : "—"}
                    </TD>
                    <TD className="text-center">
                      {i._count.followups > 0 ? (
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          {i._count.followups}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">0</span>
                      )}
                    </TD>
                    <TD className="text-xs text-zinc-500">{i.nextFollowUpAt ? formatDate(i.nextFollowUpAt) : "—"}</TD>
                    <TD>
                      <div className="flex items-center gap-1.5">
                        {i.assignedTo ? (
                          <>
                            <Avatar name={i.assignedTo.name} size="sm" color="bg-zinc-500" />
                            <span className="hidden text-xs text-zinc-500 xl:inline">{i.assignedTo.name.split(" ")[0]}</span>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </div>
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        {(canEdit || canDelete) && (
                          <>
                            {canEdit && (
                              <button onClick={() => openEdit(i)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800" title="Edit">
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => setDeleting(i)} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </TD>
                  </tr>
                ))
              )}
            </TBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={15} onPageChange={(p) => { setPage(p); load({ page: p }); }} />
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit influencer" : "Add influencer"}
        description={editing ? `Editing ${editing.name}` : "Create a new influencer record"}
        size="lg"
      >
        {statuses.length > 0 ? (
          <InfluencerForm
            statuses={statuses}
            members={members}
            initial={
              editing
                ? {
                    name: editing.name,
                    instagramUsername: editing.instagramUsername,
                    instagramUrl: editing.instagramUsername ? `https://instagram.com/${editing.instagramUsername.replace(/^@/, "")}` : "",
                    email: editing.email,
                    phone: editing.phone,
                    city: editing.city,
                    category: editing.category,
                    followers: editing.followers,
                    engagementRate: editing.engagementRate,
                    statusId: editing.status?.id ?? statuses[0]?.id ?? "",
                    assignedToId: editing.assignedTo?.id ?? null,
                  }
                : undefined
            }
            submitting={submitting}
            onSubmit={submit}
            onCancel={() => setModalOpen(false)}
          />
        ) : (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={doDelete}
        danger
        loading={deleteLoading}
        title="Delete influencer?"
        description={`This permanently deletes "${deleting?.name}". Related outreach, emails and campaigns are removed.`}
        confirmLabel="Delete"
      />
    </div>
  );
}