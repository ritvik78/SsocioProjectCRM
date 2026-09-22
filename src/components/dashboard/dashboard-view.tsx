"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Building2,
  Users,
  Megaphone,
  Mail,
  CheckCircle2,
  MailOpen,
  CalendarClock,
  AlertTriangle,
  ArrowRight,
  Activity as ActivityIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, Spinner } from "@/components/ui/primitives";
import { StatusBadge, Avatar } from "@/components/ui/data";
import { cn, formatNumber, timeAgo } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { ChartSkeleton } from "@/components/ui/skeletons";

const EmailSeriesChart = dynamic(
  () => import("./dashboard-charts").then((mod) => mod.EmailSeriesChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const LeadStatusChart = dynamic(
  () => import("./dashboard-charts").then((mod) => mod.LeadStatusChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);


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
  emailByDay: { day: string; sent: number; opened: number; clicked: number }[];
  topInfluencers: { id: string; name: string; instagramUsername?: string | null; followers?: number | null }[];
  recentCampaigns: { id: string; name: string; status: string; brand: { name: string } | null }[];
};

type Followup = {
  id: string;
  dueDate: string;
  status: string;
  notes?: string | null;
  contactType: string;
  brand?: { id: string; name: string } | null;
  influencer?: { id: string; name: string } | null;
};

type Activity = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  brand?: { id: string; name: string } | null;
  influencer?: { id: string; name: string } | null;
  user?: { id: string; name: string } | null;
};

function StatCard({
  label,
  value,
  icon,
  tone,
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: string;
  href?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
          <p className={cn("mt-1.5 text-2xl font-bold text-zinc-900 dark:text-zinc-50", tone)}>{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
          {icon}
        </div>
      </div>
      {href && (
        <Link href={href} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">
          View <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </Card>
  );
}

export function DashboardView({ user, canAnalytics }: { user: SessionUser; canAnalytics: boolean }) {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [followups, setFollowups] = React.useState<Followup[]>([]);
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [analyticsRes, fuRes, actRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/followups?bucket=today&pageSize=8"),
          fetch("/api/activities?pageSize=8"),
        ]);
        const a = await analyticsRes.json();
        const f = await fuRes.json();
        const ac = await actRes.json();
        if (!active) return;
        if (!analyticsRes.ok) throw new Error(a.error || "Failed to load analytics");
        setData(a);
        setFollowups(f.followups ?? []);
        setActivities(ac.activities ?? []);
      } catch (e: any) {
        if (active) setError(e.message ?? "Something went wrong");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <EmptyState icon={<AlertTriangle className="h-5 w-5" />} title="Could not load dashboard" description={error} />
    );
  }

  if (!data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const s = data.summary;
  const emailSeries = data.emailByDay.map((d) => ({
    day: format(new Date(d.day), "MMM d"),
    Sent: d.sent,
    Opened: d.opened,
    Clicked: d.clicked,
  }));

  const emailRate = s.emailsSent30 > 0 ? Math.round((s.emailsDelivered30 / s.emailsSent30) * 100) : 0;
  const openRate = s.emailsSent30 > 0 ? Math.round((s.emailsOpened30 / s.emailsSent30) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="text-sm text-zinc-500">
            {format(new Date(), "EEEE, d MMMM yyyy")} · Welcome back, {user.name.split(" ")[0]}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/brands"
            className="inline-flex h-9 items-center rounded-lg border border-zinc-300 px-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Building2 className="mr-1.5 h-4 w-4" /> Brands
          </Link>
          <Link
            href="/influencers"
            className="inline-flex h-9 items-center rounded-lg border border-zinc-300 px-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Users className="mr-1.5 h-4 w-4" /> Influencers
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Brands" value={s.brands} icon={<Building2 className="h-4 w-4" />} href="/brands" />
        <StatCard label="Influencers" value={s.influencers} icon={<Users className="h-4 w-4" />} href="/influencers" />
        <StatCard label="Campaigns" value={s.campaigns} icon={<Megaphone className="h-4 w-4" />} href="/campaigns" />
        <StatCard label="Emails (30d)" value={s.emailsSent30} icon={<Mail className="h-4 w-4" />} href="/outreach" />
        <StatCard
          label="Due today"
          value={s.followupsToday}
          icon={<CalendarClock className="h-4 w-4" />}
          href="/follow-ups?bucket=today"
          tone={s.followupsToday > 0 ? "text-amber-500" : undefined}
        />
        <StatCard
          label="Overdue"
          value={s.followupsOverdue}
          icon={<AlertTriangle className="h-4 w-4" />}
          href="/follow-ups?bucket=overdue"
          tone={s.followupsOverdue > 0 ? "text-red-500" : undefined}
        />
      </div>

      {/* Secondary stats + charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Email performance (30d)</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="flex items-center justify-center gap-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {emailRate}%
              </p>
              <p className="text-[11px] text-zinc-400">delivered</p>
            </div>
            <div>
              <p className="flex items-center justify-center gap-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                <MailOpen className="h-4 w-4 text-indigo-500" /> {openRate}%
              </p>
              <p className="text-[11px] text-zinc-400">opened</p>
            </div>
            <div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{s.followupsCompleted30}</p>
              <p className="text-[11px] text-zinc-400">follow-ups done</p>
            </div>
          </div>
        </Card>

        {canAnalytics ? (
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Emails sent last 30 days</p>
              <Link href="/analytics" className="text-xs font-medium text-indigo-600 hover:underline">
                Full analytics →
              </Link>
            </div>
            <EmailSeriesChart data={emailSeries} />
          </Card>
        ) : (
          <Card className="flex items-center justify-center p-5 lg:col-span-2">
            <p className="text-sm text-zinc-400">You don&apos;t have analytics access.</p>
          </Card>
        )}
      </div>

      {/* Status breakdown + lists */}
      <div className="grid gap-4 lg:grid-cols-3">
        {canAnalytics && (
          <Card>
            <CardHeader>
              <CardTitle>Lead status</CardTitle>
              <CardDescription>Brands & influencers pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const all = [
                  ...data.brandStatuses.map((x) => ({ ...x, label: "Brands" })),
                  ...data.influencerStatuses.map((x) => ({ ...x, label: "Influencers" })),
                ].filter((x) => x.count > 0);
                if (all.length === 0) {
                  return <p className="py-6 text-center text-sm text-zinc-400">No records yet.</p>;
                }
                return <LeadStatusChart data={all} />;
              })()}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-amber-500" /> Due today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {followups.length === 0 ? (
              <p className="py-4 text-sm text-zinc-400">Nothing due today. Nice!</p>
            ) : (
              followups.map((f) => {
                const entity = f.brand ? { name: f.brand.name, href: `/brands/${f.brand.id}` } : f.influencer ? { name: f.influencer.name, href: `/influencers/${f.influencer.id}` } : null;
                return (
                  <div key={f.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {entity ? <Link href={entity.href} className="hover:underline">{entity.name}</Link> : "—"}
                      </p>
                      {f.notes && <p className="truncate text-xs text-zinc-400">{f.notes}</p>}
                    </div>
                    <StatusBadge label={f.brand ? "Brand" : "Influencer"} />
                  </div>
                );
              })
            )}
            <Link href="/follow-ups" className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-indigo-600 hover:underline">
              Manage follow-ups <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-indigo-500" /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.length === 0 ? (
              <p className="py-4 text-sm text-zinc-400">No activity yet.</p>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5">
                  <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-700 dark:text-zinc-200">{a.description}</p>
                    <p className="text-[11px] text-zinc-400">
                      {timeAgo(a.createdAt)}
                      {a.user ? ` · ${a.user.name}` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
            <Link href="/activity" className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-indigo-600 hover:underline">
              View all activity <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent campaigns + top influencers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentCampaigns.length === 0 ? (
              <p className="py-4 text-sm text-zinc-400">No campaigns yet. <Link className="text-indigo-600" href="/campaigns">Create one →</Link></p>
            ) : (
              data.recentCampaigns.map((c) => (
                <Link key={c.id} href={`/campaigns/${c.id}`} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{c.name}</p>
                    <p className="text-xs text-zinc-400">{c.brand?.name ?? "—"}</p>
                  </div>
                  <StatusBadge label={c.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top influencers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topInfluencers.length === 0 ? (
              <p className="py-4 text-sm text-zinc-400">No influencers yet. <Link className="text-indigo-600" href="/influencers">Add one →</Link></p>
            ) : (
              data.topInfluencers.map((inf, i) => (
                <Link key={inf.id} href={`/influencers/${inf.id}`} className="flex items-center gap-3 rounded-lg border border-zinc-100 px-3 py-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-500 dark:bg-zinc-800">
                    {i + 1}
                  </div>
                  <Avatar name={inf.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{inf.name}</p>
                    {inf.instagramUsername && <p className="truncate text-xs text-zinc-400">@{inf.instagramUsername}</p>}
                  </div>
                  <p className="text-xs font-semibold text-zinc-500">{formatNumber(inf.followers)}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}