"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Globe, Mail, Phone, AtSign, Link2, Pencil, CalendarClock, Send, CalendarCheck, User as UserIcon } from "lucide-react";

import { Button, Select, Card, CardHeader, CardTitle, CardContent, Spinner, EmptyState } from "@/components/ui/primitives";
import { StatusBadge, PriorityBadge, Tabs, Avatar, ConfirmDialog } from "@/components/ui/data";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import dynamic from "next/dynamic";
import type { BrandStatus, TeamMember, BrandFormValues } from "@/components/brands/brand-form";
import { FormSkeleton } from "@/components/ui/skeletons";
import { formatDate, formatDateTime, timeAgo } from "@/lib/utils";

const BrandForm = dynamic(
  () => import("@/components/brands/brand-form").then((m) => m.BrandForm),
  { loading: () => <FormSkeleton /> }
);
const QuickSendEmail = dynamic(
  () => import("@/components/outreach/quick-send").then((m) => m.QuickSendEmail),
  { loading: () => <FormSkeleton /> }
);
const FollowupForm = dynamic(
  () => import("@/components/followups/followup-form").then((m) => m.FollowupForm),
  { loading: () => <FormSkeleton /> }
);
import { ACTIVITY_TYPES } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";

type BrandDetail = {
  id: string;
  name: string;
  companyName: string | null;
  contactName: string | null;
  designation: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagramHandle: string | null;
  linkedin: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
  priority: string;
  notes: string | null;
  createdAt: string;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  statusId: string;
  status: { id: string; name: string; color: string | null } | null;
  leadOwner: { id: string; name: string; email: string } | null;
  campaignStatus: string | null;
  businessCategory: string | null;
  location: string | null;
  gstNumber: string | null;
  description: string | null;
  productsServices: string | null;
  collaborationType: string | null;
  expectedCampaignType: string | null;
  budget: string | null;
  activities: { id: string; type: string; description: string; createdAt: string }[];
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
  campaigns: { id: string; name: string; status: string; description: string | null; startDate: string | null; endDate: string | null }[];
  responses: { id: string; type: string; text: string | null; channel: string | null; date: string | null; notes: string | null }[];
};

type Tab = "timeline" | "followups" | "emails" | "campaigns" | "notes";

