"use client";

import * as React from "react";
import { format } from "date-fns";
import { Building2, Users, Megaphone, CalendarClock } from "lucide-react";
import dynamic from "next/dynamic";
import { Card, Spinner, EmptyState } from "@/components/ui/primitives";
import { Avatar, StatusBadge } from "@/components/ui/data";
import { cn, formatNumber } from "@/lib/utils";
import { CAMPAIGN_STATUSES, RESPONSE_TYPE_LABELS } from "@/lib/constants";
import { ChartSkeleton } from "@/components/ui/skeletons";

const AnalyticsEmailChart = dynamic(
  () => import("./analytics-charts").then((mod) => mod.AnalyticsEmailChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const AnalyticsPipelineChart = dynamic(
  () => import("./analytics-charts").then((mod) => mod.AnalyticsPipelineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const AnalyticsCampaignStatusChart = dynamic(
  () => import("./analytics-charts").then((mod) => mod.AnalyticsCampaignStatusChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
import { CAMPAIGN_STATUS_COLORS } from "@/lib/constants";

type AnalyticsData = {
  summary: {
    brands: number;
    influencers: number;
    campaigns: number;
    emailsSent30: number;
    emailsDelivered30: number;
    emailsOpened30: number;
    emailsClicked30: number;
    followupsToday: number;
    followupsOverdue: number;
    followupsCompleted30: number;
  };
  brandStatuses: { name: string; color: string; count: number }[];
  influencerStatuses: { name: string; color: string; count: number }[];
  campaignsByStatus: { status: string; count: number }[];
  emailByDay: { day: string; sent: number; opened: number; clicked: number }[];
  responseCounts: { type: string; _count: number }[];
  topInfluencers: { id: string; name: string; instagramUsername: string | null; followers: number | null; engagementRate: number | null }[];
  topBrands: { id: string; name: string; companyName: string | null; status: { name: string } | null }[];
  recentCampaigns: { id: string; name: string; status: string; brand: { name: string } | null; _count: { campaignInfluencers: number } }[];
};

const AXIS_TICK = { fontSize: 11, fill: "#71717a" };
const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid #e4e4e7",
  fontSize: 12,
  background: "#fff",
} as const;
const EMAIL_COLORS = { sent: "#3b82f6", opened: "#10b981", clicked: "#f59e0b" };

function KpiCard({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
        <span className={cn("rounded-lg p-1.5", accent)}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{typeof value === "number" ? formatNumber(value) : value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </Card>
  );
}

function pct(n: number, d: number) {
  if (!d) return "0%";
  return `${Math.round((n / d) * 100)}%`;
}

export function AnalyticsView() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load analytics");
      setData(json);
    } catch (e: any) {
      setError(e.message ?? "Failed to load analytics");
    }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  if (error) {
    return <EmptyState icon={<Megaphone className="h-5 w-5" />} title="Could not load analytics" description={error} />;
  }
  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const { summary, emailByDay } = data;
  const emailRows = (emailByDay ?? []).map((d) => ({ ...d, day: format(new Date(d.day), "MMM d") }));
  const campaignRows = CAMPAIGN_STATUSES.map((s) => ({
    status: s,
    count: (data.campaignsByStatus ?? []).find((c) => c.status === s)?.count ?? 0,
  }));
  const responseRows = (data.responseCounts ?? []).map((r) => ({
    name: RESPONSE_TYPE_LABELS[r.type] ?? r.type,
    value: r._count,
  }));



  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Analytics</h1>
        <p className="text-sm text-zinc-500">Performance across your CRM over the last 30 days</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Brands" value={summary.brands} icon={<Building2 className="h-4 w-4 text-indigo-600" />} accent="bg-indigo-100 dark:bg-indigo-950/50" />
        <KpiCard label="Influencers" value={summary.influencers} icon={<Users className="h-4 w-4 text-fuchsia-600" />} accent="bg-fuchsia-100 dark:bg-fuchsia-950/50" />
        <KpiCard label="Campaigns" value={summary.campaigns} icon={<Megaphone className="h-4 w-4 text-amber-600" />} accent="bg-amber-100 dark:bg-amber-950/50" />
        <KpiCard
          label="Follow-ups"
          value={summary.followupsToday}
          sub={`${summary.followupsOverdue} overdue · ${summary.followupsCompleted30} completed (30d)`}
          icon={<CalendarClock className="h-4 w-4 text-emerald-600" />}
          accent="bg-emerald-100 dark:bg-emerald-950/50"
        />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Emails sent (30 days)</h2>
            <p className="text-xs text-zinc-400">
              {summary.emailsSent30} sent · {formatNumber(summary.emailsDelivered30)} delivered ({pct(summary.emailsDelivered30, summary.emailsSent30)}) ·{" "}
              {summary.emailsOpened30} opened ({pct(summary.emailsOpened30, summary.emailsSent30)}) · {summary.emailsClicked30} clicked
            </p>
          </div>
          <div className="flex gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: EMAIL_COLORS.sent }} /> Sent</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: EMAIL_COLORS.opened }} /> Opened</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: EMAIL_COLORS.clicked }} /> Clicked</span>
          </div>
        </div>
        <AnalyticsEmailChart data={emailRows} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Brand pipeline</h2>
          <AnalyticsPipelineChart rows={data.brandStatuses} suffix="brands" />
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Influencer pipeline</h2>
          <AnalyticsPipelineChart rows={data.influencerStatuses} suffix="influencers" />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Campaigns by status</h2>
          <AnalyticsCampaignStatusChart rows={campaignRows} />
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Influencer responses</h2>
          {responseRows.length === 0 ? (
            <p className="flex h-52 items-center justify-center text-sm text-zinc-400">No recorded responses yet.</p>
          ) : (
            <div className="mt-3 h-52 space-y-2 overflow-y-auto pr-1">
              {responseRows.map((r) => {
                const max = Math.max(...responseRows.map((x) => x.value));
                return (
                  <div key={r.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-300">{r.name}</span>
                      <span className="font-medium text-zinc-500">{r.value}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${(r.value / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Top influencers</h2>
          <div className="mt-3 space-y-3">
            {data.topInfluencers.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400">No influencers yet.</p>
            ) : (
              data.topInfluencers.map((i) => (
                <div key={i.id} className="flex items-center gap-2.5">
                  <Avatar name={i.name} size="sm" color="bg-fuchsia-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{i.name}</p>
                    <p className="text-xs text-zinc-400">
                      {i.instagramUsername ? `@${i.instagramUsername.replace(/^@/, "")}` : "—"}
                      {i.engagementRate != null && ` · ${i.engagementRate}% eng.`}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    {i.followers != null ? formatNumber(i.followers) : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Recent brands</h2>
          <div className="mt-3 space-y-3">
            {data.topBrands.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400">No brands yet.</p>
            ) : (
              data.topBrands.map((b) => (
                <div key={b.id} className="flex items-center gap-2.5">
                  <Avatar name={b.name} size="sm" color="bg-indigo-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{b.name}</p>
                    <p className="truncate text-xs text-zinc-400">{b.companyName ?? ""}</p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">{b.status?.name ?? "—"}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Recent campaigns</h2>
          <div className="mt-3 space-y-3">
            {data.recentCampaigns.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400">No campaigns yet.</p>
            ) : (
              data.recentCampaigns.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/50">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{c.name}</p>
                    <p className="truncate text-xs text-zinc-400">
                      {c.brand?.name ?? "No brand"} · {c._count.campaignInfluencers} influencers
                    </p>
                  </div>
                  <StatusBadge label={c.status} color={CAMPAIGN_STATUS_COLORS[c.status]} />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}