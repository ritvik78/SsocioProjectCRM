import dynamic from "next/dynamic";
import { requirePermission } from "@/lib/auth";
import { DetailSkeleton } from "@/components/ui/skeletons";

const BrandDetail = dynamic(
  () => import("@/components/brands/brand-detail").then((m) => m.BrandDetail),
  { loading: () => <DetailSkeleton /> }
);

export default async function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePermission("brands.view");
  const { id } = await params;
  return <BrandDetail id={id} user={ctx.user} />;
}