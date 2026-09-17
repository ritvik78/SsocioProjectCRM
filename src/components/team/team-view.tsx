"use client";

import * as React from "react";
import { RefreshCw, Pencil, Trash2, ShieldCheck, Mail, UserPlus, Ban, ShieldOff } from "lucide-react";

import { Button, Input, Select, Card, Spinner, EmptyState, Field } from "@/components/ui/primitives";
import { Table, THead, TBody, TH, TD, EmptyRow, Avatar, StatusBadge, ConfirmDialog } from "@/components/ui/data";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ROLES, ROLE_LABELS, PERMISSION_DEFS, ROLE_DEFAULT_PERMISSIONS } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  role: string;
  status: string;
  userPermissions: { permission: { key: string; name: string } }[];
  _count: { brandsOwned: number; influencersOwned: number; followupsAssigned: number };
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#22c55e",
  INVITED: "#3b82f6",
  DISABLED: "#ef4444",
};

const permissionGroups = Object.entries(
  PERMISSION_DEFS.reduce<Record<string, Array<(typeof PERMISSION_DEFS)[number]>>>((acc, p) => {
    (acc[p.group] ??= []).push(p);
    return acc;
  }, {})
);

export function TeamView({ user }: { user: SessionUser }) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<TeamMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TeamMember | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [removing, setRemoving] = React.useState<TeamMember | null>(null);
  const [removeLoading, setRemoveLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load team");
      let list = data.members ?? [];
      if (statusFilter) list = list.filter((m: TeamMember) => m.status === statusFilter);
      setRows(list);
    } catch (e: any) {
      setError(e.message ?? "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const submitInvite = async (values: { name: string; email: string; phone: string; designation: string; role: string; permissions: string[] }) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite");
      toast({ title: "Invitation sent", description: `An invite email was sent to ${values.email}.`, variant: "success" });
      setInviteOpen(false);
      load();
    } catch (e: any) {
      toast({ title: "Invite failed", description: e.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (values: { name: string; phone: string; designation: string; role: string; permissions: string[] }) => {
    if (!editing) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/team/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast({ title: "Member updated", variant: "success" });
      setEditing(null);
      load();
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (m: TeamMember) => {
    const next = m.status === "DISABLED" ? "ACTIVE" : "DISABLED";
    try {
      const res = await fetch(`/api/team/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: next === "ACTIVE" ? "Member enabled" : "Member disabled", variant: "success" });
      load();
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "error" });
    }
  };

  const doRemove = async () => {
    if (!removing) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(`/api/team/${removing.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove");
      toast({ title: "Member removed", variant: "success" });
      setRemoving(null);
      load();
    } catch (e: any) {
      toast({ title: "Remove failed", description: e.message, variant: "error" });
      setRemoving(null);
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Team</h1>
          <p className="text-sm text-zinc-500">Invite members and manage their access</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INVITED">Invited</option>
            <option value="DISABLED">Disabled</option>
          </Select>
          <Button variant="outline" onClick={load}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Invite member
          </Button>
        </div>
      </div>

      {error ? (
        <EmptyState icon={<ShieldCheck className="h-5 w-5" />} title="Could not load team" description={error} />
      ) : loading && rows.length === 0 ? (
        <Card className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Member</TH>
                <TH>Role</TH>
                <TH>Permissions</TH>
                <TH>Assigned</TH>
                <TH>Status</TH>
                <TH className="w-32 text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {rows.length === 0 ? (
                <EmptyRow colSpan={6} message="No members found." />
              ) : (
                rows.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.name} size="sm" color={m.role === "SUPER_ADMIN" ? "bg-amber-500" : "bg-indigo-500"} />
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {m.name}
                            {m.id === user.id && <span className="ml-1.5 text-xs font-normal text-zinc-400">(you)</span>}
                          </p>
                          <p className="text-xs text-zinc-400">{m.email}{m.designation ? ` · ${m.designation}` : ""}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <span className="text-sm text-zinc-700 dark:text-zinc-200">{ROLE_LABELS[m.role as keyof typeof ROLE_LABELS] ?? m.role}</span>
                    </TD>
                    <TD>
                      <span className="text-xs text-zinc-400">{m.userPermissions.length} assigned</span>
                    </TD>
                    <TD>
                      <div className="flex gap-3 text-xs text-zinc-400">
                        <span>{m._count.brandsOwned} brands</span>
                        <span>{m._count.influencersOwned} influencers</span>
                        <span>{m._count.followupsAssigned} follow-ups</span>
                      </div>
                    </TD>
                    <TD>
                      <StatusBadge label={m.status} color={STATUS_COLORS[m.status]} />
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditing(m)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        {m.role !== "SUPER_ADMIN" && m.id !== user.id && (
                          <>
                            <button onClick={() => toggleStatus(m)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800" title={m.status === "DISABLED" ? "Enable" : "Disable"}>
                              {m.status === "DISABLED" ? <ShieldOff className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                            </button>
                            <button onClick={() => setRemoving(m)} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" title="Remove">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </TD>
                  </tr>
                ))
              )}
            </TBody>
          </Table>
        </Card>
      )}

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite team member" description="A signup link will be emailed to them" size="lg">
        <InviteForm submitting={submitting} onSubmit={submitInvite} onCancel={() => setInviteOpen(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit member" description={editing?.email} size="lg">
        {editing && (
          <EditForm member={editing} submitting={submitting} onSubmit={submitEdit} onCancel={() => setEditing(null)} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={doRemove}
        danger
        loading={removeLoading}
        title={`Remove ${removing?.name}?`}
        description={`This permanently deletes ${removing?.name} (${removing?.email}) and removes their access.`}
        confirmLabel="Remove"
      />
    </div>
  );
}

function PermissionPicker({
  role,
  selected,
  onChange,
  disabled,
}: {
  role: string;
  selected: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (key: string) =>
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  const isAll = PERMISSION_DEFS.every((p) => selected.includes(p.key));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Permissions</p>
        {role !== "SUPER_ADMIN" && (
          <label className="flex items-center gap-1.5 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={isAll}
              disabled={disabled}
              onChange={() => onChange(isAll ? [] : PERMISSION_DEFS.map((p) => p.key))}
            />
            Select all
          </label>
        )}
      </div>
      {role === "SUPER_ADMIN" ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Super Admins automatically have every permission.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {permissionGroups.map(([group, items]) => (
            <fieldset key={group} className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
              <legend className="px-1 text-xs font-semibold text-zinc-500">{group}</legend>
              <div className="space-y-1.5">
                {items.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.key)}
                      disabled={disabled}
                      onChange={() => toggle(p.key)}
                      className="h-3.5 w-3.5 accent-indigo-600"
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
}

function RoleSelect({ role, onChange, disabled }: { role: string; onChange: (r: string) => void; disabled?: boolean }) {
  return (
    <Select value={role} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      {ROLES.map((r) => (
        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
      ))}
    </Select>
  );
}

function InviteForm({
  submitting,
  onSubmit,
  onCancel,
}: {
  submitting: boolean;
  onSubmit: (values: { name: string; email: string; phone: string; designation: string; role: string; permissions: string[] }) => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [designation, setDesignation] = React.useState("");
  const [role, setRole] = React.useState("MANAGER");
  const [permissions, setPermissions] = React.useState<string[]>([...ROLE_DEFAULT_PERMISSIONS.MANAGER]);

  const onRoleChange = (r: string) => {
    setRole(r);
    if (r === "SUPER_ADMIN") setPermissions([]);
    else setPermissions([...(ROLE_DEFAULT_PERMISSIONS[r as keyof typeof ROLE_DEFAULT_PERMISSIONS] ?? [])]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({ title: "Name and email are required", variant: "error" });
      return;
    }
    if (role !== "SUPER_ADMIN" && permissions.length === 0) {
      toast({ title: "Select at least one permission", variant: "error" });
      return;
    }
    onSubmit({ name: name.trim(), email: email.trim(), phone, designation, role, permissions });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
        </Field>
        <Field label="Work email" required>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" className="pl-9" />
          </div>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Designation">
          <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Social Media Manager" />
        </Field>
      </div>
      <Field label="Role" required>
        <RoleSelect role={role} onChange={onRoleChange} />
        <p className="mt-1 text-xs text-zinc-400">Choosing a role pre-selects its default permissions — adjust below.</p>
      </Field>
      <PermissionPicker role={role} selected={permissions} onChange={setPermissions} />
      <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Sending invite…" : "Invite member"}</Button>
      </div>
    </form>
  );
}

function EditForm({
  member,
  submitting,
  onSubmit,
  onCancel,
}: {
  member: TeamMember;
  submitting: boolean;
  onSubmit: (values: { name: string; phone: string; designation: string; role: string; permissions: string[] }) => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const isSuperAdmin = member.role === "SUPER_ADMIN";
  const [name, setName] = React.useState(member.name);
  const [phone, setPhone] = React.useState(member.phone ?? "");
  const [designation, setDesignation] = React.useState(member.designation ?? "");
  const [role, setRole] = React.useState(member.role);
  const [permissions, setPermissions] = React.useState<string[]>(member.userPermissions.map((u) => u.permission.key));

  const onRoleChange = (r: string) => {
    setRole(r);
    if (r === "SUPER_ADMIN") setPermissions([]);
    else setPermissions((prev) => [...ROLE_DEFAULT_PERMISSIONS[r as keyof typeof ROLE_DEFAULT_PERMISSIONS] ?? prev]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "error" });
      return;
    }
    onSubmit({ name: name.trim(), phone, designation, role, permissions });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Designation">
          <Input value={designation} onChange={(e) => setDesignation(e.target.value)} />
        </Field>
      </div>
      <Field label="Phone">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label="Role">
        <RoleSelect role={role} onChange={onRoleChange} disabled={isSuperAdmin} />
      </Field>
      <PermissionPicker role={role} selected={permissions} onChange={setPermissions} disabled={isSuperAdmin} />
      <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save changes"}</Button>
      </div>
    </form>
  );
}