"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button, Field, Input, Spinner } from "@/components/ui/primitives";
import { ROLE_LABELS } from "@/lib/constants";

export function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [info, setInfo] = React.useState<{ email: string; name?: string | null; role: string } | null>(null);

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      if (!token) {
        setError("Missing invitation token");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/auth/activate?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invitation not found");
      } else {
        setInfo(data.invitation);
      }
      setLoading(false);
    })();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/auth/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    setDone(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <h1 className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">Account activated</h1>
        <p className="mt-1 text-sm text-zinc-500">Your account is ready. You can now sign in.</p>
        <button onClick={() => router.push("/login")} className="mt-4 text-sm font-medium text-indigo-600 hover:underline">
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Set up your account</h1>
      {error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-zinc-500">
            {info?.name ?? "You"} · <span className="font-medium">{info?.email}</span> ·{" "}
            <span className="font-medium text-indigo-600">{info?.role ? ROLE_LABELS[info.role as keyof typeof ROLE_LABELS] : ""}</span>
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Create a password" required>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
            </Field>
            <Field label="Confirm password" required>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" required />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={submitting} className="w-full">
              Activate account
            </Button>
          </form>
        </>
      )}
    </div>
  );
}