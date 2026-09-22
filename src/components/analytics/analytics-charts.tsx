"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { CAMPAIGN_STATUS_COLORS } from "@/lib/constants";

const AXIS_TICK = { fontSize: 11, fill: "#71717a" };
const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid #e4e4e7",
  fontSize: 12,
  background: "#fff",
} as const;
const EMAIL_COLORS = { sent: "#3b82f6", opened: "#10b981", clicked: "#f59e0b" };

export function AnalyticsEmailChart({ data }: { data: { day: string; sent: number; opened: number; clicked: number }[] }) {
  if (data.length === 0) {
    return <p className="flex h-56 items-center justify-center text-sm text-zinc-400">No emails sent in the last 30 days.</p>;
  }
  return (
    <div className="mt-3 h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={EMAIL_COLORS.sent} stopOpacity={0.25} />
              <stop offset="95%" stopColor={EMAIL_COLORS.sent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis dataKey="day" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e4e4e7" }} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Area type="monotone" dataKey="sent" name="Sent" stroke={EMAIL_COLORS.sent} fill="url(#gSent)" strokeWidth={2} />
          <Area type="monotone" dataKey="opened" name="Opened" stroke={EMAIL_COLORS.opened} fill="transparent" strokeWidth={2} />
          <Area type="monotone" dataKey="clicked" name="Clicked" stroke={EMAIL_COLORS.clicked} fill="transparent" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AnalyticsPipelineChart({ rows, suffix }: { rows: { name: string; color: string; count: number }[]; suffix: string }) {
  const filtered = rows.filter((r) => r.count > 0);
  return (
    <div className="flex h-52 items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={filtered} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2}>
            {filtered.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      {rows.reduce((a, r) => a + r.count, 0) === 0 && <span className="absolute text-xs text-zinc-400">No {suffix} yet</span>}
    </div>
  );
}

export function AnalyticsCampaignStatusChart({ rows }: { rows: { status: string; count: number }[] }) {
  if (rows.every((c) => c.count === 0)) {
    return <p className="flex h-52 items-center justify-center text-sm text-zinc-400">No campaigns yet.</p>;
  }
  return (
    <div className="mt-3 h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis dataKey="status" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#e4e4e7" }} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f4f4f5" }} />
          <Bar dataKey="count" name="Campaigns" radius={[4, 4, 0, 0]}>
            {rows.map((c) => (
              <Cell key={c.status} fill={CAMPAIGN_STATUS_COLORS[c.status]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
