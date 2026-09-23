"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Field, Input } from "@/components/ui/primitives";
import { toFormData, isNextRedirectError } from "@/lib/utils";
import { signInAction } from "@/lib/actions";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    React.startTransition(async () => {
      try {
        await signInAction(
          toFormData({
            email,
            password,
            next: searchParams.get("next") || "/dashboard",
          })
        );
      } catch (err: any) {
        if (isNextRedirectError(err)) return;
        setError(err?.message || "Sign-in failed");
        setLoading(false);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-md text-zinc-950">
      <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-zinc-600 font-normal">Welcome back to your Ssocio Pro workspace.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        <Field label="Email" required>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" required />
        </Field>
        <Field label="Password" required>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="font-semibold text-amber-600 hover:text-amber-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full h-10.5 bg-amber-400 text-zinc-950 hover:bg-amber-500 font-bold border border-amber-400/90 shadow-sm">
          Sign in
        </Button>
      </form>
    </div>
  );
}