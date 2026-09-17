"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Send, Camera, RefreshCw, ExternalLink } from "lucide-react";

import { Button, Input, Select, Card, Spinner, Textarea, Field } from "@/components/ui/primitives";
import { Table, THead, TBody, TH, TD, Pagination, EmptyRow, StatusBadge, Avatar, Tabs } from "@/components/ui/data";
import { Modal, Drawer } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { IG_STATUS_COLORS } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";

type EmailRow = {
  id: string;
  recipient: string | null;
  subject: string;
  body: string;
  deliveryStatus: string;
  sentBy: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  influencer: { id: string; name: string } | null;
  createdAt: string;
};

type IgRow = {
  id: string;
  instagramUsername: string;
  instagramUrl: string | null;
  outreachDate: string;
  outreachType: string;
  message: string | null;
  status: string;
  followUpDate: string | null;
  response: string | null;
  assignedTo: { id: string; name: string } | null;
  influencer: { id: string; name: string };
};

export function OutreachView({ user }: { user: SessionUser }) {
  const { toast } = useToast();
  const [tab, setTab] = React.useState<"emails" | "instagram">("emails");

  const [emails, setEmails] = React.useState<EmailRow[]>([]);
  const [emailTotal, setEmailTotal] = React.useState(0);
  const [emailPages, setEmailPages] = React.useState(1);
  const [emailLoading, setEmailLoading] = React.useState(true);

  const [igRows, setIgRows] = React.useState<IgRow[]>([]);
  const [igTotal, setIgTotal] = React.useState(0);
  const [igPages, setIgPages] = React.useState(1);
  const [igLoading, setIgLoading] = React.useState(true);

  const [search, setSearch] = React.useState("");
  const [emailStatus, setEmailStatus] = React.useState("");
  const [igStatus, setIgStatus] = React.useState("");
  const [page, setPage] = React.useState(1);

  const [composeOpen, setComposeOpen] = React.useState(false);
  const [igRecordOpen, setIgRecordOpen] = React.useState(false);
  const [influencers, setInfluencers] = React.useState<{ id: string; name: string; instagramUsername: string | null }[]>([]);
  const [viewEmail, setViewEmail] = React.useState<EmailRow | null>(null);
  const [viewIg, setViewIg] = React.useState<IgRow | null>(null);

  const loadEmails = React.useCallback(async () => {
    setEmailLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" });
      if (search) params.set("q", search);
      if (emailStatus) params.set("deliveryStatus", emailStatus);
      const res = await fetch(`/api/outreach/email?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setEmails(data.messages ?? []);
      setEmailTotal(data.total ?? 0);
      setEmailPages(data.totalPages ?? 1);
    } catch (e: any) {
      toast({ title: "Could not load emails", description: e.message, variant: "error" });
    } finally {
      setEmailLoading(false);
    }
  }, [page, search, emailStatus, toast]);

  const loadIg = React.useCallback(async () => {
    setIgLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" });
      if (search) params.set("q", search);
      if (igStatus) params.set("status", igStatus);
      const res = await fetch(`/api/outreach/instagram?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setIgRows(data.outreach ?? []);
      setIgTotal(data.total ?? 0);
      setIgPages(data.totalPages ?? 1);
    } catch (e: any) {
      toast({ title: "Could not load Instagram outreach", description: e.message, variant: "error" });
    } finally {
      setIgLoading(false);
    }
  }, [page, search, igStatus, toast]);

  React.useEffect(() => {
    if (tab === "emails") {
      const t = setTimeout(() => loadEmails(), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => loadIg(), 0);
    return () => clearTimeout(t);
  }, [tab, loadEmails, loadIg]);

  const canSend = user.permissions.has("emails.send");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Outreach</h1>
          <p className="text-sm text-zinc-500">Send emails and track Instagram outreach</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIgRecordOpen(true)}>
            <Camera className="h-4 w-4" /> Instagram outreach
          </Button>
          {canSend && (
            <Button onClick={() => setComposeOpen(true)}>
              <Send className="h-4 w-4" /> Send email
            </Button>
          )}
        </div>
      </div>

      <Card>
        <Tabs
          tabs={[
            { value: "emails" as const, label: "Emails", count: emailTotal },
            { value: "instagram" as const, label: "Instagram", count: igTotal },
          ]}
          value={tab}
          onChange={(v) => { setTab(v); setPage(1); }}
        />
        <div className="flex flex-wrap items-center gap-2 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search recipient, subject or @username…" className="pl-9" />
          </div>
          <Select value={tab === "emails" ? emailStatus : igStatus} onChange={(e) => (tab === "emails" ? setEmailStatus(e.target.value) : setIgStatus(e.target.value))} className="w-40">
            <option value="">All statuses</option>
            {tab === "emails"
              ? ["SENT", "DELIVERED", "OPENED", "CLICKED", "BOUNCED", "FAILED"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))
              : [...new Set(Object.keys(IG_STATUS_COLORS))].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
          </Select>
          <Button variant="outline" onClick={() => (tab === "emails" ? loadEmails() : loadIg())}>
            <RefreshCw className={cn("h-4 w-4", (tab === "emails" ? emailLoading : igLoading) && "animate-spin")} />
          </Button>
        </div>

        {tab === "emails" ? (
          emailLoading && emails.length === 0 ? (
            <div className="flex h-40 items-center justify-center"><Spinner className="h-6 w-6" /></div>
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <TH>To</TH>
                    <TH>Subject</TH>
                    <TH>Status</TH>
                    <TH>Sent by</TH>
                    <TH>Date</TH>
                  </tr>
                </THead>
                <TBody>
                  {emails.length === 0 ? (
                    <EmptyRow colSpan={5} message="No emails sent yet." />
                  ) : (
                    emails.map((m) => {
                      const entity = m.brand ? { name: m.brand.name, href: `/brands/${m.brand.id}` } : m.influencer ? { name: m.influencer.name, href: `/influencers/${m.influencer.id}` } : null;
                      return (
                        <tr key={m.id} className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40" onClick={() => setViewEmail(m)}>
                          <TD>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{m.recipient || "—"}</p>
                              <p className="text-xs text-zinc-400">{entity ? `Linked: ${entity.name}` : ""}</p>
                            </div>
                          </TD>
                          <TD>
                            <p className="max-w-[260px] truncate text-sm text-zinc-700 dark:text-zinc-200">{m.subject}</p>
                          </TD>
                          <TD>
                            <StatusBadge label={m.deliveryStatus} color={m.deliveryStatus === "SENT" || m.deliveryStatus === "DELIVERED" || m.deliveryStatus === "OPENED" || m.deliveryStatus === "CLICKED" ? "#22c55e" : "#ef4444"} />
                          </TD>
                          <TD className="text-xs text-zinc-500">{m.sentBy?.name ?? "—"}</TD>
                          <TD className="text-xs text-zinc-400">{timeAgo(m.createdAt)}</TD>
                        </tr>
                      );
                    })
                  )}
                </TBody>
              </Table>
              <Pagination page={page} totalPages={emailPages} total={emailTotal} pageSize={15} onPageChange={(p) => { setPage(p); }} />
            </>
          )
        ) : igLoading && igRows.length === 0 ? (
          <div className="flex h-40 items-center justify-center"><Spinner className="h-6 w-6" /></div>
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH>Influencer</TH>
                  <TH>@username</TH>
                  <TH>Status</TH>
                  <TH>Type</TH>
                  <TH>Date</TH>
                  <TH>Follow-up</TH>
                </tr>
              </THead>
              <TBody>
                {igRows.length === 0 ? (
                  <EmptyRow colSpan={6} message="No Instagram outreach recorded yet." />
                ) : (
                  igRows.map((o) => (
                    <tr key={o.id} className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40" onClick={() => setViewIg(o)}>
                      <TD>
                        <LinkTo href={`/influencers/${o.influencer.id}`} label={o.influencer.name} />
                      </TD>
                      <TD>
                        <a
                          href={`https://instagram.com/${o.instagramUsername.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-medium text-pink-600 hover:underline"
                        >
                          @{o.instagramUsername.replace(/^@/, "")}
                        </a>
                      </TD>
                      <TD>
                        <StatusBadge label={o.status} color={IG_STATUS_COLORS[o.status] ?? "#6b7280"} />
                      </TD>
                      <TD className="text-xs text-zinc-500">{o.outreachType}</TD>
                      <TD className="text-xs text-zinc-400">{formatDate(o.outreachDate)}</TD>
                      <TD className="text-xs text-zinc-500">{o.followUpDate ? formatDate(o.followUpDate) : "—"}</TD>
                    </tr>
                  ))
                )}
              </TBody>
            </Table>
            <Pagination page={page} totalPages={igPages} total={igTotal} pageSize={15} onPageChange={(p) => { setPage(p); }} />
          </>
        )}
      </Card>

      {composeOpen && <ComposeEmail onClose={() => setComposeOpen(false)} onSent={() => { setPage(1); loadEmails(); }} />}
      {igRecordOpen && (
        <IgRecordModal
          onClose={() => setIgRecordOpen(false)}
          influencers={influencers}
          loadInfluencers={() => {
            if (influencers.length) return;
            fetch("/api/influencers?pageSize=500")
              .then((r) => r.json())
              .then((d) => setInfluencers(d.influencers ?? []))
              .catch(() => {});
          }}
          onCreated={() => { setIgRecordOpen(false); loadIg(); }}
        />
      )}

      <Drawer open={!!viewEmail} onClose={() => setViewEmail(null)} title="Email">
        {viewEmail && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">To {viewEmail.recipient}</p>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{viewEmail.subject}</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <StatusBadge label={viewEmail.deliveryStatus} color={viewEmail.deliveryStatus === "SENT" || viewEmail.deliveryStatus === "DELIVERED" ? "#22c55e" : "#ef4444"} />
              Sent {timeAgo(viewEmail.createdAt)}
            </div>
            <p className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">{viewEmail.body}</p>
          </div>
        )}
      </Drawer>

      <Drawer open={!!viewIg} onClose={() => setViewIg(null)} title="Instagram outreach">
        {viewIg && (
          <div className="space-y-3">
            <LinkTo href={`/influencers/${viewIg.influencer.id}`} label={viewIg.influencer.name} />
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <StatusBadge label={viewIg.status} color={IG_STATUS_COLORS[viewIg.status] ?? "#6b7280"} />
              {viewIg.outreachType} · {formatDate(viewIg.outreachDate)}
            </div>
            {viewIg.message && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Message</p>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">{viewIg.message}</p>
              </div>
            )}
            {viewIg.response && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Response</p>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{viewIg.response}</p>
              </div>
            )}
            <a href={`https://instagram.com/${viewIg.instagramUsername.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-pink-600 hover:underline">
              Open @{viewIg.instagramUsername.replace(/^@/, "")} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function LinkTo({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} onClick={(e) => e.stopPropagation()} className="text-sm font-medium text-zinc-800 hover:text-indigo-600 dark:text-zinc-100">
      {label}
    </Link>
  );
}

/* ------------------------------ Compose email ------------------------------ */

type TemplateOption = { id: string; name: string; subject: string; body: string };

function interpolate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_m, key) => vars[key] ?? `{{${key}}}`);
}

function ComposeEmail({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const { toast } = useToast();
  const [templates, setTemplates] = React.useState<TemplateOption[]>([]);
  const [templateId, setTemplateId] = React.useState("");
  const [to, setTo] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [newBrandName, setNewBrandName] = React.useState("");
  const [newInfluencerName, setNewInfluencerName] = React.useState("");
  const [createFollowUp, setCreateFollowUp] = React.useState(false);
  const [followUpDate, setFollowUpDate] = React.useState("");
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/email/templates?active=1");
      const data = await res.json();
      if (active && res.ok) setTemplates(data.templates ?? []);
    })();
    return () => {
      active = false;
    };
  }, []);

  const applyTemplate = (tid: string) => {
    setTemplateId(tid);
    const t = templates.find((x) => x.id === tid);
    if (!t) return;
    setSubject(interpolate(t.subject, {}));
    setBody(interpolate(t.body, {}));
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) {
      toast({ title: "Recipient email is required", variant: "error" });
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Subject and body are required", variant: "error" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: to.trim(),
          subject: subject.trim(),
          body,
          templateId: templateId || undefined,
          newBrandName: newBrandName.trim() || undefined,
          newInfluencerName: newInfluencerName.trim() || undefined,
          createFollowUp: createFollowUp || undefined,
          followUpDate: createFollowUp && followUpDate ? followUpDate : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      toast({ title: "Email sent", description: `To ${to.trim()}`, variant: "success" });
      onClose();
      onSent();
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "error" });
    } finally {
      setSending(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Modal open onClose={onClose} title="Compose email" description="Send an outreach or follow-up email" size="xl">
      <form onSubmit={send} className="space-y-4">
        {templates.length > 0 && (
          <Field label="Use a draft template">
            <Select value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">Custom message</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="To" required>
          <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="name@example.com" />
        </Field>
        <Field label="Subject" required>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
        </Field>
        <Field label="Message" required>
          <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <details className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <summary className="cursor-pointer text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Add to CRM & follow-up options
          </summary>
          <div className="mt-3 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Create brand lead">
                <Input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="New brand name" />
              </Field>
              <Field label="Create influencer lead">
                <Input value={newInfluencerName} onChange={(e) => setNewInfluencerName(e.target.value)} placeholder="New influencer name" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                <input type="checkbox" checked={createFollowUp} onChange={(e) => setCreateFollowUp(e.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
                Schedule a follow-up
              </label>
              {createFollowUp && (
                <Input type="date" min={today} value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
              )}
            </div>
          </div>
        </details>
        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={sending}>{sending ? "Sending…" : "Send email"}</Button>
        </div>
      </form>
    </Modal>
  );
}

/* -------------------------- Record IG outreach ----------------------------- */

function IgRecordModal({
  onClose,
  influencers,
  loadInfluencers,
  onCreated,
}: {
  onClose: () => void;
  influencers: { id: string; name: string; instagramUsername: string | null }[];
  loadInfluencers: () => void;
  onCreated: () => void;
}) {
  const [selected, setSelected] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      await Promise.resolve();
      if (active) loadInfluencers();
    })();
    return () => {
      active = false;
    };
  }, [loadInfluencers]);

  const selectedInfluencer = influencers.find((i) => i.id === selected);

  return (
    <Modal open onClose={onClose} title="Record Instagram outreach" description="Log a DM or comment you sent on Instagram" size="lg">
      {!selectedInfluencer ? (
        <div className="space-y-3">
          <Field label="Choose influencer">
            <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Select an influencer…</option>
              {influencers.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                  {i.instagramUsername ? ` (@${i.instagramUsername.replace(/^@/, "")})` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-xs text-zinc-400">
            Can&apos;t find them? <Link className="text-indigo-600" href="/influencers">Add the influencer first →</Link>
          </p>
          <div className="flex justify-end">
            <Button disabled={!selected} onClick={() => setShowForm(true)}>Next</Button>
          </div>
        </div>
      ) : showForm ? (
        <IgFormMini influencer={selectedInfluencer} onDone={onCreated} onBack={() => setShowForm(false)} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar name={selectedInfluencer.name} size="sm" color="bg-fuchsia-500" />
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{selectedInfluencer.name}</p>
              <p className="text-xs text-pink-600">@{selectedInfluencer.instagramUsername}</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)}>Continue</Button>
        </div>
      )}
    </Modal>
  );
}

