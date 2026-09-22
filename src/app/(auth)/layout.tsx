import type { ReactNode } from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="relative h-10 w-10 shrink-0">
          <Image src="/ssocioprologo.png" alt="Ssocio Pro logo" fill className="rounded-xl object-contain" />
        </div>
        <div>
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">Ssocio Pro</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">CRM Portal</p>
        </div>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}