"use client";

import { Sidebar } from "@/components/app/sidebar";
import { TopNav } from "@/components/app/top-nav";
import type { SessionUser } from "@/lib/auth";

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <Sidebar />
      <div className="lg:pl-60">
        <TopNav user={user} />
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}