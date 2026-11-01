"use client";
import { Suspense } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import AuthPageShell from "../components/AuthPageShell";
import NewPasswordForm from "../components/NewPasswordForm";

function ResetPasswordOtpContent() {
  const { resetPasswordWithOtp } = useAuth();
  return <NewPasswordForm onReset={resetPasswordWithOtp} />;
}

export default function ResetPasswordOtpPage() {
  return (
    <Suspense fallback={<AuthPageShell>{null}</AuthPageShell>}>
      <ResetPasswordOtpContent />
    </Suspense>
  );
}
