import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { activateInvitation } from "@/lib/records/team";
import { resetPasswordSchema } from "@/lib/validation";

// GET /api/auth/activate?token=xxx → return invitation details for the activation page.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 422 });

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: { email: true, name: true, role: true, status: true, expiresAt: true },
  });

  if (!invitation) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  return NextResponse.json({ invitation });
}

// POST /api/auth/activate → set the invited user's password and activate the account.
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const body = await req.json().catch(() => ({}));
    const parsed = resetPasswordSchema.safeParse(body);
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 422 });
    if (!parsed.success) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 422 });

    const user = await activateInvitation(token, parsed.data.password);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Could not activate account" }, { status: error.status ?? 500 });
  }
}