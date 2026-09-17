import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireUser();
  return <AppShell user={ctx.user}>{children}</AppShell>;
}