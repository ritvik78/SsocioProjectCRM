"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Send,
  CalendarClock,
  Megaphone,
  FileText,
  Activity,
  UserCog,
  BarChart3,
  Settings,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/brands", label: "Brands", icon: Building2 },
  { href: "/influencers", label: "Influencers", icon: Users },
  { href: "/outreach", label: "Outreach", icon: Send },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarClock },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/drafts", label: "Email Drafts", icon: FileText },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/team", label: "Team", icon: UserCog },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/import", label: "Import", icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-zinc-200 bg-white lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-zinc-200 px-5">
        <div className="relative h-9 w-9 shrink-0">
          <Image src="/ssocioprologo.png" alt="Ssocio Pro logo" fill className="rounded-xl object-contain" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-zinc-950 tracking-tight">Ssocio Pro</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">CRM Portal</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                active
                  ? "bg-amber-400/20 text-amber-950 font-bold border-l-4 border-amber-500 shadow-xs"
                  : "text-zinc-800 font-medium hover:bg-amber-50 hover:text-amber-950"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", active ? "text-amber-700" : "text-zinc-600")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-4 bg-amber-50/50">
        <p className="text-[11px] font-semibold leading-relaxed text-zinc-800">
          Brand onboarding • Influencer outreach • Campaigns
        </p>
      </div>
    </aside>
  );
}