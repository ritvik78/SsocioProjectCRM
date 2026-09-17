"use client";

import * as React from "react";
import { Button, Input, Select, Textarea, Field } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { CopyToClipboard } from "@/components/ui/copy-button";
import { IG_OUTREACH_STATUSES } from "@/lib/constants";

export function InstagramOutreachForm({
  open,
  onClose,
  influencer,
  defaultAssignedToId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  influencer: { id: string; name: string; instagramUsername: string | null };
  defaultAssignedToId?: string;
  onCreated?: () => void;
}) {
  const { toast } = useToast();
  const username = influencer.instagramUsername?.replace(/^@/, "") ?? "";
  const today = new Date().toISOString().split("T")[0];

  const [message, setMessage] = React.useState(
    `Hi ${influencer.name.split(" ")[0] || "there"}! 👋\n\nWe loved your content and would love to collaborate with you for a campaign. Let's talk — we can share details on rates and deliverables.\n\nLooking forward to hearing from you!`
  );
  const [outreachDate, setOutreachDate] = React.useState(today);
  const [outreachType, setOutreachType] = React.useState("DM");
  const [followUpDate, setFollowUpDate] = React.useState("");
  const [status, setStatus] = React.useState("MESSAGE_SENT");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast({ title: "This influencer has no Instagram username", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/outreach/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencerId: influencer.id,
          instagramUsername: username,
          instagramUrl: `https://instagram.com/${username}`,
          outreachDate: outreachDate || today,
          message: message || undefined,
          outreachType,
          assignedToId: defaultAssignedToId || undefined,
          followUpDate: followUpDate || undefined,
          status,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record outreach");
      toast({ title: "Instagram outreach recorded", variant: "success" });
      onClose();
      onCreated?.();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Instagram outreach" description={`@${username}`} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between">
          <a
            href={`https://instagram.com/${username}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-pink-600 hover:underline"
          >
            Open @{username} in Instagram
          </a>
          <CopyToClipboard text={message} />
        </div>

        <Field label="Message">
          <Textarea rows={7} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Outreach date">
            <Input type="date" max={today} value={outreachDate} onChange={(e) => setOutreachDate(e.target.value)} />
          </Field>
          <Field label="Type">
            <Select value={outreachType} onChange={(e) => setOutreachType(e.target.value)}>
              {["DM", "COMMENT", "EMAIL", "PHONE", "OTHER"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {IG_OUTREACH_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Follow-up date">
            <Input type="date" min={today} value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
          </Field>
        </div>

        <Field label="Notes">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes about this outreach" />
        </Field>

        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Record outreach"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}