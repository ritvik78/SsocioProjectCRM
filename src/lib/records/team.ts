import "server-only";

import crypto from "crypto";
import prisma from "@/lib/db";
import { ApiError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailSettings, getProvider } from "@/lib/email/settings";
import { createActivity, createAuditLog } from "@/lib/track";
import { ROLE_DEFAULT_PERMISSIONS, type Role } from "@/lib/constants";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type TeamInviteInput = {
  name: string;
  email: string;
  phone?: string | null;
  designation?: string | null;
  role: string;
  permissions: string[];
};

export async function listTeam() {
  const members = await prisma.user.findMany({
    include: {
      userPermissions: { include: { permission: true } },
      _count: {
        select: {
          brandsOwned: true,
          influencersOwned: true,
          followupsAssigned: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return members;
}

const roleIsValid = (role: string): role is Role =>
  ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_MEMBER"].includes(role);

export async function inviteMember(input: TeamInviteInput, actor: { id: string; name: string }) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "A user with this email already exists");

  if (!roleIsValid(input.role)) throw new ApiError(422, "Invalid role");

  // Create the auth user (no password yet — set during activation).
  const admin = createAdminClient();
  let authId: string | undefined;
  let existingAuth: boolean | null = null;
  try {
    const res = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name: input.name },
    });
    authId = res.data.user?.id;
  } catch (error: any) {
    const message = error?.message ?? "";
    if (/already registered/i.test(message) || /already been registered/i.test(message)) {
      existingAuth = true;
      const lookup = await admin.auth.admin.listUsers({ perPage: 1000 });
      const match = lookup.data.users.find((u) => u.email === email);
      authId = match?.id;
    } else if (/not supported|does not allow|cloud/i.test(message) && authId === undefined) {
      existingAuth = false; // email-based creation unsupported; user will sign up via magic link scope
    } else if (authId === undefined) {
      throw new ApiError(502, "Could not create auth account for this user");
    }
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const user = await prisma.user.create({
    data: {
      authId,
      name: input.name,
      email,
      phone: input.phone ?? null,
      designation: input.designation ?? null,
      role: input.role,
      status: "INVITED",
    },
  });

  // Granted explicit permissions (explicit rows are the source of truth; role used as fallback priming).
  const permissions = input.permissions.length
    ? input.permissions
    : ROLE_DEFAULT_PERMISSIONS[input.role as Role];
  const granted = new Set(permissions);
  const permissionRows = await prisma.permission.findMany({ where: { key: { in: [...granted] } } });
  await prisma.userPermission.createMany({
    data: permissionRows.map((p) => ({ userId: user.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  await prisma.invitation.create({
    data: {
      token,
      email,
      name: input.name,
      role: input.role,
      permissions: [...granted],
      invitedById: actor.id,
      status: "PENDING",
      expiresAt,
    },
  });

  // Send invitation email.
try {
      const settings = await getEmailSettings();
      const activateUrl = `${APP_URL}/activate?token=${token}`;
      const body = [
        `Hi ${input.name},`,
        ``,
        `${actor.name} invited you to join Ssocio Pro CRM as ${input.role.replace("_", " ")}.`,
        ``,
        `Set your password and activate your account here:`,
        activateUrl,
        ``,
        `This invitation expires in 7 days.`,
      ].join("\n");

      const provider = getProvider();
      const fromEmail = settings?.senderEmail ?? process.env.RESEND_FROM_EMAIL ?? "no-reply@ssociopro.com";
      const fromName = settings?.senderName ?? "Ssocio Pro";
      await provider.sendEmail({
        to: email,
        subject: `You're invited to Ssocio Pro CRM`,
        html: body.replace(/\n/g, "<br/>"),
        fromEmail,
        fromName,
        replyTo: settings?.replyTo,
      });
    } catch (error: any) {
    // Email failed — keep the invitation active; admin can resend.
    console.error("Invite email failed:", error?.message);
  }

  if (existingAuth === null || existingAuth) {
    await createActivity({ type: "UPDATED", description: `Team invite sent to ${input.name} (${email})`, userId: actor.id });
  }
  await createAuditLog({ userId: actor.id, action: "CREATE", recordType: "User", recordId: user.id, newValue: { name: input.name, email, role: input.role } });

  return user;
}

export async function updateMember(
  id: string,
  input: { name?: string; designation?: string; phone?: string; role?: string; status?: string; permissions?: string[] },
  actor: { id: string }
) {
  const user = await prisma.user.findUnique({ where: { id }, include: { userPermissions: { include: { permission: true } } } });
  if (!user) throw new ApiError(404, "User not found");

  if (user.role === "SUPER_ADMIN" && input.role && input.role !== "SUPER_ADMIN") {
    throw new ApiError(422, "Cannot change the role of a Super Admin");
  }
  if (user.id === actor.id && input.role && input.role !== user.role) {
    throw new ApiError(422, "You cannot change your own role");
  }

  const data: any = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.designation !== undefined) data.designation = input.designation;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.role !== undefined) data.role = input.role;
  if (input.status !== undefined) data.status = input.status;

  const updated = await prisma.user.update({ where: { id }, data });

  if (input.permissions) {
    const desired = new Set(
      user.role === "SUPER_ADMIN" || input.role === "SUPER_ADMIN"
        ? []
        : input.permissions
    );
    const existingKeys = new Set(user.userPermissions.map((p) => p.permission.key));
    const toAdd = [...desired].filter((k) => !existingKeys.has(k));
    const toRemove = user.userPermissions.filter((p) => !desired.has(p.permission.key));

    if (toAdd.length) {
      const permissionRows = await prisma.permission.findMany({ where: { key: { in: toAdd } } });
      await prisma.userPermission.createMany({
        data: permissionRows.map((p) => ({ userId: id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }
    if (toRemove.length) {
      await prisma.userPermission.deleteMany({
        where: { userId: id, permissionId: { in: toRemove.map((p) => p.permissionId) } },
      });
    }
  }

  if (input.status === "DISABLED") {
    const admin = createAdminClient();
    if (user.authId) {
      try {
        await admin.auth.admin.updateUserById(user.authId, { ban_duration: "876000h" });
      } catch (error: any) {
        console.error("Ban failed:", error?.message);
      }
    }
  } else if (input.status === "ACTIVE" && user.status === "DISABLED") {
    const admin = createAdminClient();
    if (user.authId) {
      try {
        await admin.auth.admin.updateUserById(user.authId, { ban_duration: "none" });
      } catch (error: any) {
        console.error("Unban failed:", error?.message);
      }
    }
  }

  await createAuditLog({
    userId: actor.id,
    action: "UPDATE",
    recordType: "User",
    recordId: id,
    previousValue: { name: user.name, role: user.role, status: user.status },
    newValue: { name: updated.name, role: updated.role, status: updated.status },
  });

  return updated;
}

export async function removeMember(id: string, actor: { id: string }) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "SUPER_ADMIN") throw new ApiError(422, "Cannot remove the Super Admin");
  if (user.id === actor.id) throw new ApiError(422, "You cannot remove yourself");

  const admin = createAdminClient();
  if (user.authId) {
    try {
      await admin.auth.admin.deleteUser(user.authId);
    } catch (error: any) {
      console.error("Auth delete failed:", error?.message);
    }
  }

  await prisma.user.delete({ where: { id } }); // cascades userPermissions, invitations
  await createAuditLog({ userId: actor.id, action: "DELETE", recordType: "User", recordId: id, previousValue: { name: user.name, email: user.email } });
  return user;
}

/** Complete an invited user's activation: set password, mark ACTIVE, grant permissions. */
export async function activateInvitation(token: string, password: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) throw new ApiError(404, "Invitation not found");
  if (invitation.status !== "PENDING") throw new ApiError(409, "This invitation has already been used");
  if (invitation.expiresAt < new Date()) throw new ApiError(410, "This invitation has expired");

  const email = invitation.email;
  let user = await prisma.user.findUnique({ where: { email } });
  let authId = user?.authId;

  const admin = createAdminClient();

  if (authId) {
    await admin.auth.admin.updateUserById(authId, { password });
  } else {
    // No auth user exists yet — create with the chosen password.
    const res = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: user?.name ?? invitation.name },
    });
    if (res.error) throw new ApiError(502, "Could not activate account");
    authId = res.data.user?.id;
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        authId,
        name: invitation.name ?? email.split("@")[0],
        email,
        role: invitation.role,
        status: "ACTIVE",
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { authId, status: "ACTIVE" },
    });
  }

  // Sync permissions from the invitation.
  const granted = new Set<string>(((invitation.permissions as any) ?? []) as string[]);
  const permissionRows = await prisma.permission.findMany({ where: { key: { in: [...granted] } } });
  await prisma.userPermission.createMany({
    data: permissionRows.map((p) => ({ userId: user.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  await prisma.activity.create({
    data: {
      userId: user.id,
      type: "ONBOARDING_COMPLETED",
      description: `${user.name} activated their account (${invitation.role})`,
    },
  });

  return user;
}