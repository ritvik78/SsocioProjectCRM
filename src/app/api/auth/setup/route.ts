import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { setupSchema } from "@/lib/validation";
import { createActivity, createAuditLog } from "@/lib/track";

export async function POST(req: Request) {
  // Allow admin bootstrap only while no users exist.
  const count = await prisma.user.count();
  if (count > 0) {
    return NextResponse.json({ error: "Setup already completed" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fix the form errors" }, { status: 422 });
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return NextResponse.json(
      { error: "Supabase service role key is not configured on the server" },
      { status: 500 }
    );
  }

  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.name },
  });

  if (authError || !authUser?.user) {
    return NextResponse.json({ error: authError?.message ?? "Failed to create admin" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      authId: authUser.user.id,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.userPermission.createMany({
    data: (
      await prisma.permission.findMany()
    ).map((p) => ({ userId: user.id, permissionId: p.id })),
  });

  await createActivity({
    type: "LEAD_CREATED",
    description: `${user.name} created the first Super Admin account`,
    userId: user.id,
    meta: { bootstrap: true },
  });
  await createAuditLog({
    userId: user.id,
    action: "SETUP_COMPLETED",
    recordType: "User",
    recordId: user.id,
    newValue: { email: user.email, role: "SUPER_ADMIN" },
  });

  return NextResponse.json({ ok: true, userId: user.id });
}