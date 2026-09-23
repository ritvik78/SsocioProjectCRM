import "server-only";

import prisma from "@/lib/db";
import { ApiError } from "@/lib/auth";
import { createAuditLog } from "@/lib/track";
import { differenceInCalendarDays } from "date-fns";
import type { TaskInput } from "@/lib/validation";

/**
 * Roll uncompleted tasks whose due day has passed forward onto today.
 * They stay PENDING and keep track of the original day plus how many
 * times they were pushed ahead.
 */
export async function rolloverTasks(userId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const overdue = await prisma.task.findMany({
    where: { createdById: userId, status: "PENDING", dueDate: { lt: todayStart } },
    select: { id: true, dueDate: true, originalDueDate: true, shiftedCount: true },
  });
  if (overdue.length === 0) return 0;

  await prisma.$transaction(
    overdue.map((task) =>
      prisma.task.update({
        where: { id: task.id },
        data: {
          dueDate: todayStart,
          shiftedCount: task.shiftedCount + differenceInCalendarDays(todayStart, task.dueDate),
          originalDueDate: task.originalDueDate ?? task.dueDate,
        },
      })
    )
  );
  return overdue.length;
}

export type TaskRange = {
  from?: Date;
  to?: Date;
  includeCompleted?: boolean;
  status?: string;
  q?: string;
  priority?: string;
};

export async function listTasksForUser(userId: string, range: TaskRange = {}) {
  await rolloverTasks(userId);

  const where: any = { createdById: userId };
  if (range.status) where.status = range.status;
  else if (!range.includeCompleted) where.status = "PENDING";
  if (range.q) where.title = { contains: range.q, mode: "insensitive" };
  if (range.priority) where.priority = range.priority;
  if (range.from || range.to) {
    where.dueDate = {};
    if (range.from) where.dueDate.gte = range.from;
    if (range.to) where.dueDate.lte = range.to;
  }

  return prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });
}

export async function createTask(input: TaskInput, actor: { id: string }) {
  if (!input.dueDate || isNaN(new Date(input.dueDate).getTime())) {
    throw new ApiError(422, "A valid task date is required");
  }
  const dueDate = new Date(`${input.dueDate}T12:00:00.000Z`);

  const task = await prisma.task.create({
    data: {
      title: input.title,
      dueDate,
      status: "PENDING",
      priority: input.priority,
      notes: input.notes,
      createdById: actor.id,
      originalDueDate: dueDate,
    },
  });

  await createAuditLog({
    userId: actor.id,
    action: "CREATE",
    recordType: "Task",
    recordId: task.id,
    newValue: { title: input.title, dueDate: dueDate.toISOString() },
  });
  return task;
}

export async function completeTask(id: string, actor: { id: string }) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.createdById !== actor.id) throw new ApiError(404, "Task not found");

  const updated = await prisma.task.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date(), completedById: actor.id },
  });

  await createAuditLog({
    userId: actor.id,
    action: "UPDATE",
    recordType: "Task",
    recordId: id,
    previousValue: { status: existing.status },
    newValue: { status: "COMPLETED" },
  });
  return updated;
}

export async function updateTask(id: string, input: Partial<TaskInput>, actor: { id: string }) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.createdById !== actor.id) throw new ApiError(404, "Task not found");

  let dueDate: Date | undefined;
  if (input.dueDate) {
    if (isNaN(new Date(input.dueDate).getTime())) throw new ApiError(422, "A valid task date is required");
    dueDate = new Date(`${input.dueDate}T12:00:00.000Z`);
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      title: input.title ?? undefined,
      dueDate,
      priority: input.priority ?? undefined,
      notes: input.notes ?? undefined,
      originalDueDate: existing.originalDueDate ?? dueDate ?? undefined,
    },
  });

  await createAuditLog({
    userId: actor.id,
    action: "UPDATE",
    recordType: "Task",
    recordId: id,
    previousValue: { title: existing.title, dueDate: existing.dueDate.toISOString() },
    newValue: { title: updated.title, dueDate: updated.dueDate.toISOString() },
  });
  return updated;
}

export async function deleteTask(id: string, actor: { id: string }) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.createdById !== actor.id) throw new ApiError(404, "Task not found");

  await prisma.task.delete({ where: { id } });
  await createAuditLog({
    userId: actor.id,
    action: "DELETE",
    recordType: "Task",
    recordId: id,
    previousValue: { title: existing.title, dueDate: existing.dueDate.toISOString() },
  });
}