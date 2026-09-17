"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, AtSign, Mail, Phone, Pencil, Send, CalendarClock, Camera as IgIcon, Megaphone, CalendarCheck } from "lucide-react";

import { Button, Select, Card, CardHeader, CardTitle, CardContent, Spinner, EmptyState } from "@/components/ui/primitives";
import { StatusBadge, PriorityBadge, Tabs, Avatar, ConfirmDialog } from "@/components/ui/data";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { InfluencerForm, type InfluencerStatus, type InfluencerFormValues } from "@/components/influencers/influencer-form";
import { InstagramOutreachForm } from "@/components/influencers/instagram-outreach-form";
import { QuickSendEmail } from "@/components/outreach/quick-send";
import { FollowupForm } from "@/components/followups/followup-form";
import { formatDate, formatDateTime, timeAgo, formatNumber } from "@/lib/utils";
import { ACTIVITY_TYPES, IG_STATUS_COLORS } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";

type InfluencerDetail = {
  id: string;
  name: string;
  instagramUsername: string | null;
  instagramUrl: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  followers: number | null;
  engagementRate: number | null;
  platform: string;
  audienceLocation: string | null;
  source: string | null;
  statusId: string;
  status: { id: string; name: string; color: string | null } | null;
  priority: string;
  notes: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  createdAt: string;
  portfolio: string | null;
  followups: {
    id: string;
    contactType: string;
    dueDate: string;
    status: string;
    priority: string;
    notes: string | null;
    assignedTo: { id: string; name: string; email: string } | null;
  }[];
  emailMessages: { id: string; recipient: string | null; senderEmail: string | null; subject: string; body: string; deliveryStatus: string; createdAt: string }[];
  instagramOutreach: {
    id: string;
    instagramUsername: string;
    instagramUrl: string | null;
    outreachDate: string;
    outreachType: string;
    message: string | null;
    status: string;
    followUpDate: string | null;
    response: string | null;
    notes: string | null;
  }[];
  responses: { id: string; type: string; text: string | null; channel: string | null; date: string | null }[];
  activities: { id: string; type: string; description: string; createdAt: string }[];
  campaignInfluencers: {
    id: string;
    status: string;
    campaign: { id: string; name: string; status: string; brand: { id: string; name: string } | null };
  }[];
};

type Tab = "timeline" | "followups" | "emails" | "instagram" | "campaigns" | "notes";

