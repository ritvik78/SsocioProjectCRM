import { Suspense } from "react";
import { BrandsServer } from "@/components/brands/brands-server";
import { CardGridSkeleton } from "@/components/ui/skeletons";

export default function BrandsPage() {
  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <BrandsServer />
    </Suspense>
  );
}