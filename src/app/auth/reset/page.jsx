import { Suspense } from "react";
import AuthPageShell from "../components/AuthPageShell";
import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthPageShell>{null}</AuthPageShell>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
