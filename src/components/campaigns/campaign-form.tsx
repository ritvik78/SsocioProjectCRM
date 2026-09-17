"use client";

import * as React from "react";
import { Button, Input, Select, Textarea, Field } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { CAMPAIGN_STATUSES } from "@/lib/constants";

export type CampaignFormValues = {
  name: string;
  brandId: string;
  status: string;
  description?: string | null;
  objective?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budget?: string | null;
  cashbackIncentive?: string | null;
  targetInfluencers?: number | null;
  requiredContent?: string | null;
  instagramRequirements?: string | null;
  hashtags?: string | null;
  mentions?: string | null;
  termsConditions?: string | null;
};

export function CampaignForm({
  brands,
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  brands: { id: string; name: string }[];
  initial?: CampaignFormValues;
  submitting: boolean;
  onSubmit: (values: CampaignFormValues) => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [values, setValues] = React.useState<CampaignFormValues>(
    initial ?? {
      name: "",
      brandId: "",
      status: "DRAFT",
      description: "",
      objective: "",
      startDate: "",
      endDate: "",
      budget: "",
      cashbackIncentive: "",
      targetInfluencers: null,
      requiredContent: "",
      instagramRequirements: "",
      hashtags: "",
      mentions: "",
      termsConditions: "",
    }
  );

  const set = (key: keyof CampaignFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setValues((v) => ({ ...v, [key]: e.target.value === "" ? "" : e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      toast({ title: "Campaign name is required", variant: "error" });
      return;
    }
    if (!values.brandId) {
      toast({ title: "Select a brand", variant: "error" });
      return;
    }
    onSubmit(values);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Campaign name" required>
          <Input value={values.name} onChange={set("name")} placeholder="e.g. Nykaa Festival Reels" />
        </Field>
        <Field label="Brand" required>
          <Select value={values.brandId} onChange={set("brandId")}>
            <option value="">Select a brand…</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Status">
          <Select value={values.status} onChange={set("status")}>
            {CAMPAIGN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Start date">
          <Input type="date" min={today} value={values.startDate ?? ""} onChange={set("startDate")} />
        </Field>
        <Field label="End date">
          <Input type="date" min={today} value={values.endDate ?? ""} onChange={set("endDate")} />
        </Field>
      </div>

      <Field label="Objective">
        <Textarea rows={2} value={values.objective ?? ""} onChange={set("objective")} placeholder="What does this campaign want to achieve?" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Budget">
          <Input value={values.budget ?? ""} onChange={set("budget")} placeholder="e.g. ₹1,00,000" />
        </Field>
        <Field label="Cashback incentive">
          <Input value={values.cashbackIncentive ?? ""} onChange={set("cashbackIncentive")} placeholder="e.g. 5% of sales" />
        </Field>
        <Field label="Target influencers">
          <Input type="number" min={1} value={values.targetInfluencers ?? ""} onChange={(e) => setValues((v) => ({ ...v, targetInfluencers: e.target.value === "" ? null : Number(e.target.value) }))} placeholder="e.g. 20" />
        </Field>
      </div>

      <Field label="Required content">
        <Textarea rows={2} value={values.requiredContent ?? ""} onChange={set("requiredContent")} placeholder="Number of reels, stories, posts required…" />
      </Field>
      <Field label="Instagram requirements">
        <Textarea rows={2} value={values.instagramRequirements ?? ""} onChange={set("instagramRequirements")} placeholder="Reel length, captions, product mentions, must-tags…" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hashtags">
          <Input value={values.hashtags ?? ""} onChange={set("hashtags")} placeholder="#nykaa #festival2026" />
        </Field>
        <Field label="Mentions">
          <Input value={values.mentions ?? ""} onChange={set("mentions")} placeholder="@brandhandle" />
        </Field>
      </div>

      <Field label="Terms & conditions">
        <Textarea rows={3} value={values.termsConditions ?? ""} onChange={set("termsConditions")} placeholder="Usage rights, exclusivity, payment terms…" />
      </Field>

      <Field label="Description">
        <Textarea rows={2} value={values.description ?? ""} onChange={set("description")} />
      </Field>

      <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Create campaign"}
        </Button>
      </div>
    </form>
  );
}