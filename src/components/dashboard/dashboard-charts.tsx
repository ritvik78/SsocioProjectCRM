"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function EmailSeriesChart({ data }: { data: { day: string; Sent: number; Opened: number; Clicked: number }[] }) {
  return (
    <div className="mt-3 h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="Sent" stroke="#6366f1" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Opened" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LeadStatusChart({ data }: { data: { name: string; color: string; count: number; label: string }[] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-zinc-400">No records yet.</p>;
  }
  return (
    <div className="mt-2 h-44">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
            {data.map((x, i) => (
              <Cell key={i} fill={x.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, _name: any, item: any) => [`${value} ${item?.payload?.label}`, item?.payload?.name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
