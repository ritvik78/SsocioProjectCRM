"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button, Field, Input } from "@/components/ui/primitives";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send the reset link");
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <h1 className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">Check your inbox</h1>
        <p className="mt-1 text-sm text-zinc-500">
          If an account exists for <span className="font-medium">{email}</span>, a password reset link is on its way.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Reset your password</h1>
      <p className="mt-1 text-sm text-zinc-500">Enter your email and we&apos;ll send you a reset link.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}
        <Field label="Email" required>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
        </Field>
        <Button type="submit" loading={loading} className="w-full">
          Send reset link
        </Button>
        <p className="text-center text-sm">
          <Link href="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}