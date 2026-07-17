"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import AuthSideVideo, { FORGOT_PASSWORD_VIDEO } from "../components/AuthSideVideo";
import AuthPageShell from "../components/AuthPageShell";

function PasswordInput({ label, value, onChange, placeholder, show, onToggleShow }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm text-white/80">{label}</span>}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-black/50 border border-white/25 focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-white placeholder-white/60"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center text-white/60 hover:text-white/80 transition"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </label>
  );
}

function ResetPasswordOtpContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPasswordWithOtp } = useAuth();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Invalid or missing reset token");
    }
  }, [searchParams]);

  const isValidPassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*()_\-.,?":{}|<>]/.test(password)
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidPassword(password)) {
      setError(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await resetPasswordWithOtp(token, password);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || "Failed to reset password");
      }
    } catch (err) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
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
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Password reset successful!</h1>
              <p className="text-white/70 mb-6">Your password has been updated successfully.</p>
              <button
                onClick={() => router.push("/auth/signin")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 transition font-semibold"
              >
                Continue to sign in
              </button>
        </motion.div>
      </AuthPageShell>
    );
  }

  if (error && !token) {
    return (
      <AuthPageShell withGrid={false}>
        <AuthSideVideo src={FORGOT_PASSWORD_VIDEO} />

        <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md lg:max-w-none rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl shadow-2xl p-6 md:p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-red-400 text-2xl">⚠</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 text-red-400">Invalid Reset Link</h1>
              <p className="text-white/70 mb-6">{error}</p>
              <a
                href="/auth/forgot"
                className="inline-block w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 transition font-semibold"
              >
                Request new reset link
              </a>
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
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Set new password</h1>
            <p className="text-white/70 mb-6">Enter your new password below.</p>

            <form onSubmit={onSubmit} className="space-y-5">
              <PasswordInput
                label="New password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                show={showPassword}
                onToggleShow={() => setShowPassword(!showPassword)}
              />

              <PasswordInput
                label="Confirm password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                show={showConfirmPassword}
                onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:from-sky-800 disabled:to-indigo-800 disabled:cursor-not-allowed transition font-semibold"
              >
                {isSubmitting ? "Updating..." : "Update password"}
              </button>
            </form>

            <div className="mt-4 text-sm text-white/70 text-center">
              Remember your password? <a href="/auth/signin" className="text-white hover:underline">Sign in</a>
            </div>
          </motion.div>
    </AuthPageShell>
  );
}

export default function ResetPasswordOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070b12] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordOtpContent />
    </Suspense>
  );
}
