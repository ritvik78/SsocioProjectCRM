import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { listTeam, inviteMember } from "@/lib/records/team";
import { teamInviteSchema } from "@/lib/validation";

export async function GET() {
  try {
    await apiRequirePermission("team.manage");
    const members = await listTeam();
    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await apiRequirePermission("team.manage");
    const body = await req.json().catch(() => ({}));
    const parsed = teamInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fix the form errors" }, { status: 422 });
    }
    const member = await inviteMember(parsed.data, ctx.user);
    return NextResponse.json({ member }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to invite member" }, { status: error.status ?? 500 });
  }
}