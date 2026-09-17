"use client";

import * as React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input, Spinner } from "@/components/ui/primitives";
import { CheckCircle2 } from "lucide-react";

export function ResetPasswordForm() {
  const supabase = createClient();

  const [state, setState] = React.useState<"linking" | "ready" | "error" | "done">("linking");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          setState("error");
          return;
        }
        setState("ready");
        return;
      }
      // Fallback: try token_hash based flow (older links).
      const tokenHash = params.get("token_hash");
      const type = params.get("type") as "recovery" | "email_change" | "invite" | "magiclink" | "signup" | "reauthentication" | null;
      if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type === "magiclink" ? "recovery" : type });
        if (verifyError) {
          setError(verifyError.message);
          setState("error");
          return;
        }
        setState("ready");
        return;
      }
      setError("Invalid or expired reset link. Please request a new one.");
      setState("error");
    })();
  }, [supabase]);

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
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await supabase.auth.signOut();
    setState("done");
  }

  if (state === "linking") {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <h1 className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">Password updated</h1>
        <p className="mt-1 text-sm text-zinc-500">You can now sign in with your new password.</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Set a new password</h1>
      {state === "error" && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {state === "ready" && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="New password" required>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
          </Field>
          <Field label="Confirm password" required>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" required />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Update password
          </Button>
        </form>
      )}
    </div>
  );
}