"use client";

import * as React from "react";
import { Save, RefreshCw, KeyRound, ShieldCheck } from "lucide-react";

import { Button, Input, Select, Card, CardContent, Spinner, Field } from "@/components/ui/primitives";
import { Tabs, Table, THead, TBody, TH, TD, EmptyRow, Avatar, StatusBadge, Pagination } from "@/components/ui/data";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";

type EmailSettings = {
  provider: string;
  apiKeyConfigured: boolean;
  senderEmail: string | null;
  senderName: string | null;
  replyTo: string | null;
};

type AuditLog = {
  id: string;
  action: string;
  recordType: string;
  recordId: string | null;
  previousValue: any;
  newValue: any;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
};

type Tab = "email" | "audit" | "profile";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "#22c55e",
  UPDATE: "#3b82f6",
  DELETE: "#ef4444",
};

export function SettingsView({ user }: { user: SessionUser }) {
  const { toast } = useToast();
  const [tab, setTab] = React.useState<Tab>("email");

  const [settings, setSettings] = React.useState<EmailSettings | null>(null);
  const [provider, setProvider] = React.useState("resend");
  const [senderEmail, setSenderEmail] = React.useState("");
  const [senderName, setSenderName] = React.useState("");
  const [replyTo, setReplyTo] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = React.useState(false);
  const [logError, setLogError] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("");
  const [recordFilter, setRecordFilter] = React.useState("");
  const [auditPage, setAuditPage] = React.useState(1);
  const [auditTotal, setAuditTotal] = React.useState(0);
  const [auditTotalPages, setAuditTotalPages] = React.useState(1);

  const loadSettings = React.useCallback(async () => {
    try {
      const res = await fetch("/api/settings/email");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load settings");
      const s = data.settings ?? {};
      setSettings(s);
      setProvider(s.provider ?? "resend");
      setSenderEmail(s.senderEmail ?? "");
      setSenderName(s.senderName ?? "");
      setReplyTo(s.replyTo ?? "");
    } catch (e: any) {
      toast({ title: "Could not load settings", description: e.message, variant: "error" });
    }
  }, [toast]);

  const loadLogs = React.useCallback(async () => {
    setLogsLoading(true);
    setLogError("");
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      if (recordFilter) params.set("q", recordFilter);
      params.set("page", String(auditPage));
      params.set("pageSize", "25");
      const res = await fetch(`/api/audit?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load audit log");
      setLogs(data.logs ?? []);
      setAuditTotal(data.total ?? 0);
      setAuditTotalPages(data.totalPages ?? 1);
    } catch (e: any) {
      setLogError(e.message ?? "Failed to load audit log");
    } finally {
      setLogsLoading(false);
    }
  }, [actionFilter, recordFilter, auditPage]);

  React.useEffect(() => {
    const t = setTimeout(() => loadSettings(), 0);
    return () => clearTimeout(t);
  }, [loadSettings]);

  React.useEffect(() => {
    if (tab === "audit") {
      const t = setTimeout(() => loadLogs(), 0);
      return () => clearTimeout(t);
    }
  }, [tab, loadLogs]);

  const saveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          senderEmail: senderEmail.trim(),
          senderName: senderName.trim(),
          replyTo: replyTo.trim() || null,
          apiKey: apiKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      toast({ title: "Email settings saved", variant: "success" });
      setApiKey("");
      loadSettings();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Settings</h1>
        <p className="text-sm text-zinc-500">Workspace configuration and audit trail</p>
      </div>

      <Card>
        <Tabs
          tabs={[
            { value: "email" as Tab, label: "Email setup" },
            { value: "audit" as Tab, label: "Audit log" },
            { value: "profile" as Tab, label: "Profile" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <CardContent className="p-5">
          {tab === "email" && (
            <div className="max-w-xl">
              {!settings ? (
                <div className="flex h-40 items-center justify-center">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : (
                <form onSubmit={saveEmail} className="space-y-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                      <KeyRound className="h-4 w-4 text-zinc-400" /> Email provider
                    </h2>
                    <p className="mb-3 text-xs text-zinc-400">
                      Choose how the app sends outreach and invitation emails. Set the provider API key in your
                      server environment ({settings.provider === "resend" ? "RESEND_API_KEY" : "MANUAL_EMAIL_API_KEY"}).
                    </p>
                  </div>
                  <Field label="Provider" required>
                    <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
                      <option value="resend">Resend</option>
                      <option value="manual">Manual (SMTP)</option>
                    </Select>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Sender email" required>
                      <Input type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="team@ssociopro.com" />
                    </Field>
                    <Field label="Sender name" required>
                      <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Ssocio Pro" />
                    </Field>
                  </div>
                  <Field label="Reply-to email">
                    <Input type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="Optional" />
                  </Field>
                  <Field label="Provider API key">
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={settings.apiKeyConfigured ? "•••••••• (leave blank to keep current key)" : "Set the API key"}
                    />
                    <p className="mt-1 text-xs text-zinc-400">
                      {settings.apiKeyConfigured ? "An API key is currently configured." : "No API key configured yet — add one via your environment variables."}
                    </p>
                  </Field>
                  {settings.provider === "resend" && !settings.apiKeyConfigured && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      Emails will fail until RESEND_API_KEY is set in the server environment.
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving…" : <><Save className="h-4 w-4" /> Save settings</>}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {tab === "audit" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setAuditPage(1); }} className="w-40">
                  <option value="">All actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                </Select>
                <Select value={recordFilter} onChange={(e) => { setRecordFilter(e.target.value); setAuditPage(1); }} className="w-48">
                  <option value="">All record types</option>
                  <option value="Brand">Brands</option>
                  <option value="Influencer">Influencers</option>
                  <option value="Campaign">Campaigns</option>
                  <option value="User">Users</option>
                  <option value="EmailTemplate">Email drafts</option>
                  <option value="Response">Responses</option>
                </Select>
                <Button variant="outline" onClick={loadLogs}>
                  <RefreshCw className={cn("h-4 w-4", logsLoading && "animate-spin")} />
                </Button>
                <span className="text-sm text-zinc-400">{auditTotal} entries</span>
              </div>

              {logError ? (
                <p className="text-sm text-red-500">{logError}</p>
              ) : logsLoading && logs.length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : (
                <>
                  <Card className="overflow-hidden">
                    <Table>
                      <THead>
                        <tr>
                          <TH>Action</TH>
                          <TH>Record</TH>
                          <TH>Changed by</TH>
                          <TH>When</TH>
                        </tr>
                      </THead>
                      <TBody>
                        {logs.length === 0 ? (
                          <EmptyRow colSpan={4} message="No audit entries found." />
                        ) : (
                          logs.map((l) => (
                            <tr key={l.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                              <TD>
                                <StatusBadge label={l.action} color={ACTION_COLORS[l.action]} />
                              </TD>
                              <TD>
                                <p className="text-sm text-zinc-800 dark:text-zinc-100">{l.recordType}</p>
                                {l.recordId && <p className="font-mono text-[10px] text-zinc-400">{l.recordId.slice(0, 8)}</p>}
                              </TD>
                              <TD>
                                <div className="flex items-center gap-2">
                                  <Avatar name={l.user?.name ?? "System"} size="sm" color="bg-zinc-400" />
                                  <div>
                                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{l.user?.name ?? "System"}</p>
                                    {l.user?.email && <p className="text-xs text-zinc-400">{l.user.email}</p>}
                                  </div>
                                </div>
                              </TD>
                              <TD className="text-xs text-zinc-400">{new Date(l.createdAt).toLocaleString()}</TD>
                            </tr>
                          ))
                        )}
                      </TBody>
                    </Table>
                  </Card>
                  <Pagination page={auditPage} totalPages={auditTotalPages} total={auditTotal} pageSize={25} onPageChange={setAuditPage} />
                </>
              )}
            </div>
          )}

          {tab === "profile" && (
            <div className="max-w-md space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={user.name} size="lg" color="bg-indigo-500" />
                <div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{user.name}</p>
                  <p className="text-sm text-zinc-500">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Role</p>
                  <p className="mt-1 text-zinc-800 dark:text-zinc-100">{ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Permissions</p>
                  <p className="mt-1 text-zinc-800 dark:text-zinc-100">{user.permissions.size} permissions</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Granted permissions</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...(user.permissions as Set<string>)].map((p) => (
                    <span key={p} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <p className="flex items-center gap-1.5 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-900">
                <ShieldCheck className="h-3.5 w-3.5" /> Contact a Super Admin to update your profile details or password.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}