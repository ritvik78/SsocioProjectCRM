"use client";

import * as React from "react";
import { Button, Input, Select, Textarea, Field } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { CONTACT_TYPES } from "@/lib/constants";

export function FollowupForm({
  open,
  onClose,
  brandId,
  influencerId,
  entityName,
  members,
  defaultAssignedToId,
  onCreated,
  brands,
  influencers,
}: {
  open: boolean;
  onClose: () => void;
  brandId?: string;
  influencerId?: string;
  entityName: string;
  members: { id: string; name: string; email: string }[];
  defaultAssignedToId?: string;
  onCreated?: () => void;
  brands?: { id: string; name: string }[];
  influencers?: { id: string; name: string }[];
}) {
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const [contactType, setContactType] = React.useState("EMAIL");
  const [dueDate, setDueDate] = React.useState(today);
  const [priority, setPriority] = React.useState("MEDIUM");
  const [notes, setNotes] = React.useState("");
  const [assignedToId, setAssignedToId] = React.useState(defaultAssignedToId ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const [pickBrand, setPickBrand] = React.useState(brandId ?? "");
  const [pickInfluencer, setPickInfluencer] = React.useState(influencerId ?? "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const brand = brandId ?? pickBrand;
    const influencer = influencerId ?? pickInfluencer;
    if (!brand && !influencer) {
      toast({ title: "Link to a brand or influencer", variant: "error" });
      return;
    }
    if (!dueDate) {
      toast({ title: "Due date is required", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brand || undefined,
          influencerId: influencer || undefined,
          contactType,
          dueDate,
          priority,
          notes: notes || undefined,
          assignedToId: assignedToId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create follow-up");
      toast({ title: "Follow-up scheduled", description: `For ${entityName}`, variant: "success" });
      onClose();
      onCreated?.();
    } catch (err: any) {
      toast({ title: "Could not schedule", description: err.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Schedule follow-up" description={entityName}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand (optional)">
            <Select value={pickBrand} onChange={(e) => { setPickBrand(e.target.value); setPickInfluencer(""); }}>
              <option value="">—</option>
              {(brands ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Influencer (optional)">
            <Select value={pickInfluencer} onChange={(e) => { setPickInfluencer(e.target.value); setPickBrand(""); }}>
              <option value="">—</option>
              {(influencers ?? []).map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Contact type">
          <Select value={contactType} onChange={(e) => setContactType(e.target.value)}>
            {CONTACT_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Due date" required>
            <Input type="date" min={today} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Assign to">
          <Select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
            <option value="">Me</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notes">
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Waiting for pricing approval, call after lunch…"
          />
        </Field>
        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Schedule"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}