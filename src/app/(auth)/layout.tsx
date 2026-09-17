import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500">
          <Sparkles className="h-5 w-5 text-white" />
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