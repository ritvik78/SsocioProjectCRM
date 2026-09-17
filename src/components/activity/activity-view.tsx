"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

import { Button, Select, Card, Spinner, EmptyState } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/data";
import { cn, formatDateTime } from "@/lib/utils";
import { ACTIVITY_TYPES } from "@/lib/constants";

type Activity = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  influencer: { id: string; name: string } | null;
  campaign: { id: string; name: string } | null;
};

const TYPE_COLORS: Record<string, string> = {
  LEAD_CREATED: "#22c55e",
  EMAIL_SENT: "#3b82f6",
  EMAIL_RECEIVED: "#06b6d4",
  INSTAGRAM_OUTREACH: "#8b5cf6",
  FOLLOW_UP_CREATED: "#f59e0b",
  FOLLOW_UP_COMPLETED: "#10b981",
  RESPONSE_ADDED: "#ec4899",
  STATUS_CHANGED: "#8b5cf6",
  NOTE_ADDED: "#6b7280",
  ONBOARDING_STARTED: "#3b82f6",
  ONBOARDING_COMPLETED: "#22c55e",
  CAMPAIGN_CREATED: "#f59e0b",
  CAMPAIGN_INVITATION: "#8b5cf6",
  CAMPAIGN_ACCEPTED: "#22c55e",
  CAMPAIGN_REJECTED: "#ef4444",
  UPDATED: "#6b7280",
  DELETED: "#ef4444",
};

const TYPE_ICON: Record<string, string> = {
  DELETED: "✕",
  CAMPAIGN_REJECTED: "✕",
  LEAD_CREATED: "+",
  FOLLOW_UP_CREATED: "↗",
  FOLLOW_UP_COMPLETED: "✓",
  CAMPAIGN_ACCEPTED: "✓",
  EMAIL_SENT: "✉",
  EMAIL_RECEIVED: "✉",
  INSTAGRAM_OUTREACH: "◎",
  CAMPAIGN_INVITATION: "★",
  CAMPAIGN_CREATED: "★",
  STATUS_CHANGED: "↻",
  RESPONSE_ADDED: "✦",
  UPDATED: "↻",
  NOTE_ADDED: "·",
};

export function ActivityView() {
  const [rows, setRows] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [entity, setEntity] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (entity) params.set("entity", entity);
      params.set("page", String(page));
      params.set("pageSize", "30");
      const res = await fetch(`/api/activities?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load activity");
      setRows(data.activities ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message ?? "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [entity, page]);

  React.useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Activity</h1>
          <p className="text-sm text-zinc-500">The latest changes across your workspace</p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} className="w-44">
            <option value="">All entities</option>
            <option value="brand">Brands</option>
            <option value="influencer">Influencers</option>
            <option value="campaign">Campaigns</option>
          </Select>
          <span className="text-sm text-zinc-400">{total} activities</span>
        </div>
      </Card>

      {error ? (
        <EmptyState icon={<span className="text-xl">··</span>} title="Could not load activity" description={error} />
      ) : loading && rows.length === 0 ? (
        <Card className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </Card>
      ) : (
        <>
          <Card className="p-4">
            {rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">No activity yet.</p>
            ) : (
              <ol className="space-y-1">
                {rows.map((a) => (
                  <li key={a.id}>
                    <div className="group flex gap-3 rounded-lg px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                        {TYPE_ICON[a.type] ?? "·"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-800 dark:text-zinc-100">{a.description}</p>
                        <p className="text-xs text-zinc-400">
                          <span className="font-medium text-zinc-500" style={{ color: TYPE_COLORS[a.type] }}>
                            {(ACTIVITY_TYPES as Record<string, string>)[a.type] ?? a.type}
                          </span>
                          {" · "}
                          {a.user?.name ?? "System"}
                          {a.brand ? ` · ${a.brand.name}` : ""}
                          {a.influencer ? ` · ${a.influencer.name}` : ""}
                          {a.campaign ? ` · ${a.campaign.name}` : ""}
                          {" · "}
                          {formatDateTime(a.createdAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={30} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}