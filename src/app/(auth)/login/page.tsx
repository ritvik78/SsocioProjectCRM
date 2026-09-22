import dynamic from "next/dynamic";
import { FormSkeleton } from "@/components/ui/skeletons";

const LoginForm = dynamic(
  () => import("@/components/auth/login-form").then((m) => m.LoginForm),
  { loading: () => <FormSkeleton /> }
);

export default function LoginPage() {
  return <LoginForm />;
}