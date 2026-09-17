import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { listFollowups, createFollowup } from "@/lib/records/followups";
import { followupSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const ctx = await apiRequirePermission("followups.manage");
    const sp = req.nextUrl.searchParams;
    const followups = await listFollowups({
      bucket: (sp.get("bucket") as any) ?? "today",
      brandId: sp.get("brandId") ?? undefined,
      influencerId: sp.get("influencerId") ?? undefined,
      assignedToId: sp.get("assignedTo") ?? undefined,
      status: sp.get("status") ?? undefined,
    });
    // Non-admins only see follow-ups assigned to them unless they have brands.edit.
    const filtered =
      ctx.user.role === "SUPER_ADMIN" || ctx.user.permissions.has("followups.manage")
        ? followups
        : followups.filter((f) => f.assignedToId === ctx.user.id);
    return NextResponse.json({ followups: filtered });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await apiRequirePermission("followups.manage");
    const body = await req.json().catch(() => ({}));
    const parsed = followupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fix the form errors" }, { status: 422 });
    }
    const followup = await createFollowup(parsed.data, ctx.user);
    return NextResponse.json({ followup }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to create follow-up" }, { status: error.status ?? 500 });
  }
}