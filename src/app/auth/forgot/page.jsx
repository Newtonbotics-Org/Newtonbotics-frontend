"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import AuthSideVideo, { FORGOT_PASSWORD_VIDEO } from "../components/AuthSideVideo";
import AuthPageShell from "../components/AuthPageShell";

function Input({ label, icon: Icon, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm text-white/80">{label}</span>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />}
        <input {...props} className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl bg-black/50 border border-white/25 focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-white placeholder-white/60`} />
      </div>
    </label>
  );
}

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
        setCooldown(60); // 60s resend cooldown
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message || "Failed to send OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  // cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  if (isSubmitted) {
    return (
      <AuthPageShell withGrid={false}>
        <AuthSideVideo src={FORGOT_PASSWORD_VIDEO} />

        <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md lg:max-w-none rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl shadow-2xl p-6 md:p-8 text-center"
            >
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h1 className="text-2xl md:text-3xl font-bold mb-2">OTP sent to your email</h1>
              <p className="text-white/70 mb-6">
                We've sent a 6-digit verification code to <span className="text-white font-medium">{email}</span>
              </p>
              <p className="text-white/60 text-sm mb-6">
                Enter the code to verify your identity and reset your password.
              </p>
              <a
                href="/auth"
                className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </a>
              <div className="mt-6">
                <button
                  onClick={() => router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}${otpToken ? `&otpToken=${encodeURIComponent(otpToken)}` : ''}`)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 transition font-semibold"
                >
                  Continue to OTP verification
                </button>
              </div>
            </motion.div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <AuthSideVideo src={FORGOT_PASSWORD_VIDEO} />

      <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md lg:max-w-none rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl shadow-2xl p-6 md:p-8"
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Reset your password</h1>
            <p className="text-white/70 mb-6">
              Enter your email address and we'll send you a verification code to reset your password.
            </p>

            <form onSubmit={onSubmit} className="space-y-5">
              <Input 
                label="Email address" 
                icon={Mail} 
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || cooldown > 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:from-sky-800 disabled:to-indigo-800 disabled:cursor-not-allowed transition font-semibold"
                >
                  {isSubmitting ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Send OTP"}
                </button>
              </div>
            </form>

            <div className="mt-4 text-sm text-white/70 text-center">
              Remember your password? <a href="/auth" className="text-white hover:underline">Sign in</a>
            </div>
          </motion.div>
    </AuthPageShell>
  );
}


