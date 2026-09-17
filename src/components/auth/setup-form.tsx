"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input } from "@/components/ui/primitives";

export function SetupForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Setup failed");
        return;
      }
      // Wait a moment so the session propagates, then sign them in.
      const res2 = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res2.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Create your administrator account</h1>
      <p className="mt-1 text-sm text-zinc-500">
        This is the first account for your workspace. You’ll be granted Super Admin access and can invite your team next.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}
        <Field label="Full name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" required />
        </Field>
        <Field label="Work email" required>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@ssociopro.com" required />
        </Field>
        <Field label="Password" required hint="At least 8 characters">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </Field>
        <Button type="submit" loading={loading} className="w-full">
          Create administrator
        </Button>
      </form>
    </div>
  );
}