"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/overlay";
import { Button, Field, Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { EMAIL_CATEGORIES } from "@/lib/constants";
import { substituteVariables } from "@/lib/email/substitute";

type Draft = {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
};

export function QuickEmail({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();

  const [recipient, setRecipient] = React.useState("");
  const [templateId, setTemplateId] = React.useState("");
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [entity, setEntity] = React.useState("");
  const [entityType, setEntityType] = React.useState<"brand" | "influencer">("brand");

  React.useEffect(() => {
    if (!open) return;

    async function init() {
      try {
        const res = await fetch("/api/email/templates?active=1");
        if (res.ok) {
          const data = await res.json();
          setDrafts(data.templates ?? []);
        }
      } finally {
        setRecipient("");
        setSubject("");
        setBody("");
        setTemplateId("");
      }
    }

    void init();
  }, [open]);

  function onTemplateChange(tplId: string) {
    setTemplateId(tplId);
    const tpl = drafts.find((d) => d.id === tplId);
    if (tpl) {
      setSubject(substituteVariables(tpl.subject, {
        sender_name: "Ssocio Pro",
        company_name: "Ssocio Pro",
        brand_name: "",
        contact_name: "",
        influencer_name: "",
        campaign_name: "",
      }));
      setBody(substituteVariables(tpl.body, {
        sender_name: "Ssocio Pro",
        company_name: "Ssocio Pro",
        brand_name: "",
        contact_name: "",
        influencer_name: "",
        campaign_name: "",
      }));
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient || !subject || !body) {
      toast({ title: "Missing fields", description: "Recipient, subject and body are required.", variant: "warning" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient,
          subject,
          body,
          templateId: templateId || null,
          newBrandName: entityType === "brand" && entity.trim() ? entity.trim() : null,
          newInfluencerName: entityType === "influencer" && entity.trim() ? entity.trim() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Sending failed", description: data.error || "Something went wrong", variant: "error" });
        return;
      }
      toast({ title: "Email sent", description: `To ${recipient}`, variant: "success" });
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Quick Email" description="Send an email to anyone — the recipient does not need to exist in the CRM." size="lg">
      <form onSubmit={handleSend} className="space-y-4">
        <Field label="Recipient email" required>
          <Input
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="someone@example.com"
            required
          />
        </Field>

        <Field label="Use a draft (optional)">
          <Select value={templateId} onChange={(e) => onTemplateChange(e.target.value)}>
            <option value="">— Start blank or pick a draft —</option>
            {EMAIL_CATEGORIES.map((cat) => (
              <optgroup key={cat.value} label={cat.label}>
                {drafts.filter((d) => d.category === cat.value).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>

        <Field label="Subject" required>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" required />
        </Field>

        <Field label="Body" required>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="Write your email body…"
            className="font-mono text-xs"
            required
          />
        </Field>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Label>Add to CRM after sending (optional)</Label>
          <div className="flex gap-2">
            <Select value={entityType} onChange={(e) => setEntityType(e.target.value as "brand" | "influencer")}>
              <option value="brand">New brand lead</option>
              <option value="influencer">New influencer</option>
            </Select>
            <Input value={entity} onChange={(e) => setEntity(e.target.value)} placeholder={entityType === "brand" ? "Brand name" : "Influencer name"} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Send Email
          </Button>
        </div>
      </form>
    </Modal>
  );
}