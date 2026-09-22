import dynamic from "next/dynamic";
import { FormSkeleton } from "@/components/ui/skeletons";

const ActivateForm = dynamic(
  () => import("@/components/auth/activate-form").then((m) => m.ActivateForm),
  { loading: () => <FormSkeleton /> }
);

export default function ActivatePage() {
  return <ActivateForm />;
}