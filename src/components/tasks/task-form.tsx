"use client";

import * as React from "react";
import { Label, Input, Select, Textarea, Button } from "@/components/ui/primitives";

export type TaskFormValues = {
  title: string;
  dueDate: string;
  priority: string;
  notes?: string | null;
};

export function TaskForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<TaskFormValues>;
  submitting?: boolean;
  onSubmit: (values: TaskFormValues) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [dueDate, setDueDate] = React.useState(initial?.dueDate ?? new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = React.useState(initial?.priority ?? "MEDIUM");
  const [notes, setNotes] = React.useState(initial?.notes ?? "");

  const valid = title.trim().length > 0 && dueDate.trim().length > 0;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid || submitting) return;
        onSubmit({ title: title.trim(), dueDate, priority, notes: notes.trim() || null });
      }}
    >
      <div>
        <Label htmlFor="task-title">Task title</Label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Follow up with Nykaa"
          autoFocus
        />
      </div>

      <div>
        <Label htmlFor="task-date">Due date</Label>
        <Input
          id="task-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="task-priority">Priority</Label>
        <Select id="task-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
          {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="task-notes">Notes</Label>
        <Textarea
          id="task-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional details…"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid} loading={submitting}>
          {initial?.title ? "Save changes" : "Add task"}
        </Button>
      </div>
    </form>
  );
}