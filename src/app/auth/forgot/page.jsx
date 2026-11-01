"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import AuthPageShell from "../components/AuthPageShell";
import { Alert, AuthHeading, SubmitButton, TextField } from "../components/AuthFields";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpToken, setOtpToken] = useState(undefined);
  const [cooldown, setCooldown] = useState(0);

  const { requestResetOtp } = useAuth();
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/[^\s@]+@[^\s@]+\.[^\s@]+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestResetOtp(email.trim());
      if (result.success) {
        setIsSubmitted(true);
        const maybeToken = result?.data?.otpToken;
        if (maybeToken) setOtpToken(maybeToken);
        setCooldown(60);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const verifyUrl = `/auth/verify-otp?email=${encodeURIComponent(email)}${
    otpToken ? `&otpToken=${encodeURIComponent(otpToken)}` : ""
  }`;

  return (
    <AuthPageShell>
      <Link href="/auth?tab=signin" className="nb-link inline-flex items-center gap-1.5 self-start text-sm">
        <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
      </Link>

      {isSubmitted ? (
        <>
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#E3F1E7] text-[#166534]">
            <MailCheck size={22} aria-hidden="true" />
          </span>
          <AuthHeading eyebrow="Step 1 of 3 · done" title="Check your inbox">
            We sent a 6-digit code to <strong className="text-ink">{email}</strong>. Enter it on the next screen to
            set a new password.
          </AuthHeading>
          <button type="button" onClick={() => router.push(verifyUrl)} className="nb-btn nb-btn-primary h-[52px] w-full">
            Enter the code
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || cooldown > 0}
            className="nb-btn nb-btn-secondary w-full"
          >
            {isSubmitting ? "Sending…" : cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
          <Alert>{error}</Alert>
        </>
      ) : (
        <>
          <AuthHeading eyebrow="Step 1 of 3" title="Reset your password">
            Enter the email on your account and we&apos;ll send you a verification code.
          </AuthHeading>
          <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
            <TextField
              id="forgot-email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@nst.rishihood.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Alert>{error}</Alert>
            <SubmitButton loading={isSubmitting} loadingText="Sending code…" disabled={isSubmitting || cooldown > 0}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Send code"}
            </SubmitButton>
          </form>
        </>
      )}
    </AuthPageShell>
  );
}
