"use client";

import * as React from "react";
import { Button, Input, Textarea, Select, Field } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { INFLUENCER_CATEGORIES, LEAD_SOURCES } from "@/lib/constants";

export type InfluencerStatus = { id: string; name: string; color: string | null };
export type InfluencerFormValues = {
  name: string;
  instagramUsername?: string | null;
  instagramUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  category?: string | null;
  followers?: number | null;
  engagementRate?: number | null;
  platform?: string;
  audienceLocation?: string | null;
  source?: string | null;
  statusId: string;
  notes?: string | null;
  assignedToId?: string | null;
  contentType?: string | null;
  preferredCollaboration?: string | null;
  audienceDemographics?: string | null;
  portfolio?: string | null;
};

export function InfluencerForm({
  statuses,
  members,
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  statuses: InfluencerStatus[];
  members: { id: string; name: string; email: string }[];
  initial?: InfluencerFormValues;
  submitting: boolean;
  onSubmit: (values: InfluencerFormValues) => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [values, setValues] = React.useState<InfluencerFormValues>(
    initial ?? {
      name: "",
      instagramUsername: "",
      instagramUrl: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      category: "",
      followers: null,
      engagementRate: null,
      platform: "INSTAGRAM",
      audienceLocation: "",
      source: "",
      statusId: statuses[0]?.id ?? "",
      notes: "",
      assignedToId: members[0]?.id ?? null,
      contentType: "",
      preferredCollaboration: "",
      audienceDemographics: "",
      portfolio: "",
    }
  );

  const set = (key: keyof InfluencerFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setValues((v) => ({ ...v, [key]: e.target.value === "" ? "" : e.target.value }));

  const setNum = (key: "followers" | "engagementRate") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? null : Number(e.target.value);
    setValues((v) => ({ ...v, [key]: Number.isFinite(val) ? val : null }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      toast({ title: "Influencer name is required", variant: "error" });
      return;
    }
    if (!values.statusId) {
      toast({ title: "Status is required", variant: "error" });
      return;
    }
    onSubmit({ ...values, instagramUsername: values.instagramUsername?.trim() || null, email: values.email?.trim() || null });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Influencer name" required>
        <Input value={values.name} onChange={set("name")} placeholder="e.g. Ananya Sharma" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Instagram username">
          <Input value={values.instagramUsername ?? ""} onChange={set("instagramUsername")} placeholder="@username" />
        </Field>
        <Field label="Instagram profile URL">
          <Input value={values.instagramUrl ?? ""} onChange={set("instagramUrl")} placeholder="https://instagram.com/…" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Category">
          <Select value={values.category ?? ""} onChange={set("category")}>
            <option value="">—</option>
            {INFLUENCER_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Platform">
          <Select value={values.platform} onChange={set("platform")}>
            {["INSTAGRAM", "YOUTUBE", "TIKTOK", "OTHER"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Source">
          <Select value={values.source ?? ""} onChange={set("source")}>
            <option value="">—</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Followers">
          <Input type="number" min={0} value={values.followers ?? ""} onChange={setNum("followers")} placeholder="e.g. 150000" />
        </Field>
        <Field label="Engagement rate (%)">
          <Input type="number" min={0} step="0.1" value={values.engagementRate ?? ""} onChange={setNum("engagementRate")} placeholder="e.g. 4.5" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <Input type="email" value={values.email ?? ""} onChange={set("email")} placeholder="name@example.com" />
        </Field>
        <Field label="Phone">
          <Input value={values.phone ?? ""} onChange={set("phone")} placeholder="+91 …" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City">
          <Input value={values.city ?? ""} onChange={set("city")} />
        </Field>
        <Field label="State">
          <Input value={values.state ?? ""} onChange={set("state")} />
        </Field>
        <Field label="Audience location">
          <Input value={values.audienceLocation ?? ""} onChange={set("audienceLocation")} placeholder="e.g. India" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status" required>
          <Select value={values.statusId} onChange={set("statusId")}>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Assigned to">
          <Select value={values.assignedToId ?? ""} onChange={set("assignedToId")}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <details className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <summary className="cursor-pointer text-sm font-medium text-zinc-600 dark:text-zinc-300">Content & collaboration</summary>
        <div className="mt-3 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Content type">
              <Input value={values.contentType ?? ""} onChange={set("contentType")} placeholder="Reels, Stories, Static posts…" />
            </Field>
            <Field label="Preferred collaboration">
              <Input value={values.preferredCollaboration ?? ""} onChange={set("preferredCollaboration")} placeholder="Paid, Gifted, Long-term…" />
            </Field>
          </div>
          <Field label="Audience demographics">
            <Input value={values.audienceDemographics ?? ""} onChange={set("audienceDemographics")} placeholder="e.g. 70% female, 18-30" />
          </Field>
          <Field label="Portfolio / media kit link">
            <Input value={values.portfolio ?? ""} onChange={set("portfolio")} placeholder="https://" />
          </Field>
        </div>
      </details>

      <Field label="Notes">
        <Textarea rows={3} value={values.notes ?? ""} onChange={set("notes")} placeholder="Internal notes about this influencer" />
      </Field>

      <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Add influencer"}
        </Button>
      </div>
    </form>
  );
}