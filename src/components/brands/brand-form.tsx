"use client";

import * as React from "react";
import { Button, Input, Textarea, Select, Field } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

export type BrandStatus = { id: string; name: string; color: string | null };
export type TeamMember = { id: string; name: string; email: string };
export type BrandFormValues = {
  name: string;
  companyName?: string | null;
  contactName?: string | null;
  designation?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  instagramHandle?: string | null;
  linkedin?: string | null;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  source?: string | null;
  statusId: string;
  priority: string;
  notes?: string | null;
  leadOwnerId?: string | null;
  budget?: string | null;
  description?: string | null;
  productsServices?: string | null;
  collaborationType?: string | null;
  expectedCampaignType?: string | null;
  businessCategory?: string | null;
  location?: string | null;
  gstNumber?: string | null;
  campaignStatus?: string | null;
};

export function BrandForm({
  statuses,
  members,
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  statuses: BrandStatus[];
  members: TeamMember[];
  initial?: BrandFormValues;
  submitting: boolean;
  onSubmit: (values: BrandFormValues) => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [values, setValues] = React.useState<BrandFormValues>(
    initial ?? {
      name: "",
      companyName: "",
      contactName: "",
      designation: "",
      email: "",
      phone: "",
      website: "",
      instagramHandle: "",
      linkedin: "",
      industry: "",
      city: "",
      state: "",
      source: "",
      statusId: statuses[0]?.id ?? "",
      priority: "MEDIUM",
      notes: "",
      leadOwnerId: members[0]?.id ?? null,
      budget: "",
      description: "",
      productsServices: "",
      collaborationType: "",
      expectedCampaignType: "",
      businessCategory: "",
      location: "",
      gstNumber: "",
      campaignStatus: "",
    }
  );

  const set = (key: keyof BrandFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value === "" ? "" : e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      toast({ title: "Brand name is required", variant: "error" });
      return;
    }
    if (!values.statusId) {
      toast({ title: "Status is required", variant: "error" });
      return;
    }
    onSubmit(values);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Brand name" required>
        <Input value={values.name} onChange={set("name")} placeholder="e.g. Nykaa" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name">
          <Input value={values.companyName ?? ""} onChange={set("companyName")} placeholder="Legal / parent company" />
        </Field>
        <Field label="Industry">
          <Input value={values.industry ?? ""} onChange={set("industry")} placeholder="e.g. Beauty" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact name">
          <Input value={values.contactName ?? ""} onChange={set("contactName")} placeholder="Decision maker" />
        </Field>
        <Field label="Designation">
          <Input value={values.designation ?? ""} onChange={set("designation")} placeholder="e.g. Marketing Head" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <Input type="email" value={values.email ?? ""} onChange={set("email")} placeholder="name@company.com" />
        </Field>
        <Field label="Phone">
          <Input value={values.phone ?? ""} onChange={set("phone")} placeholder="+91 …" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Website">
          <Input value={values.website ?? ""} onChange={set("website")} placeholder="https://" />
        </Field>
        <Field label="Instagram handle">
          <Input value={values.instagramHandle ?? ""} onChange={set("instagramHandle")} placeholder="@brand" />
        </Field>
        <Field label="LinkedIn">
          <Input value={values.linkedin ?? ""} onChange={set("linkedin")} placeholder="linkedin.com/in/…" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City">
          <Input value={values.city ?? ""} onChange={set("city")} />
        </Field>
        <Field label="State">
          <Input value={values.state ?? ""} onChange={set("state")} />
        </Field>
        <Field label="Source">
          <Input value={values.source ?? ""} onChange={set("source")} placeholder="Referral, Instagram, Event…" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Status" required>
          <Select value={values.statusId} onChange={set("statusId")}>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={values.priority} onChange={set("priority")}>
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Lead owner">
          <Select value={values.leadOwnerId ?? ""} onChange={set("leadOwnerId")}>
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
        <summary className="cursor-pointer text-sm font-medium text-zinc-600 dark:text-zinc-300">Campaign & business details</summary>
        <div className="mt-3 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Campaign status">
              <Select value={values.campaignStatus ?? ""} onChange={set("campaignStatus")}>
                <option value="">—</option>
                {["UPCOMING", "ACTIVE", "COMPLETED", "PAUSED", "ON HOLD", "NOT STARTED", "PLANNING"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Business category">
              <Input value={values.businessCategory ?? ""} onChange={set("businessCategory")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location">
              <Input value={values.location ?? ""} onChange={set("location")} />
            </Field>
            <Field label="GST number">
              <Input value={values.gstNumber ?? ""} onChange={set("gstNumber")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Budget">
              <Input value={values.budget ?? ""} onChange={set("budget")} placeholder="e.g. ₹2,00,000 - ₹5,00,000" />
            </Field>
            <Field label="Collaboration type">
              <Input value={values.collaborationType ?? ""} onChange={set("collaborationType")} placeholder="e.g. Hybrid, Paid…" />
            </Field>
          </div>
          <Field label="Expected campaign type">
            <Input value={values.expectedCampaignType ?? ""} onChange={set("expectedCampaignType")} placeholder="e.g. Product launch, Reels…" />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={values.description ?? ""} onChange={set("description")} />
          </Field>
          <Field label="Products / services">
            <Textarea rows={2} value={values.productsServices ?? ""} onChange={set("productsServices")} />
          </Field>
        </div>
      </details>

      <Field label="Notes">
        <Textarea rows={3} value={values.notes ?? ""} onChange={set("notes")} placeholder="Internal notes about this brand" />
      </Field>

      <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Create brand"}
        </Button>
      </div>
    </form>
  );
}