"use client";

import { useEffect, useMemo, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import AuthSideVideo, { FORGOT_PASSWORD_VIDEO } from "../components/AuthSideVideo";
import AuthPageShell from "../components/AuthPageShell";

function OtpInputs({ value, onChange, disabled }) {
  const digits = value.split("");
  const inputRefs = useRef([]);

  const handleChange = (e, idx) => {
    const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 1);
    const next = (value.substring(0, idx) + v + value.substring(idx + 1)).padEnd(6, "");
    onChange(next);

    // Auto-focus to next input if current input has a value
    if (v && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    // Handle backspace - move to previous input if current is empty
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    // Handle arrow keys
    else if (e.key === "ArrowLeft" && idx > 0) {
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
      // Focus on the last filled input or the next empty one
      const focusIdx = Math.min(pastedData.length - 1, 5);
      inputRefs.current[focusIdx]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {new Array(6).fill(0).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[idx] || ""}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          className="w-12 h-12 text-center text-lg rounded-lg bg-black/50 border border-white/25 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          disabled={disabled}
        />
      ))}
    </div>
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
    if (!email) setError("Missing email");
  }, [email]);

  // countdown
  useEffect(() => {
    if (expiresIn <= 0) return;
    const id = setInterval(() => setExpiresIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [expiresIn]);

  const mmss = useMemo(() => {
    const m = Math.floor(expiresIn / 60)
      .toString()
      .padStart(2, "0");
    const s = (expiresIn % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [expiresIn]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[0-9]{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP");
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
      <AuthSideVideo src={FORGOT_PASSWORD_VIDEO} />

      <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md lg:max-w-none rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl shadow-2xl p-6 md:p-8"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <h1 className="text-2xl md:text-3xl font-bold">Verify OTP</h1>
            </div>
            <p className="text-white/70 mb-6">
              Enter the 6-digit code sent to <span className="text-white font-medium">{email}</span>. Expires in {mmss}.
            </p>

            <form onSubmit={submit} className="space-y-5">
              <div className="flex justify-center">
                <OtpInputs value={otp} onChange={setOtp} disabled={isSubmitting} />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting || expiresIn === 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:from-sky-800 disabled:to-indigo-800 disabled:cursor-not-allowed transition font-semibold"
              >
                {isSubmitting ? "Verifying..." : expiresIn === 0 ? "OTP expired" : "Verify"}
              </button>
            </form>

            <div className="mt-4 text-sm text-white/70 text-center">
              Didn't receive it? You can request a new OTP from the previous page.
            </div>
          </motion.div>
    </AuthPageShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070b12] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
