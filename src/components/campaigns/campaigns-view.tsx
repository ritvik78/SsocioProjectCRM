"use client";

import * as React from "react";
import Link from "next/link";
import { Megaphone, Plus, Search, RefreshCw, Pencil, Trash2, X } from "lucide-react";

import { Button, Input, Select, Card, Spinner, EmptyState } from "@/components/ui/primitives";
import { Table, THead, TBody, TH, TD, Pagination, EmptyRow, ConfirmDialog, StatusBadge, Avatar } from "@/components/ui/data";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { CampaignForm, type CampaignFormValues } from "@/components/campaigns/campaign-form";
import { cn, formatDate } from "@/lib/utils";
import { CAMPAIGN_STATUS_COLORS } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";

type CampaignRow = {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  brand: { id: string; name: string } | null;
  createdBy: { id: string; name: string } | null;
  _count: { campaignInfluencers: number };
};

export function CampaignsView({ user }: { user: SessionUser }) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<CampaignRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [brands, setBrands] = React.useState<{ id: string; name: string }[]>([]);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [page, setPage] = React.useState(1);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CampaignRow | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleting, setDeleting] = React.useState<CampaignRow | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const canManage = user.permissions.has("campaigns.manage");

  const load = React.useCallback(
    async (o: { q?: string; status?: string; page?: number } = {}) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(o.page ?? page), pageSize: "15" });
        if (o.q ?? search) params.set("q", o.q ?? search);
        if (o.status ?? statusFilter) params.set("status", o.status ?? statusFilter);
        const res = await fetch(`/api/campaigns?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load campaigns");
        setRows(data.campaigns ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      } catch (e: any) {
        setError(e.message ?? "Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    },
    [page, search, statusFilter]
  );

  React.useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/brands?pageSize=500");
      const data = await res.json();
      if (active && res.ok) setBrands(data.brands ?? []);
    })();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const submit = async (values: CampaignFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(editing ? `/api/campaigns/${editing.id}` : "/api/campaigns", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast({ title: editing ? "Campaign updated" : "Campaign created", variant: "success" });
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
      const res = await fetch(`/api/campaigns/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast({ title: "Campaign deleted", variant: "success" });
      setDeleting(null);
      load({ page });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "error" });
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasFilters = search.trim() !== "" || statusFilter;
  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  const editingInitial: CampaignFormValues | undefined =
    editing && brands.length
      ? {
          name: editing.name,
          brandId: editing.brand?.id ?? "",
          status: editing.status,
          startDate: editing.startDate ? editing.startDate.split("T")[0] : "",
          endDate: editing.endDate ? editing.endDate.split("T")[0] : "",
          description: editing.description ?? "",
        }
      : undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Campaigns</h1>
          <p className="text-sm text-zinc-500">{total} campaign{total === 1 ? "" : "s"}</p>
        </div>
        {canManage && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4" /> New campaign
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
              placeholder="Search campaigns…"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-40">
            <option value="">All statuses</option>
            {Object.keys(CAMPAIGN_STATUS_COLORS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
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
        <EmptyState icon={<Megaphone className="h-5 w-5" />} title="Could not load campaigns" description={error} />
      ) : loading && rows.length === 0 ? (
        <Card className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Campaign</TH>
                <TH>Brand</TH>
                <TH>Status</TH>
                <TH>Dates</TH>
                <TH className="text-center">Influencers</TH>
                <TH>Created by</TH>
                <TH className="w-20 text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {rows.length === 0 ? (
                <EmptyRow colSpan={7} message="No campaigns yet. Create your first one." />
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <TD>
                      <Link href={`/campaigns/${c.id}`} className="group flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                          <Megaphone className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate font-medium text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100">
                            {c.name}
                          </p>
                          {c.description && (
                            <p className="max-w-[240px] truncate text-xs text-zinc-400">{c.description}</p>
                          )}
                        </div>
                      </Link>
                    </TD>
                    <TD>
                      <div className="flex items-center gap-1.5">
                        <Avatar name={c.brand?.name ?? "?"} size="sm" />
                        <span className="text-sm text-zinc-600 dark:text-zinc-300">{c.brand?.name ?? "—"}</span>
                      </div>
                    </TD>
                    <TD>
                      <StatusBadge label={c.status} color={CAMPAIGN_STATUS_COLORS[c.status]} />
                    </TD>
                    <TD className="text-xs text-zinc-500">
                      {c.startDate ? `${formatDate(c.startDate)} → ${c.endDate ? formatDate(c.endDate) : "…"}` : "—"}
                    </TD>
                    <TD className="text-center text-sm font-semibold text-zinc-700 dark:text-zinc-200">{c._count.campaignInfluencers}</TD>
                    <TD className="text-xs text-zinc-500">{c.createdBy?.name ?? "—"}</TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        {canManage && (
                          <>
                            <button onClick={() => { setEditing(c); setModalOpen(true); }} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleting(c)} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" title="Delete">
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
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={15} onPageChange={(p) => { setPage(p); load({ page: p }); }} />
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit campaign" : "New campaign"}
        description={editing ? `Editing ${editing.name}` : "Plan a brand campaign"}
        size="lg"
      >
        {brands.length > 0 ? (
          <CampaignForm
            brands={brands}
            initial={editingInitial}
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
        title="Delete campaign?"
        description={`This permanently deletes "${deleting?.name}".`}
        confirmLabel="Delete"
      />
    </div>
  );
}