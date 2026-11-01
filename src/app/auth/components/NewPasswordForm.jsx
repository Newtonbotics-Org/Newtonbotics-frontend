"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import AuthPageShell from "./AuthPageShell";
import {
  Alert,
  AuthHeading,
  PasswordChecklist,
  PasswordField,
  SubmitButton,
  passwordRules as buildPasswordRules,
} from "./AuthFields";

/**
 * Final step of password recovery. `onReset(token, password)` must resolve to
 * `{ success, error }` — the OTP and email-link flows pass different handlers.
 */
export default function NewPasswordForm({ onReset, eyebrow = "Step 3 of 3" }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) setToken(tokenParam);
    else setError("Invalid or missing reset token");
  }, [searchParams]);

  const rules = useMemo(() => buildPasswordRules(password), [password]);
  const isValidPassword = rules.every((r) => r.met);
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isValidPassword) {
      setError("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await onReset(token, password);
      if (result.success) setIsSuccess(true);
      else setError(result.error || "Failed to reset password");
    } catch (err) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthPageShell>
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#E3F1E7] text-[#166534]">
          <CheckCircle2 size={22} aria-hidden="true" />
        </span>
        <AuthHeading eyebrow="Done" title="Password updated">
          You can now sign in with your new password.
        </AuthHeading>
        <button
          type="button"
          onClick={() => router.push("/auth?tab=signin")}
          className="nb-btn nb-btn-primary h-[52px] w-full"
        >
          Go to sign in
        </button>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <AuthHeading eyebrow={eyebrow} title="Choose a new password">
        Make it something you haven&apos;t used here before.
      </AuthHeading>
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <PasswordField
          id="new-password"
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          invalid={password.length > 0 && !isValidPassword}
          aria-describedby="new-password-rules"
        />
        {password.length > 0 && <PasswordChecklist id="new-password-rules" rules={rules} />}
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          invalid={mismatch}
          hint={mismatch ? "Passwords do not match" : undefined}
        />
        <Alert>{error}</Alert>
        <SubmitButton loading={isSubmitting} loadingText="Saving…" disabled={isSubmitting || !token}>
          Save new password
        </SubmitButton>
      </form>
      <p className="m-0 text-center text-sm text-ink-muted">
        Link expired?{" "}
        <Link href="/auth/forgot" className="nb-link">
          Start over
        </Link>
      </p>
    </AuthPageShell>
  );
}
