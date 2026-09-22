import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800/80", className)}
      {...props}
    />
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9.5 w-24 rounded-lg" />
        <Skeleton className="h-9.5 w-32 rounded-lg" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <Skeleton className="h-9.5 w-full max-w-sm rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9.5 w-28 rounded-lg" />
          <Skeleton className="h-9.5 w-28 rounded-lg" />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="grid grid-cols-5 gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 items-center gap-4 p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-64 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-6 w-40" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9.5 w-full rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9.5 w-full rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="flex h-64 w-full items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
      <Skeleton className="h-48 w-full max-w-md rounded-xl" />
    </div>
  );
}