function IgFormMini({
  influencer,
  onDone,
  onBack,
}: {
  influencer: { id: string; name: string; instagramUsername: string | null };
  onDone: () => void;
  onBack: () => void;
}) {
  const username = influencer.instagramUsername?.replace(/^@/, "") ?? "";
  const today = new Date().toISOString().split("T")[0];
  return (
    <InstagramOutreachQuick
      influencer={{ id: influencer.id, name: influencer.name, instagramUsername: username }}
      onDone={onDone}
      onBack={onBack}
      today={today}
    />
  );
}

function InstagramOutreachQuick({
  influencer,
  onDone,
  onBack,
  today,
}: {
  influencer: { id: string; name: string; instagramUsername: string };
  onDone: () => void;
  onBack: () => void;
  today: string;
}) {
  const { toast } = useToast();
  const [message, setMessage] = React.useState(
    `Hi ${influencer.name.split(" ")[0] || "there"}! 👋\n\nWe loved your content and would love to collaborate with you for a campaign.\n\nLooking forward to hearing from you!`
  );
  const [status, setStatus] = React.useState("MESSAGE_SENT");
  const [followUpDate, setFollowUpDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/outreach/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencerId: influencer.id,
          instagramUsername: influencer.instagramUsername,
          instagramUrl: `https://instagram.com/${influencer.instagramUsername}`,
          outreachDate: today,
          message: message || undefined,
          outreachType: "DM",
          followUpDate: followUpDate || undefined,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record outreach");
      toast({ title: "Instagram outreach recorded", variant: "success" });
      onDone();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="text-sm text-indigo-600 hover:underline">← Change influencer</button>
        <a href={`https://instagram.com/${influencer.instagramUsername}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-pink-600 hover:underline">
          Open @{influencer.instagramUsername}
        </a>
      </div>
      <Field label="Message">
        <Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {Object.keys(IG_STATUS_COLORS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Follow-up date">
          <Input type="date" min={today} value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Button type="button" variant="outline" onClick={onBack}>Cancel</Button>
        <Button type="button" onClick={submit} disabled={submitting || !influencer.instagramUsername}>
          {submitting ? "Saving…" : "Record outreach"}
        </Button>
      </div>
    </div>
  );
}