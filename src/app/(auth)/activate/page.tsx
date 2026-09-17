import { Suspense } from "react";
import { ActivateForm } from "@/components/auth/activate-form";

export default function ActivatePage() {
  return (
    <Suspense>
      <ActivateForm />
    </Suspense>
  );
}