import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import prisma from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { ALL_PERMISSIONS, type Role } from "@/lib/constants";

export type SessionUser = {
  id: string;
  authId: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  permissions: Set<string>;
};

export type AuthContext = {
  user: SessionUser;
  supabase: SupabaseClient;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type MaybeAuthContext = AuthContext | null;

export const getCurrentUser = cache(
  async (): Promise<MaybeAuthContext> => {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) return null;

      const profile = await prisma.user.findUnique({
        where: { authId: authUser.id },
        include: {
          userPermissions: { include: { permission: true } },
        },
      });

      if (!profile) return null;
      if (profile.status !== "ACTIVE") return null;

      const isSuperAdmin = profile.role === "SUPER_ADMIN";
      const permissions = isSuperAdmin
        ? new Set(ALL_PERMISSIONS)
        : new Set(profile.userPermissions.map((p) => p.permission.key));

      return {
        user: {
          id: profile.id,
          authId: profile.authId!,
          name: profile.name,
          email: profile.email,
          role: profile.role as Role,
          status: profile.status,
          permissions,
        },
        supabase,
      };
    } catch {
      return null;
    }
  }
);

/** Page-level guard. Redirects to /login when unauthenticated. */
export async function requireUser(): Promise<AuthContext> {
  const ctx = await getCurrentUser();
  if (!ctx) redirect("/login");
  return ctx;
}

/** Page-level guard with permission check. */
export async function requirePermission(permission: string): Promise<AuthContext> {
  const ctx = await requireUser();
  if (ctx.user.role !== "SUPER_ADMIN" && !ctx.user.permissions.has(permission)) {
    redirect("/forbidden");
  }
  return ctx;
}

/** API-level guard. Returns null when unauthenticated (caller returns 401). */
export async function apiUser(): Promise<MaybeAuthContext> {
  return getCurrentUser();
}

/** API-level guard with permission check. Throws ApiError(401/403). */
export async function apiRequirePermission(permission: string): Promise<AuthContext> {
  const ctx = await getCurrentUser();
  if (!ctx) throw new ApiError(401, "Unauthorized");
  if (ctx.user.role !== "SUPER_ADMIN" && !ctx.user.permissions.has(permission)) {
    throw new ApiError(403, "You do not have permission to perform this action");
  }
  return ctx;
}

/** Returns true when the current user holds a permission (no throw/redirect). */
export async function can(permission: string): Promise<boolean> {
  const ctx = await getCurrentUser();
  if (!ctx) return false;
  return ctx.user.role === "SUPER_ADMIN" || ctx.user.permissions.has(permission);
}

export function hasAnyPermission(user: SessionUser, permissions: string[]) {
  if (user.role === "SUPER_ADMIN") return true;
  return permissions.some((p) => user.permissions.has(p));
}

export function hasPermission(user: SessionUser, permission: string) {
  if (user.role === "SUPER_ADMIN") return true;
  return user.permissions.has(permission);
}

export function registerAuthEvent() {
  void cookies();
}