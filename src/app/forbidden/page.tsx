import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <ShieldX className="h-12 w-12 text-zinc-300" />
      <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">Access denied</h1>
      <p className="mt-1 text-sm text-zinc-500">You don’t have permission to view this page.</p>
      <Link href="/dashboard" className="mt-4 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
        Back to dashboard
      </Link>
    </div>
  );
}