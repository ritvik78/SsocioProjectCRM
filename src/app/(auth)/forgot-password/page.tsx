import dynamic from "next/dynamic";
import { FormSkeleton } from "@/components/ui/skeletons";

const ForgotPasswordForm = dynamic(
  () => import("@/components/auth/forgot-password-form").then((m) => m.ForgotPasswordForm),
  { loading: () => <FormSkeleton /> }
);

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}