export function BrandDetail({ id, user }: { id: string; user: SessionUser }) {
  const { toast } = useToast();
  const router = useRouter();
  const [brand, setBrand] = React.useState<BrandDetail | null>(null);
  const [statuses, setStatuses] = React.useState<BrandStatus[]>([]);
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [error, setError] = React.useState("");
  const [tab, setTab] = React.useState<Tab>("timeline");

  const [editOpen, setEditOpen] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [fpOpen, setFpOpen] = React.useState(false);
  const [selectEmail, setSelectEmail] = React.useState<BrandDetail["emailMessages"][number] | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const canEdit = user.permissions.has("brands.edit");
  const canDelete = user.permissions.has("brands.delete");
  const canSend = user.permissions.has("emails.send");
  const canFollowup = user.permissions.has("followups.manage");

  const reload = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/brands/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setBrand(data.brand);
    } catch (e: any) {
      setError(e.message ?? "Failed to load brand");
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
        setStatuses(data.brandStatuses ?? []);
        setMembers(data.members ?? []);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const changeStatus = async (statusId: string) => {
    if (!brand || statusId === brand.statusId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/brands/${id}`, {
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

  const changePriority = async (priority: string) => {
    if (!brand || priority === brand.priority) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/brands/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Priority updated", variant: "success" });
      reload();
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (values: BrandFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/brands/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Brand updated", variant: "success" });
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
      const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Brand deleted", variant: "success" });
      router.push("/brands");
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "error" });
      setDeleteOpen(false);
    }
  };

  if (error) {
    return <EmptyState icon={<Building2 className="h-5 w-5" />} title="Could not load brand" description={error} />;
  }
  if (!brand) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const ig = brand.instagramHandle?.replace(/^@/, "");
  const tabs = [
    { value: "timeline" as Tab, label: "Timeline", count: brand.activities.length },
    { value: "followups" as Tab, label: "Follow-ups", count: brand.followups.length },
    { value: "emails" as Tab, label: "Emails", count: brand.emailMessages.length },
    { value: "campaigns" as Tab, label: "Campaigns", count: brand.campaigns.length },
    { value: "notes" as Tab, label: "Notes" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/brands" className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Avatar name={brand.name} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{brand.name}</h1>
              <StatusBadge label={brand.status?.name} color={brand.status?.color} />
              <PriorityBadge priority={brand.priority} />
            </div>
            <p className="text-sm text-zinc-500">
              {[brand.companyName, brand.industry, brand.city].filter(Boolean).join(" · ") || "Brand"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSend && brand.email && (
            <Button onClick={() => setSendOpen(true)}>
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

      {/* Quick pipeline edits */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Status</span>
            <Select value={brand.statusId} onChange={(e) => changeStatus(e.target.value)} disabled={!canEdit || submitting} className="w-48">
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Priority</span>
            <Select value={brand.priority} onChange={(e) => changePriority(e.target.value)} disabled={!canEdit || submitting} className="w-36">
              {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-zinc-500">
            {brand.nextFollowUpAt && (
              <span className="flex items-center gap-1">
                <CalendarCheck className="h-3.5 w-3.5 text-amber-500" /> Next: {formatDate(brand.nextFollowUpAt)}
              </span>
            )}
            <span className="text-zinc-400">Created {timeAgo(brand.createdAt)}</span>
          </div>
        </div>
      </Card>

      {/* Overview */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
              <UserIcon className="h-4 w-4 text-zinc-400" />
              <span className="text-zinc-400">Contact:</span>
              <span className="font-medium">{brand.contactName || "—"}</span>
              <span className="text-xs text-zinc-400">{brand.designation || ""}</span>
            </div>
            {brand.email && (
              <a href={`mailto:${brand.email}`} className="flex items-center gap-2 text-zinc-700 hover:text-indigo-600 dark:text-zinc-200">
                <Mail className="h-4 w-4 text-zinc-400" /> {brand.email}
              </a>
            )}
            {brand.phone && (
              <a href={`tel:${brand.phone}`} className="flex items-center gap-2 text-zinc-700 hover:text-indigo-600 dark:text-zinc-200">
                <Phone className="h-4 w-4 text-zinc-400" /> {brand.phone}
              </a>
            )}
            {brand.website && (
              <a href={brand.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-zinc-700 hover:text-indigo-600 dark:text-zinc-200">
                <Globe className="h-4 w-4 text-zinc-400" /> {brand.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {ig && (
              <a href={`https://instagram.com/${ig}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-zinc-700 hover:text-pink-600 dark:text-zinc-200">
                <AtSign className="h-4 w-4 text-zinc-400" /> @{ig}
              </a>
            )}
            {brand.linkedin && (
              <a href={brand.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-zinc-700 hover:text-sky-600 dark:text-zinc-200">
                <Link2 className="h-4 w-4 text-zinc-400" /> LinkedIn
              </a>
            )}
            {!brand.email && !brand.phone && !brand.website && !ig && !brand.linkedin && (
              <p className="py-2 text-sm text-zinc-400">No contact details yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-400">Lead owner</span><span className="font-medium">{brand.leadOwner?.name || "Unassigned"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Source</span><span className="font-medium">{brand.source || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Last contacted</span><span className="font-medium">{brand.lastContactedAt ? formatDateTime(brand.lastContactedAt) : "Never"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Next follow-up</span><span className="font-medium">{brand.nextFollowUpAt ? formatDate(brand.nextFollowUpAt) : "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">City</span><span className="font-medium">{[brand.city, brand.state].filter(Boolean).join(", ") || "—"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-400">Campaign status</span><span className="font-medium">{brand.campaignStatus || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Category</span><span className="font-medium">{brand.businessCategory || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Budget</span><span className="font-medium">{brand.budget || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Collaboration</span><span className="font-medium">{brand.collaborationType || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">GST</span><span className="font-medium">{brand.gstNumber || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Location</span><span className="font-medium">{brand.location || "—"}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        <CardContent className="p-5">
          {tab === "timeline" && (
            <div className="space-y-4">
              {brand.activities.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-400">No activity yet.</p>
              ) : (
                brand.activities.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
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
              {brand.followups.map((f, i) => {
                const overdue = f.status === "PENDING" && new Date(f.dueDate) < new Date();
                return (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {formatDate(f.dueDate)} · {f.contactType}
                      </p>
                      {f.notes && <p className="text-xs text-zinc-400">{f.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={f.priority} />
                      <StatusBadge label={f.status} color={overdue ? "#ef4444" : undefined} />
                      <span className="text-xs text-zinc-400">{f.assignedTo?.name ?? "—"}</span>
                    </div>
                  </div>
                );
              })}
              {brand.followups.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-400">No follow-ups scheduled.</p>
              )}
            </div>
          )}

          {tab === "emails" && (
            <div className="space-y-2">
              {brand.emailMessages.map((m) => (
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
              {brand.emailMessages.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-400">No emails sent yet.</p>
              )}
            </div>
          )}

          {tab === "campaigns" && (
            <div className="space-y-2">
              {brand.campaigns.map((c) => (
                <Link key={c.id} href={`/campaigns/${c.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2.5 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{c.name}</p>
                    <p className="text-xs text-zinc-400">
                      {c.startDate ? `${formatDate(c.startDate)} → ${c.endDate ? formatDate(c.endDate) : "…"}` : "Dates not set"}
                    </p>
                  </div>
                  <StatusBadge label={c.status} />
                </Link>
              ))}
              {brand.campaigns.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-400">
                  No campaigns. <Link href="/campaigns" className="text-indigo-600">Create one →</Link>
                </p>
              )}
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{brand.notes || "No notes yet."}</p>
              {brand.description && (
                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Description</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{brand.description}</p>
                </div>
              )}
              {brand.productsServices && (
                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Products / services</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{brand.productsServices}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit brand" description={brand.name} size="lg">
        <BrandForm
          statuses={statuses}
          members={members}
          initial={{
            name: brand.name,
            companyName: brand.companyName,
            contactName: brand.contactName,
            designation: brand.designation,
            email: brand.email,
            phone: brand.phone,
            website: brand.website,
            instagramHandle: brand.instagramHandle,
            linkedin: brand.linkedin,
            industry: brand.industry,
            city: brand.city,
            state: brand.state,
            source: brand.source,
            statusId: brand.statusId,
            priority: brand.priority,
            notes: brand.notes,
            leadOwnerId: brand.leadOwner?.id ?? null,
            budget: brand.budget,
            description: brand.description,
            productsServices: brand.productsServices,
            collaborationType: brand.collaborationType,
            expectedCampaignType: brand.expectedCampaignType,
            businessCategory: brand.businessCategory,
            location: brand.location,
            gstNumber: brand.gstNumber,
            campaignStatus: brand.campaignStatus,
          }}
          submitting={submitting}
          onSubmit={submitEdit}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <QuickSendEmail open={sendOpen} onClose={() => setSendOpen(false)} recipient={brand.email} brandId={brand.id} brandName={brand.name} onSent={reload} />

      <FollowupForm
        open={fpOpen}
        onClose={() => setFpOpen(false)}
        brandId={brand.id}
        entityName={brand.name}
        members={members}
        defaultAssignedToId={user.id}
        onCreated={reload}
      />

      {/* Email preview */}
      <Modal open={!!selectEmail} onClose={() => setSelectEmail(null)} title={selectEmail?.subject || "Email"} description={`To ${selectEmail?.recipient || "—"}`} size="lg">
        {selectEmail && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">Sent {formatDateTime(selectEmail.createdAt)} via {selectEmail.senderEmail || "—"}</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{selectEmail.body}</p>
            {canSend && (
              <Button
                variant="outline"
                onClick={() => {
                  setSendOpen(true);
                  setSelectEmail(null);
                }}
              >
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
        title="Delete brand?"
        description={`This permanently deletes "${brand.name}" and its data.`}
        confirmLabel="Delete"
      />
    </div>
  );
}