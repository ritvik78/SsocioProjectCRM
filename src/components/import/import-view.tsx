"use client";

import * as React from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload, Download, FileUp, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import { Button, Card, CardContent, Textarea } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/data";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Tab = "brand" | "influencer";

const BRAND_HEADERS = ["name", "company_name", "contact_name", "designation", "email", "phone", "website", "instagram_handle", "industry", "city", "state", "source", "status", "notes"];
const INFLUENCER_HEADERS = ["name", "instagram_username", "email", "phone", "category", "followers", "engagement_rate", "platform", "city", "state", "source", "status", "notes"];

const TEMPLATES: Record<Tab, string> = {
  brand: BRAND_HEADERS.join(",") + "\n" + [
    "Acme Beauty",
    "Acme Beauty Pvt Ltd",
    "Riya Sharma",
    "Marketing Head",
    "riyasharma@acmebeauty.com",
    "+91 98765 43210",
    "https://acmebeauty.com",
    "acmebeauty",
    "Beauty & Cosmetics",
    "Mumbai",
    "Maharashtra",
    "LinkedIn",
    "NEW LEAD",
    "",
  ].join(","),
  influencer: INFLUENCER_HEADERS.join(",") + "\n" + [
    "Priya Anand",
    "priyaanand",
    "priya.anand@gmail.com",
    "+91 91234 56789",
    "Fashion",
    "125000",
    "4.2",
    "INSTAGRAM",
    "Delhi",
    "Delhi",
    "Instagram Search",
    "NEW",
    "",
  ].join(","),
};

type PreviewRow = Record<string, string>;

export function ImportView() {
  const { toast } = useToast();
  const [tab, setTab] = React.useState<Tab>("brand");
  const [csv, setCsv] = React.useState("");
  const [preview, setPreview] = React.useState<PreviewRow[]>([]);
  const [fileHeaders, setFileHeaders] = React.useState<string[]>([]);
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<{ created: number; errors: string[] } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const headers = tab === "brand" ? BRAND_HEADERS : INFLUENCER_HEADERS;
  const previewHeaders = fileHeaders.length > 0 ? fileHeaders : headers;

  const updatePreview = (raw: string) => {
    setCsv(raw);
    setResult(null);
    if (!raw.trim()) {
      setPreview([]);
      setFileHeaders([]);
      return;
    }
    const parsed = Papa.parse<PreviewRow>(raw, { header: true, skipEmptyLines: true });
    const detected = (parsed.meta.fields ?? []).map((f) => f?.trim() ?? "").filter(Boolean);
    setFileHeaders(detected);
    setPreview(parsed.data.slice(0, 5));
  };

  const onFile = async (file: File) => {
    const name = file.name.toLowerCase();
    const isCsv = name.endsWith(".csv") || file.type === "text/csv";
    if (isCsv) {
      updatePreview(await file.text());
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("The Excel file has no readable sheet");
      updatePreview(XLSX.utils.sheet_to_csv(ws));
      toast({ title: `${file.name} read`, description: "Column names detected from the first row.", variant: "success" });
    } catch (e: any) {
      toast({ title: "Could not read Excel file", description: e.message ?? "Unsupported file", variant: "error" });
    }
  };

  const setTemplate = () => {
    updatePreview(TEMPLATES[tab]);
    toast({ title: "Template loaded", description: `Paste your ${tab} rows below the header row.`, variant: "success" });
  };

  const downloadExport = (type: Tab) => {
    window.open(`/api/export?type=${type}`, "_blank");
  };

  const doImport = async () => {
    if (!csv.trim()) {
      toast({ title: "Paste (or load) your CSV first", variant: "error" });
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const res = await fetch(`/api/import?type=${tab}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult({ created: data.created ?? 0, errors: data.errors ?? [] });
      toast({ title: `Imported ${data.created ?? 0} ${tab}s`, variant: "success" });
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "error" });
    } finally {
      setImporting(false);
    }
  };

  const missingHeaders = headers.filter((h) => !Papa.parse<Record<string, string>>(csv, { header: true }).meta.fields?.includes(h));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Import / Export</h1>
          <p className="text-sm text-zinc-500">Bulk-create brands or influencers from a CSV file</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => downloadExport(tab)}>
            <Download className="h-4 w-4" /> Export {tab}s
          </Button>
        </div>
      </div>

      <Card>
        <Tabs
          tabs={[
            { value: "brand" as Tab, label: "Brands" },
            { value: "influencer" as Tab, label: "Influencers" },
          ]}
          value={tab}
          onChange={(t) => {
            setTab(t);
            setCsv("");
            setPreview([]);
            setFileHeaders([]);
            setResult(null);
          }}
        />
        <CardContent className="p-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) onFile(f);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                  dragOver ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40" : "border-zinc-200 dark:border-zinc-700"
                )}
              >
                <FileUp className="h-8 w-8 text-zinc-300" />
                <p className="text-sm text-zinc-500">Drag & drop your Excel (.xlsx) or CSV file here, or</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" /> Choose file
                  </Button>
                  <Button variant="secondary" size="sm" onClick={setTemplate}>
                    Load template
                  </Button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                    e.currentTarget.value = "";
                  }}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
<p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">File content</p>
                {missingHeaders.length > 0 && (
                  <p className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" /> Missing: {missingHeaders.join(", ")}
                  </p>
                )}
                {fileHeaders.length > 0 && (
                  <p className="text-xs text-zinc-500">
                    Detected {preview.length > 0 ? "columns" : "columns"}: {fileHeaders.join(", ")}
                  </p>
                )}
                </div>
                <Textarea
                  rows={8}
                  value={csv}
                  onChange={(e) => updatePreview(e.target.value)}
                  placeholder="Paste comma-separated values with a header row…"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Preview (first 5 rows)</p>
              {preview.length === 0 ? (
                <div className="flex h-52 items-center justify-center rounded-xl border border-zinc-100 text-sm text-zinc-400 dark:border-zinc-800">
                  Nothing to preview yet.
                </div>
              ) : (
                <div className="overflow-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/60">
                      <tr>
                        {previewHeaders.map((h) => (
                          <th key={h} className="whitespace-nowrap px-2 py-1.5 font-medium text-zinc-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                          {previewHeaders.map((h) => (
                            <td key={h} className="max-w-[180px] truncate whitespace-nowrap px-2 py-1.5 text-zinc-700 dark:text-zinc-200">{row[h] ?? ""}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {result && (
                <div className={cn(
                  "rounded-xl border p-3 text-sm",
                  result.errors.length > 0 ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30" : "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                )}>
                  <p className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-100">
                    <CheckCircle2 className={cn("h-4 w-4", result.errors.length > 0 ? "text-amber-500" : "text-emerald-500")} />
                    {result.created} {tab}s imported
                  </p>
                  {result.errors.length > 0 && (
                    <p className="mt-1 max-h-28 overflow-y-auto text-xs text-zinc-500">{result.errors.slice(0, 20).join(" · ")}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex justify-end border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <Button onClick={doImport} disabled={importing || !csv.trim()}>
              {importing ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</> : <><Upload className="h-4 w-4" /> Import {tab}s</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}