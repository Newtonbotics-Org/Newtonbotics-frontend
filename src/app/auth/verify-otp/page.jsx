"use client";
import { useEffect, useMemo, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import AuthPageShell from "../components/AuthPageShell";
import { Alert, AuthHeading, SubmitButton } from "../components/AuthFields";

function OtpInputs({ value, onChange, disabled }) {
  const digits = value.split("");
  const inputRefs = useRef([]);

  const handleChange = (e, idx) => {
    const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 1);
    const next = (value.substring(0, idx) + v + value.substring(idx + 1)).padEnd(6, "");
    onChange(next);
    if (v && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pastedData.length > 0) {
      onChange(pastedData.padEnd(6, ""));
      inputRefs.current[Math.min(pastedData.length - 1, 5)]?.focus();
    }
  };

  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="nb-label mb-3">Verification code</legend>
      <div className="grid grid-cols-6 gap-2">
        {new Array(6).fill(0).map((_, idx) => (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            autoComplete={idx === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`Digit ${idx + 1}`}
            value={digits[idx]?.trim() || ""}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onPaste={handlePaste}
            disabled={disabled}
            className="h-14 w-full rounded-md border border-line-strong bg-surface text-center font-mono text-2xl text-ink focus:border-ink focus:outline-none focus:ring-[3px] focus:ring-signal/35 disabled:opacity-60"
          />
        ))}
      </div>
    </fieldset>
  );
}

function VerifyOtpContent() {
  const { verifyResetOtp } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const otpToken = params.get("otpToken") || undefined;
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expiresIn, setExpiresIn] = useState(600); // 10 minutes

  useEffect(() => {
    if (!email) setError("Missing email. Start again from the reset page.");
  }, [email]);

  useEffect(() => {
    if (expiresIn <= 0) return;
    const id = setInterval(() => setExpiresIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [expiresIn]);

  const mmss = useMemo(() => {
    const m = Math.floor(expiresIn / 60).toString().padStart(2, "0");
    const s = (expiresIn % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [expiresIn]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[0-9]{6}$/.test(otp)) {
      setError("Enter the 6-digit code");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await verifyResetOtp({ email, otp, otpToken });
      if (result.success) {
        const token = result?.data?.token;
        router.push(`/auth/reset-otp?token=${encodeURIComponent(token)}`);
      } else {
        setError(result.error || "OTP verification failed");
      }
    } catch (err) {
      setError(err?.message || "OTP verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell>
      <Link href="/auth/forgot" className="nb-link inline-flex items-center gap-1.5 self-start text-sm">
        <ArrowLeft size={16} aria-hidden="true" /> Use a different email
      </Link>
      <AuthHeading eyebrow="Step 2 of 3" title="Enter your code">
        We sent it to <strong className="text-ink">{email || "your email"}</strong>.
      </AuthHeading>
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <OtpInputs value={otp} onChange={setOtp} disabled={isSubmitting} />
        <p className="m-0 flex items-center justify-between font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
          <span>Code expires in</span>
          <span className={expiresIn < 60 ? "text-[#B91C1C]" : "text-ink"}>{mmss}</span>
        </p>
        <Alert>{error}</Alert>
        <SubmitButton loading={isSubmitting} loadingText="Verifying…" disabled={isSubmitting || expiresIn === 0}>
          {expiresIn === 0 ? "Code expired" : "Verify code"}
        </SubmitButton>
      </form>
      <p className="m-0 text-center text-sm text-ink-muted">
        Didn&apos;t get it?{" "}
        <Link href="/auth/forgot" className="nb-link">
          Request a new code
        </Link>
      </p>
    </AuthPageShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<AuthPageShell>{null}</AuthPageShell>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