export function InfluencerDetail({ id, user }: { id: string; user: SessionUser }) {
  const { toast } = useToast();
  const router = useRouter();
  const [inf, setInf] = React.useState<InfluencerDetail | null>(null);
  const [statuses, setStatuses] = React.useState<InfluencerStatus[]>([]);
  const [members, setMembers] = React.useState<{ id: string; name: string; email: string }[]>([]);
  const [error, setError] = React.useState("");
  const [tab, setTab] = React.useState<Tab>("timeline");

  const [editOpen, setEditOpen] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [igOpen, setIgOpen] = React.useState(false);
  const [fpOpen, setFpOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectEmail, setSelectEmail] = React.useState<InfluencerDetail["emailMessages"][number] | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const canEdit = user.permissions.has("influencers.edit");
  const canDelete = user.permissions.has("influencers.delete");
  const canSend = user.permissions.has("emails.send");
  const canFollowup = user.permissions.has("followups.manage");
  const canIg = user.permissions.has("outreach.manage");

  const reload = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/influencers/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setInf(data.influencer);
    } catch (e: any) {
      setError(e.message ?? "Failed to load influencer");
    }
  }, [id]);

  React.useEffect(() => {
    const t = setTimeout(() => reload(), 0);
    return () => clearTimeout(t);
  }, [reload]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/options");
      const data = await res.json();
      if (active && res.ok) {
        setStatuses(data.influencerStatuses ?? []);
        setMembers(data.members ?? []);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const changeStatus = async (statusId: string) => {
    if (!inf || statusId === inf.statusId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/influencers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Status updated", variant: "success" });
      reload();
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (values: InfluencerFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/influencers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Influencer updated", variant: "success" });
      setEditOpen(false);
      reload();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async () => {
    try {
      const res = await fetch(`/api/influencers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Influencer deleted", variant: "success" });
      router.push("/influencers");
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "error" });
      setDeleteOpen(false);
    }
  };

  if (error) {
    return <EmptyState icon={<Users className="h-5 w-5" />} title="Could not load influencer" description={error} />;
  }
  if (!inf) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const username = inf.instagramUsername?.replace(/^@/, "") ?? "";
  const tabs = [
    { value: "timeline" as Tab, label: "Timeline", count: inf.activities.length },
    { value: "followups" as Tab, label: "Follow-ups", count: inf.followups.length },
    { value: "emails" as Tab, label: "Emails", count: inf.emailMessages.length },
    { value: "instagram" as Tab, label: "Instagram", count: inf.instagramOutreach.length },
    { value: "campaigns" as Tab, label: "Campaigns", count: inf.campaignInfluencers.length },
    { value: "notes" as Tab, label: "Notes" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/influencers" className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Avatar name={inf.name} size="lg" color="bg-fuchsia-500" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{inf.name}</h1>
              <StatusBadge label={inf.status?.name} color={inf.status?.color} />
            </div>
            <p className="text-sm text-zinc-500">
              {[inf.category, inf.city].filter(Boolean).join(" · ") || "Influencer"}
              {inf.followers != null && <> · {formatNumber(inf.followers)} followers</>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canIg && username && (
            <Button onClick={() => setIgOpen(true)}>
              <IgIcon className="h-4 w-4" /> Instagram outreach
            </Button>
          )}
          {canSend && inf.email && (
            <Button variant="outline" onClick={() => setSendOpen(true)}>
              <Send className="h-4 w-4" /> Email
            </Button>
          )}
          {canFollowup && (
            <Button variant="outline" onClick={() => setFpOpen(true)}>
              <CalendarClock className="h-4 w-4" /> Follow-up
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Status</span>
            <Select value={inf.statusId} onChange={(e) => changeStatus(e.target.value)} disabled={!canEdit || submitting} className="w-48">
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-zinc-500">
            {inf.followups.some((f) => f.status === "PENDING") && (
              <span className="flex items-center gap-1">
                <CalendarCheck className="h-3.5 w-3.5 text-amber-500" /> Pending follow-up
              </span>
            )}
            <span className="text-zinc-400">Added {timeAgo(inf.createdAt)}</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {username && (
              <a href={`https://instagram.com/${username}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-zinc-700 hover:text-pink-600 dark:text-zinc-200">
                <AtSign className="h-4 w-4 text-zinc-400" /> @{username}
              </a>
            )}
            {inf.email && (
              <a href={`mailto:${inf.email}`} className="flex items-center gap-2 text-zinc-700 hover:text-indigo-600 dark:text-zinc-200">
                <Mail className="h-4 w-4 text-zinc-400" /> {inf.email}
              </a>
            )}
            {inf.phone && (
              <a href={`tel:${inf.phone}`} className="flex items-center gap-2 text-zinc-700 hover:text-indigo-600 dark:text-zinc-200">
                <Phone className="h-4 w-4 text-zinc-400" /> {inf.phone}
              </a>
            )}
            {!username && !inf.email && !inf.phone && <p className="py-2 text-sm text-zinc-400">No contact details yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-400">Followers</span><span className="font-medium">{inf.followers != null ? formatNumber(inf.followers) : "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Engagement rate</span><span className="font-medium">{inf.engagementRate != null ? `${inf.engagementRate}%` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Platform</span><span className="font-medium">{inf.platform}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Audience location</span><span className="font-medium">{inf.audienceLocation || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Location</span><span className="font-medium">{[inf.city, inf.state].filter(Boolean).join(", ") || "—"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-400">Assigned to</span><span className="font-medium">{inf.assignedTo?.name || "Unassigned"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Source</span><span className="font-medium">{inf.source || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Added</span><span className="font-medium">{formatDate(inf.createdAt)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Next follow-up</span><span className="font-medium">{inf.followups.find((f) => f.status === "PENDING") ? formatDate(inf.followups.find((f) => f.status === "PENDING")!.dueDate) : "—"}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        <CardContent className="p-5">
          {tab === "timeline" && (
            <div className="space-y-4">
              {inf.activities.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-400">No activity yet.</p>
              ) : (
                inf.activities.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-fuchsia-400" />
                    <div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-200">{a.description}</p>
                      <p className="text-xs text-zinc-400">
                        {ACTIVITY_TYPES[a.type as keyof typeof ACTIVITY_TYPES] ?? a.type} · {timeAgo(a.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "followups" && (
            <div className="space-y-2">
              {inf.followups.map((f, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {formatDate(f.dueDate)} · {f.contactType}
                    </p>
                    {f.notes && <p className="text-xs text-zinc-400">{f.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={f.priority} />
                    <StatusBadge label={f.status} color={f.status === "PENDING" ? "#f59e0b" : undefined} />
                    <span className="text-xs text-zinc-400">{f.assignedTo?.name ?? "—"}</span>
                  </div>
                </div>
              ))}
              {inf.followups.length === 0 && <p className="py-6 text-center text-sm text-zinc-400">No follow-ups scheduled.</p>}
            </div>
          )}

          {tab === "emails" && (
            <div className="space-y-2">
              {inf.emailMessages.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectEmail(m)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2.5 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{m.subject || "(no subject)"}</p>
                    <p className="text-xs text-zinc-400">To {m.recipient || "—"} · {timeAgo(m.createdAt)}</p>
                  </div>
                  <StatusBadge label={m.deliveryStatus} color={m.deliveryStatus === "SENT" || m.deliveryStatus === "DELIVERED" ? "#22c55e" : m.deliveryStatus === "FAILED" ? "#ef4444" : "#f59e0b"} />
                </button>
              ))}
              {inf.emailMessages.length === 0 && <p className="py-6 text-center text-sm text-zinc-400">No emails sent yet.</p>}
            </div>
          )}

          {tab === "instagram" && (
            <div className="space-y-2">
              {inf.instagramOutreach.map((o) => (
                <div key={o.id} className="rounded-lg border border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {o.outreachType} · {formatDate(o.outreachDate)}
                      </p>
                      {o.message && <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-500 dark:text-zinc-400">{o.message}</p>}
                      {o.response && (
                        <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          Response: {o.response}
                        </p>
                      )}
                    </div>
                    <StatusBadge label={o.status} color={IG_STATUS_COLORS[o.status] ?? "#6b7280"} />
                  </div>
                </div>
              ))}
              {inf.instagramOutreach.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-400">No Instagram outreach recorded yet.</p>
              )}
            </div>
          )}

          {tab === "campaigns" && (
            <div className="space-y-2">
              {inf.campaignInfluencers.map((ci) => (
                <div key={ci.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
                  <div className="min-w-0">
                    <Link href={`/campaigns/${ci.campaign.id}`} className="text-sm font-medium text-zinc-800 hover:text-indigo-600 dark:text-zinc-100">
                      <Megaphone className="mr-1.5 inline h-3.5 w-3.5 text-zinc-400" />
                      {ci.campaign.name}
                    </Link>
                    <p className="text-xs text-zinc-400">{ci.campaign.brand?.name ?? "—"}</p>
                  </div>
                  <StatusBadge label={ci.campaign.status} />
                </div>
              ))}
              {inf.campaignInfluencers.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-400">Not added to any campaigns yet.</p>
              )}
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{inf.notes || "No notes yet."}</p>
              {inf.portfolio && (
                <a href={inf.portfolio} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:underline">
                  Portfolio / media kit ↗
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit influencer" description={inf.name} size="lg">
        <InfluencerForm
          statuses={statuses}
          members={members}
          initial={{
            name: inf.name,
            instagramUsername: inf.instagramUsername,
            instagramUrl: inf.instagramUrl,
            email: inf.email,
            phone: inf.phone,
            city: inf.city,
            state: inf.state,
            category: inf.category,
            followers: inf.followers,
            engagementRate: inf.engagementRate,
            platform: inf.platform,
            audienceLocation: inf.audienceLocation,
            source: inf.source,
            statusId: inf.statusId,
            notes: inf.notes,
            assignedToId: inf.assignedTo?.id ?? null,
          }}
          submitting={submitting}
          onSubmit={submitEdit}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      {username && <InstagramOutreachForm open={igOpen} onClose={() => setIgOpen(false)} influencer={{ id: inf.id, name: inf.name, instagramUsername: username }} defaultAssignedToId={user.id} onCreated={reload} />}

      <QuickSendEmail open={sendOpen} onClose={() => setSendOpen(false)} recipient={inf.email} influencerId={inf.id} brandName={inf.name} onSent={reload} />

      <FollowupForm
        open={fpOpen}
        onClose={() => setFpOpen(false)}
        influencerId={inf.id}
        entityName={inf.name}
        members={members}
        defaultAssignedToId={user.id}
        onCreated={reload}
      />

      <Modal open={!!selectEmail} onClose={() => setSelectEmail(null)} title={selectEmail?.subject || "Email"} description={`To ${selectEmail?.recipient || "—"}`} size="lg">
        {selectEmail && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">Sent {formatDateTime(selectEmail.createdAt)} via {selectEmail.senderEmail || "—"}</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{selectEmail.body}</p>
            {canSend && (
              <Button variant="outline" onClick={() => { setSendOpen(true); setSelectEmail(null); }}>
                <Send className="h-4 w-4" /> Send similar
              </Button>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={doDelete}
        danger
        title="Delete influencer?"
        description={`This permanently deletes "${inf.name}" and its data.`}
        confirmLabel="Delete"
      />
    </div>
  );
}