"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function CopyToClipboard({ text, label = "Copy message" }: { text: string; label?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setCopied(true);
        toast({ title: "Copied to clipboard", variant: "success" });
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-300 px-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}