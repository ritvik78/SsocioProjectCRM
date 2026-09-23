"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Megaphone, Users, Mail, Pencil, Send, Plus, Trash2, CalendarDays, Wallet, Tag, AtSign, Loader2 } from "lucide-react";

import { Button, Select, Card, CardContent, Spinner, EmptyState } from "@/components/ui/primitives";
import { StatusBadge, Avatar, Tabs, ConfirmDialog } from "@/components/ui/data";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import dynamic from "next/dynamic";
import type { CampaignFormValues } from "@/components/campaigns/campaign-form";
import { FormSkeleton } from "@/components/ui/skeletons";
import { formatDate, formatDateTime, toFormData, isNextRedirectError } from "@/lib/utils";
import { updateCampaign, deleteCampaign } from "@/lib/actions";
import { CAMPAIGN_STATUS_COLORS } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";

const CampaignForm = dynamic(
  () => import("@/components/campaigns/campaign-form").then((m) => m.CampaignForm),
  { loading: () => <FormSkeleton /> }
);

type CampaignDetail = {
  id: string;
  name: string;
  status: string;
  description: string | null;
  objective: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: string | null;
  cashbackIncentive: string | null;
  targetInfluencers: number | null;
  requiredContent: string | null;
  instagramRequirements: string | null;
  hashtags: string | null;
  mentions: string | null;
  termsConditions: string | null;
  brand: { id: string; name: string } | null;
  createdBy: { id: string; name: string } | null;
  campaignInfluencers: {
    id: string;
    status: string;
    invitedAt: string | null;
    influencer: { id: string; name: string; instagramUsername: string | null; email: string | null; followers: number | null; status: { name: string } | null };
  }[];
  emailMessages: { id: string; recipient: string | null; subject: string; createdAt: string; influencer: { id: string; name: string } | null }[];
};

type Tab = "influencers" | "emails" | "details";

const CAMPAIGN_LINK_COLORS: Record<string, string> = {
  PENDING: "#6b7280",
  INVITED: "#3b82f6",
  SENT: "#8b5cf6",
  OPENED: "#06b6d4",
  RESPONDED: "#f59e0b",
  ACCEPTED: "#22c55e",
  REJECTED: "#ef4444",
};

