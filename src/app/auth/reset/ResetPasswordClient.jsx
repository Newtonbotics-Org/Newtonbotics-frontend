"use client";

import { useAuth } from "../../../contexts/AuthContext";
import NewPasswordForm from "../components/NewPasswordForm";

export default function ResetPasswordClient() {
  const { resetPassword } = useAuth();
  return <NewPasswordForm onReset={resetPassword} eyebrow="Reset password" />;
}
