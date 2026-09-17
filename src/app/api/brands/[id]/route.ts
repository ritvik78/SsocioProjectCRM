import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { getBrand, updateBrand, deleteBrand } from "@/lib/records/brands";
import { brandSchema } from "@/lib/validation";

function brandId(ctx: RouteContext<"/api/brands/[id]">) {
  return ctx.params.then((p) => p.id as string);
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/brands/[id]">) {
  try {
    await apiRequirePermission("brands.view");
    const id = await brandId(ctx);
    const brand = await getBrand(id);
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    return NextResponse.json({ brand });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/brands/[id]">) {
  try {
    const userCtx = await apiRequirePermission("brands.edit");
    const id = await brandId(ctx);
    const body = await req.json().catch(() => ({}));
    const parsed = brandSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fix the form errors" }, { status: 422 });
    }
    const brand = await updateBrand(id, parsed.data, userCtx.user);
    return NextResponse.json({ brand });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to update brand" }, { status: error.status ?? 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/brands/[id]">) {
  try {
    const userCtx = await apiRequirePermission("brands.delete");
    const id = await brandId(ctx);
    await deleteBrand(id, userCtx.user);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to delete brand" }, { status: error.status ?? 500 });
  }
}