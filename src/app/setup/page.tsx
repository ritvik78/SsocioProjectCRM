import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/db";
import { FormSkeleton } from "@/components/ui/skeletons";

const SetupForm = dynamic(
  () => import("@/components/auth/setup-form").then((m) => m.SetupForm),
  { loading: () => <FormSkeleton /> }
);

export default async function SetupPage() {
  const userCount = await prisma.user.count();
  if (userCount > 0) redirect("/login");

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
      <div className="w-full max-w-md">
        <SetupForm />
      </div>
    </div>
  );
}