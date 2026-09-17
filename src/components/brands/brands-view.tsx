"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, RefreshCw, Pencil, Trash2, Building2, X } from "lucide-react";

import { Button, Input, Select, Card, Spinner, EmptyState } from "@/components/ui/primitives";
import { Table, THead, TBody, TH, TD, Pagination, EmptyRow, ConfirmDialog, StatusBadge, PriorityBadge, Avatar } from "@/components/ui/data";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { BrandForm, type BrandStatus, type TeamMember, type BrandFormValues } from "@/components/brands/brand-form";
import { cn, formatDate } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

type BrandStatusRow = { id: string; name: string; color: string | null };

type BrandRow = {
  id: string;
  name: string;
  companyName: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  priority: string;
  website: string | null;
  status: BrandStatusRow | null;
  leadOwner: { id: string; name: string; email: string } | null;
  createdAt: string;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  _count: { followups: number; campaigns: number; activities: number };
};

export function BrandsView({ user }: { user: SessionUser }) {
  const { toast } = useToast();
  const router = useRouter();

  const [rows, setRows] = React.useState<BrandRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [statuses, setStatuses] = React.useState<BrandStatus[]>([]);
  const [members, setMembers] = React.useState<TeamMember[]>([]);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("");
  const [ownerFilter, setOwnerFilter] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [page, setPage] = React.useState(1);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BrandRow | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleting, setDeleting] = React.useState<BrandRow | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const canAdd = user.permissions.has("brands.add");
  const canEdit = user.permissions.has("brands.edit");
  const canDelete = user.permissions.has("brands.delete");

  const load = React.useCallback(async (opts?: { q?: string; status?: string; priority?: string; owner?: string; sort?: string; page?: number }) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(opts?.page ?? page),
        pageSize: "15",
      });
      const q = opts?.q ?? search;
      if (q) params.set("q", q);
      if (opts?.status ?? statusFilter) params.set("status", opts?.status ?? statusFilter);
      if (opts?.priority ?? priorityFilter) params.set("priority", opts?.priority ?? priorityFilter);
      if (opts?.owner ?? ownerFilter) params.set("owner", opts?.owner ?? ownerFilter);
      if ((opts?.sort ?? sort) !== "newest") params.set("sort", opts?.sort ?? sort);
      const res = await fetch(`/api/brands?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load brands");
      setRows(data.brands ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (e: any) {
      setError(e.message ?? "Failed to load brands");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter, ownerFilter, sort]);

  const loadOptions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/options");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStatuses(data.brandStatuses ?? []);
      setMembers(data.members ?? []);
    } catch (e: any) {
      toast({ title: "Could not load form options", description: e.message, variant: "error" });
    }
  }, [toast]);

  React.useEffect(() => {
    const t = setTimeout(() => loadOptions(), 0);
    return () => clearTimeout(t);
  }, [loadOptions]);

  React.useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const apply = (next: Partial<{ search: string; status: string; priority: string; owner: string; sort: string }>) => {
    if (next.search !== undefined) setSearch(next.search);
    if (next.status !== undefined) setStatusFilter(next.status);
    if (next.priority !== undefined) setPriorityFilter(next.priority);
    if (next.owner !== undefined) setOwnerFilter(next.owner);
    if (next.sort !== undefined) setSort(next.sort);
    router.push("/brands");
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setOwnerFilter("");
    setSort("newest");
    setPage(1);
    load({ q: "", status: "", priority: "", owner: "", sort: "newest", page: 1 });
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (b: BrandRow) => {
    setEditing(b);
    setModalOpen(true);
  };

  const submit = async (values: BrandFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(editing ? `/api/brands/${editing.id}` : "/api/brands", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details?.name?.[0] || "Failed to save");
      toast({ title: editing ? "Brand updated" : "Brand created", variant: "success" });
      setModalOpen(false);
      setPage(1);
      load({ page: 1, q: search, status: statusFilter, priority: priorityFilter, owner: ownerFilter, sort });
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
      const res = await fetch(`/api/brands/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast({ title: "Brand deleted", variant: "success" });
      setDeleting(null);
      load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "error" });
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasFilters = search.trim() !== "" || statusFilter || priorityFilter || ownerFilter;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Brands</h1>
          <p className="text-sm text-zinc-500">{total} brand{total === 1 ? "" : "s"} in your pipeline</p>
        </div>
        {canAdd && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add brand
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
              onKeyDown={(e) => e.key === "Enter" && apply({ search: e.currentTarget.value })}
              placeholder="Search name, company, email, phone, Instagram…"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => apply({ status: e.target.value })} className="w-44">
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <Select value={priorityFilter} onChange={(e) => apply({ priority: e.target.value })} className="w-36">
            <option value="">All priorities</option>
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
          <Select value={ownerFilter} onChange={(e) => apply({ owner: e.target.value })} className="w-44">
            <option value="">All owners</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => apply({ sort: e.target.value })} className="w-40">
            <option value="newest">Newest first</option>
            <option value="name">Name (A–Z)</option>
            <option value="last_contacted">Last contacted</option>
            <option value="next_followup">Next follow-up</option>
          </Select>
          {hasFilters && (
            <Button variant="ghost" onClick={resetFilters}>
              <X className="h-4 w-4" /> Clear
            </Button>
          )}
          <Button variant="outline" onClick={() => load()}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </Card>

      {error ? (
        <EmptyState icon={<Building2 className="h-5 w-5" />} title="Could not load brands" description={error} />
      ) : loading && rows.length === 0 ? (
        <Card className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Brand</TH>
                <TH>Contact</TH>
                <TH>Status</TH>
                <TH>Priority</TH>
                <TH className="text-center">Follow-ups</TH>
                <TH className="text-center">Campaigns</TH>
                <TH>Next follow-up</TH>
                <TH>Owner</TH>
                <TH className="w-20 text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {rows.length === 0 ? (
                <EmptyRow colSpan={9} message="No brands match your filters." />
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <TD>
                      <Link href={`/brands/${b.id}`} className="group flex items-center gap-2.5">
                        <Avatar name={b.name} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100">
                            {b.name}
                          </p>
                          <p className="truncate text-xs text-zinc-400">
                            {[b.companyName, b.city].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                      </Link>
                    </TD>
                    <TD>
                      <p className="text-sm text-zinc-700 dark:text-zinc-200">{b.contactName || "—"}</p>
                      <p className="text-xs text-zinc-400">{b.email || b.phone || ""}</p>
                    </TD>
                    <TD>
                      <StatusBadge label={b.status?.name} color={b.status?.color} />
                    </TD>
                    <TD>
                      <PriorityBadge priority={b.priority} />
                    </TD>
                    <TD className="text-center">
                      {b._count.followups > 0 ? (
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          {b._count.followups}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">0</span>
                      )}
                    </TD>
                    <TD className="text-center text-sm text-zinc-500">{b._count.campaigns}</TD>
                    <TD className="text-xs text-zinc-500">
                      {b.nextFollowUpAt ? formatDate(b.nextFollowUpAt) : "—"}
                    </TD>
                    <TD>
                      <div className="flex items-center gap-1.5">
                        {b.leadOwner ? (
                          <>
                            <Avatar name={b.leadOwner.name} size="sm" color="bg-zinc-500" />
                            <span className="hidden text-xs text-zinc-500 xl:inline">{b.leadOwner.name.split(" ")[0]}</span>
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
                              <button onClick={() => openEdit(b)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800" title="Edit">
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => setDeleting(b)} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" title="Delete">
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
        title={editing ? "Edit brand" : "Add brand"}
        description={editing ? `Editing ${editing.name}` : "Create a new brand record"}
        size="lg"
      >
        {statuses.length > 0 ? (
          <BrandForm
            statuses={statuses}
            members={members}
            initial={
              editing
                ? {
                    name: editing.name,
                    companyName: editing.companyName,
                    contactName: editing.contactName,
                    email: editing.email,
                    phone: editing.phone,
                    city: editing.city,
                    priority: editing.priority,
                    website: editing.website,
                    statusId: editing.status?.id ?? statuses[0]?.id ?? "",
                    leadOwnerId: editing.leadOwner?.id ?? null,
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
        title="Delete brand?"
        description={`This permanently deletes "${deleting?.name}". Related campaigns, emails and activities are removed.`}
        confirmLabel="Delete"
      />
    </div>
  );
}