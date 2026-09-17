import { requirePermission } from "@/lib/auth";
import { BrandsView } from "@/components/brands/brands-view";

export default async function BrandsPage() {
  const ctx = await requirePermission("brands.view");
  return <BrandsView user={ctx.user} />;
}