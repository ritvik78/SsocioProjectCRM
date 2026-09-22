import dynamic from "next/dynamic";
import { FormSkeleton } from "@/components/ui/skeletons";

const ResetPasswordForm = dynamic(
  () => import("@/components/auth/reset-password-form").then((m) => m.ResetPasswordForm),
  { loading: () => <FormSkeleton /> }
);

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}