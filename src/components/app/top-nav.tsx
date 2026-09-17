"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Menu,
  X,
  Send,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/data";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { NotificationCenter } from "./notification-center";
import { QuickEmail } from "./quick-email";
import { Sidebar } from "./sidebar";

type SearchResult = {
  id: string;
  kind: "brand" | "influencer";
  name: string;
  email?: string | null;
  instagram?: string | null;
};

export function TopNav({ user }: { user: SessionUser }) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [quickEmailOpen, setQuickEmailOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setResults([]);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (!search || search.length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(search)}`)
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .then((data) => {
          setResults(data.results ?? []);
          setSearching(false);
        })
        .catch(() => setSearching(false));
    }, search && search.length >= 2 ? 250 : 0);
    return () => clearTimeout(t);
  }, [search]);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast({ title: "Signed out", variant: "success" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur lg:px-6 dark:border-zinc-800 dark:bg-zinc-950/90">
        <button
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden dark:hover:bg-zinc-800"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Ssocio CRM</span>
        </div>

        {/* Global search */}
        <div ref={searchRef} className="relative mx-auto w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands, influencers, emails, phones…"
            className="h-9.5 h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          {results.length > 0 && (
            <div className="absolute top-full mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              {results.map((r) => (
                <Link
                  key={`${r.kind}-${r.id}`}
                  href={r.kind === "brand" ? `/brands/${r.id}` : `/influencers/${r.id}`}
                  onClick={() => setResults([])}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <Avatar name={r.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{r.name}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {r.email || r.instagram || r.kind === "brand" ? "Brand" : "Influencer"}
                    </p>
                  </div>
                </Link>
              ))}
              {searching && <p className="px-4 py-2 text-xs text-zinc-400">Searching…</p>}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setQuickEmailOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Email</span>
          </button>

          <NotificationCenter />

          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Avatar name={user.name} />
              <span className="hidden text-left md:block">
                <span className="block max-w-32 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.name}</span>
                <span className="block text-[10px] uppercase tracking-wide text-zinc-400">{user.role.replace("_", " ")}</span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-zinc-400 md:block" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.name}</p>
                  <p className="truncate text-xs text-zinc-500">{user.email}</p>
                </div>
                <button
                  onClick={() => router.push("/settings")}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <UserIcon className="h-4 w-4" /> Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-zinc-950/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between p-4">
              <span className="font-bold text-zinc-900 dark:text-zinc-50">Ssocio Pro</span>
              <button onClick={() => setMobileOpen(false)} className="text-zinc-500 hover:text-zinc-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div onClick={() => setMobileOpen(false)}>
              <MobileNav />
            </div>
          </div>
        </div>
      )}

      <QuickEmail open={quickEmailOpen} onClose={() => setQuickEmailOpen(false)} />
    </>
  );
}

function MobileNav() {
  const items = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/brands", label: "Brands" },
    { href: "/influencers", label: "Influencers" },
    { href: "/outreach", label: "Outreach" },
    { href: "/follow-ups", label: "Follow-ups" },
    { href: "/campaigns", label: "Campaigns" },
    { href: "/drafts", label: "Email Drafts" },
    { href: "/activity", label: "Activity" },
    { href: "/team", label: "Team" },
    { href: "/analytics", label: "Analytics" },
    { href: "/settings", label: "Settings" },
  ];
  return (
    <nav className="space-y-0.5 p-3">
      {items.map((item) => (
        <MobileNavLink key={item.href} href={item.href} label={item.label} />
      ))}
    </nav>
  );
}

function MobileNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-lg px-3 py-2 text-sm font-medium",
        active
          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
      )}
    >
      {label}
    </Link>
  );
}

export { Sidebar };