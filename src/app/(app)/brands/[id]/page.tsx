import { requirePermission } from "@/lib/auth";
import { BrandDetail } from "@/components/brands/brand-detail";

export default async function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePermission("brands.view");
  const { id } = await params;
  return <BrandDetail id={id} user={ctx.user} />;
}