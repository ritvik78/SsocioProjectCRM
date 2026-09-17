import { requirePermission } from "@/lib/auth";
import { ImportView } from "@/components/import/import-view";

export default async function ImportPage() {
  await requirePermission("brands.add");
  return <ImportView />;
}