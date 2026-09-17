"use client";

import * as React from "react";
import { Button, Input, Textarea, Select, Field, Spinner } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/data";

export type EmailTemplateOption = {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: string;
};

function interpolate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_m, key) => vars[key] ?? `{{${key}}}`);
}

export function QuickSendEmail({
  open,
  onClose,
  recipient,
  brandId,
  influencerId,
  brandName,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  recipient?: string | null;
  brandId?: string;
  influencerId?: string;
  brandName?: string | null;
  onSent?: () => void;
}) {
  const { toast } = useToast();
  const [templates, setTemplates] = React.useState<EmailTemplateOption[]>([]);
  const [templateId, setTemplateId] = React.useState("");
  const [to, setTo] = React.useState(recipient ?? "");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [createFollowUp, setCreateFollowUp] = React.useState(false);
  const [followUpDate, setFollowUpDate] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const handleClose = () => {
    setTemplateId("");
    setSubject("");
    setBody("");
    setCreateFollowUp(false);
    setFollowUpDate("");
    setSending(false);
    onClose();
  };

  React.useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      const res = await fetch("/api/email/templates?active=1");
      const data = await res.json();
      if (!active) return;
      setTemplates(res.ok ? data.templates ?? [] : []);
      setTo(recipient ?? "");
    })();
    return () => {
      active = false;
    };
  }, [open, recipient]);

  const applyTemplate = (tid: string) => {
    setTemplateId(tid);
    const t = templates.find((x) => x.id === tid);
    if (!t) return;
    const vars: Record<string, string> = {
      brand_name: brandName ?? "",
      company_name: brandName ?? "",
      contact_name: "",
      sender_name: "",
      sender_email: "",
    };
    setSubject(interpolate(t.subject, vars));
    setBody(interpolate(t.body, vars));
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
          brandId,
          influencerId,
          createFollowUp: createFollowUp || undefined,
          followUpDate: createFollowUp && followUpDate ? followUpDate : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      toast({ title: "Email sent", description: `To ${to.trim()}`, variant: "success" });
      handleClose();
      onSent?.();
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "error" });
    } finally {
      setSending(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Modal open={open} onClose={handleClose} title="Send email" description={`To ${recipient || "—"}`} size="lg">
      <form onSubmit={send} className="space-y-4">
        {templates.length > 0 && (
          <Field label="Use a draft template">
            <Select value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">Custom message</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
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
          <Textarea rows={9} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message using {{variables}} like {{brand_name}}" />
        </Field>
        <div className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Create follow-up</p>
              <p className="text-xs text-zinc-400">Schedule a follow-up when a reply doesn&apos;t come</p>
            </div>
            <Switch checked={createFollowUp} onChange={setCreateFollowUp} />
          </div>
          {createFollowUp && (
            <Field label="Follow-up date">
              <Input type="date" min={today} value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
            </Field>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={sending}>
            {sending ? <><Spinner className="h-4 w-4" /> Sending…</> : "Send email"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}