export function CampaignDetail({ id, user }: { id: string; user: SessionUser }) {
  const { toast } = useToast();
  const [campaign, setCampaign] = React.useState<CampaignDetail | null>(null);
  const [brands, setBrands] = React.useState<{ id: string; name: string }[]>([]);
  const [influencers, setInfluencers] = React.useState<{ id: string; name: string; instagramUsername: string | null }[]>([]);
  const [error, setError] = React.useState("");
  const [tab, setTab] = React.useState<Tab>("influencers");

  const [editOpen, setEditOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [inviting, setInviting] = React.useState(false);
  const [pickInfluencer, setPickInfluencer] = React.useState("");

  const canManage = user.permissions.has("campaigns.manage");
  const canSend = user.permissions.has("emails.send");

  const reload = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCampaign(data.campaign);
    } catch (e: any) {
      setError(e.message ?? "Failed to load campaign");
    }
  }, [id]);

  React.useEffect(() => {
    const t = setTimeout(() => reload(), 0);
    return () => clearTimeout(t);
  }, [reload]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/brands?pageSize=500");
      const data = await res.json();
      if (active && res.ok) setBrands(data.brands ?? []);
    })();
    return () => {
      active = false;
    };
  }, []);

  const openAdd = async () => {
    setAddOpen(true);
    setPickInfluencer("");
    try {
      const res = await fetch("/api/influencers?pageSize=500");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setInfluencers(data.influencers ?? []);
    } catch (e: any) {
      toast({ title: "Could not load influencers", description: e.message, variant: "error" });
    }
  };

  const submitEdit = async (values: CampaignFormValues) => {
    setSubmitting(true);
    React.startTransition(async () => {
      try {
        await updateCampaign(toFormData({ ...values, id }));
        toast({ title: "Campaign updated", variant: "success" });
        setEditOpen(false);
        reload();
      } catch (e: any) {
        if (isNextRedirectError(e)) return;
        toast({ title: "Save failed", description: e.message, variant: "error" });
      } finally {
        setSubmitting(false);
      }
    });
  };

  const addInfluencer = async () => {
    if (!pickInfluencer) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/influencers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ influencerId: pickInfluencer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Influencer added", variant: "success" });
      setAddOpen(false);
      reload();
    } catch (e: any) {
      toast({ title: "Could not add", description: e.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const removeInfluencer = async (influencerId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/influencers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ influencerId, action: "remove" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Influencer removed", variant: "success" });
      reload();
    } catch (e: any) {
      toast({ title: "Could not remove", description: e.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const sendInvites = async () => {
    setInviting(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/invite`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitations");
      toast({
        title: `Invitations sent to ${data.sent ?? 0} influencer${(data.sent ?? 0) === 1 ? "" : "s"}`,
        description: data.errors?.length ? `Skipped: ${data.errors.length}` : undefined,
        variant: "success",
      });
      reload();
    } catch (e: any) {
      toast({ title: "Invite failed", description: e.message, variant: "error" });
    } finally {
      setInviting(false);
    }
  };

  const doDelete = async () => {
    React.startTransition(async () => {
      try {
        await deleteCampaign(toFormData({ id }));
        toast({ title: "Campaign deleted", variant: "success" });
      } catch (e: any) {
        if (isNextRedirectError(e)) return;
        toast({ title: "Delete failed", description: e.message, variant: "error" });
        setDeleteOpen(false);
      }
    });
  };

  if (error) {
    return <EmptyState icon={<Megaphone className="h-5 w-5" />} title="Could not load campaign" description={error} />;
  }
  if (!campaign) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const available = influencers.filter((i) => !campaign.campaignInfluencers.some((ci) => ci.influencer.id === i.id));

  const editingInitial: CampaignFormValues = {
    name: campaign.name,
    brandId: campaign.brand?.id ?? "",
    status: campaign.status,
    startDate: campaign.startDate ? campaign.startDate.split("T")[0] : "",
    endDate: campaign.endDate ? campaign.endDate.split("T")[0] : "",
    budget: campaign.budget,
    cashbackIncentive: campaign.cashbackIncentive,
    targetInfluencers: campaign.targetInfluencers,
    requiredContent: campaign.requiredContent,
    instagramRequirements: campaign.instagramRequirements,
    hashtags: campaign.hashtags,
    mentions: campaign.mentions,
    termsConditions: campaign.termsConditions,
    description: campaign.description,
    objective: campaign.objective,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/campaigns" className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{campaign.name}</h1>
              <StatusBadge label={campaign.status} color={CAMPAIGN_STATUS_COLORS[campaign.status]} />
            </div>
            <p className="text-sm text-zinc-500">
              {campaign.brand ? <Link href={`/brands/${campaign.brand.id}`} className="hover:underline">{campaign.brand.name}</Link> : "No brand"} · created by {campaign.createdBy?.name ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSend && campaign.status !== "DRAFT" && (
            <Button onClick={sendInvites} disabled={inviting}>
              {inviting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send invites</>}
            </Button>
          )}
          {canManage && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {canManage && (
            <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400"><CalendarDays className="h-3.5 w-3.5" /> Duration</p>
          <p className="mt-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {campaign.startDate ? `${formatDate(campaign.startDate)} → ${campaign.endDate ? formatDate(campaign.endDate) : "…"}` : "Not set"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400"><Wallet className="h-3.5 w-3.5" /> Budget</p>
          <p className="mt-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{campaign.budget || "—"}</p>
          {campaign.cashbackIncentive && <p className="text-xs text-zinc-400">Cashback: {campaign.cashbackIncentive}</p>}
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400"><Users className="h-3.5 w-3.5" /> Target influencers</p>
          <p className="mt-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{campaign.targetInfluencers ?? "—"}</p>
          <p className="text-xs text-zinc-400">{campaign.campaignInfluencers.length} added so far</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400"><Tag className="h-3.5 w-3.5" /> Hashtags</p>
          <p className="mt-1.5 truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">{campaign.hashtags || "—"}</p>
          {campaign.mentions && <p className="truncate text-xs text-zinc-400">{campaign.mentions}</p>}
        </Card>
      </div>

      <Card>
        <Tabs
          tabs={[
            { value: "influencers" as Tab, label: "Influencers", count: campaign.campaignInfluencers.length },
            { value: "emails" as Tab, label: "Emails", count: campaign.emailMessages.length },
            { value: "details" as Tab, label: "Details" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <CardContent className="p-5">
          {tab === "influencers" && (
            <div className="space-y-2">
              {campaign.campaignInfluencers.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-400">No influencers added yet.</p>
              ) : (
                campaign.campaignInfluencers.map((ci) => (
                  <div key={ci.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={ci.influencer.name} size="sm" color="bg-fuchsia-500" />
                      <div className="min-w-0">
                        <Link href={`/influencers/${ci.influencer.id}`} className="text-sm font-medium text-zinc-800 hover:text-indigo-600 dark:text-zinc-100">
                          {ci.influencer.name}
                        </Link>
                        <p className="truncate text-xs text-zinc-400">
                          {ci.influencer.instagramUsername ? `@${ci.influencer.instagramUsername.replace(/^@/, "")}` : ci.influencer.email || ""}
                          {ci.influencer.followers ? ` · ${ci.influencer.followers.toLocaleString("en-IN")}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ci.invitedAt && <span className="text-xs text-zinc-400">Invited {formatDateTime(ci.invitedAt)}</span>}
                      <StatusBadge label={ci.status} color={CAMPAIGN_LINK_COLORS[ci.status]} />
                      {canManage && (
                        <button onClick={() => removeInfluencer(ci.influencer.id)} disabled={submitting} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" title="Remove">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              {canManage && (
                <button
                  onClick={openAdd}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
                >
                  <Plus className="h-4 w-4" /> Add influencer
                </button>
              )}
            </div>
          )}

          {tab === "emails" && (
            <div className="space-y-2">
              {campaign.emailMessages.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-400">
                  No invitation emails sent yet. {campaign.status !== "DRAFT" ? "Use “Send invites” to email your influencers." : "Launch the campaign (status ≠ DRAFT) to send invites."}
                </p>
              ) : (
                campaign.emailMessages.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{m.subject}</p>
                      <p className="text-xs text-zinc-400">
                        To {m.influencer?.name ?? m.recipient ?? "—"} · {formatDateTime(m.createdAt)}
                      </p>
                    </div>
                    <Mail className="h-4 w-4 text-zinc-400" />
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "details" && (
            <div className="space-y-4 text-sm">
              {campaign.objective && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Objective</p>
                  <p className="mt-1 text-zinc-700 dark:text-zinc-200">{campaign.objective}</p>
                </div>
              )}
              {campaign.requiredContent && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Required content</p>
                  <p className="mt-1 text-zinc-700 dark:text-zinc-200">{campaign.requiredContent}</p>
                </div>
              )}
              {campaign.instagramRequirements && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Instagram requirements</p>
                  <p className="mt-1 text-zinc-700 dark:text-zinc-200">{campaign.instagramRequirements}</p>
                </div>
              )}
              {campaign.mentions && (
                <div>
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400"><AtSign className="h-3 w-3" /> Mentions</p>
                  <p className="mt-1 text-zinc-700 dark:text-zinc-200">{campaign.mentions}</p>
                </div>
              )}
              {campaign.termsConditions && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Terms & conditions</p>
                  <p className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-200">{campaign.termsConditions}</p>
                </div>
              )}
              {campaign.description && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Description</p>
                  <p className="mt-1 text-zinc-700 dark:text-zinc-200">{campaign.description}</p>
                </div>
              )}
              {!campaign.objective && !campaign.requiredContent && !campaign.instagramRequirements && !campaign.termsConditions && !campaign.description && (
                <p className="py-4 text-center text-sm text-zinc-400">No additional details yet.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit campaign" description={campaign.name} size="lg">
        <CampaignForm brands={brands} initial={editingInitial} submitting={submitting} onSubmit={submitEdit} onCancel={() => setEditOpen(false)} />
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add influencer" description={campaign.name}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">Select an influencer to add to this campaign.</p>
          <Select value={pickInfluencer} onChange={(e) => setPickInfluencer(e.target.value)}>
            <option value="">{available.length ? "Select an influencer…" : "No more influencers to add"}</option>
            {available.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
                {i.instagramUsername ? ` (@${i.instagramUsername.replace(/^@/, "")})` : ""}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addInfluencer} disabled={!pickInfluencer || submitting}>
              {submitting ? "Adding…" : "Add influencer"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={doDelete}
        danger
        title="Delete campaign?"
        description={`This permanently deletes "${campaign.name}".`}
        confirmLabel="Delete"
      />
    </div>
  );
}