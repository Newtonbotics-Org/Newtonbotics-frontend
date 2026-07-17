"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import AuthSideVideo from "../components/AuthSideVideo";
import AuthPageShell from "../components/AuthPageShell";

function Input({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />}
      <input
        {...props}
        className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl bg-black/50 border border-white/25 focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-white placeholder-white/60`}
      />
    </div>
  );
}

function PasswordInput({ icon: Icon = Lock, value, onChange, placeholder = "Password" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
      )}
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-10 py-3 rounded-xl bg-black/50 border border-white/25 focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-white placeholder-white/60`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 transition"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    if (!/[^\s@]+@[^\s@]+\.[^\s@]+/.test(email)) {
      setError("Please enter a valid email");
      return;
    }
    
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login({ email: email.trim(), password });
      
      if (result.success) {
        setMessage("Welcome back! Redirecting...");
        setTimeout(() => router.push("/DashBoard"), 500);
      } else {
        setError(result.error || "Login failed");
      }
    } catch (error) {
      setError(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageShell>
      <AuthSideVideo />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md lg:max-w-none rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl shadow-2xl p-6 md:p-8"
      >
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Welcome back</h1>
            <p className="text-white/70 mb-6">Sign in to your NewtonBotics account.</p>

            <form onSubmit={onSubmit} className="space-y-4">
              <Input icon={Mail} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
              <div className="text-right -mt-2">
                <a href="/auth/forgot" className="text-sm text-white/70 hover:text-white hover:underline">Forgot password?</a>
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              {message && <div className="text-emerald-400 text-sm">{message}</div>}
                             <button
                 type="submit"
                 disabled={isLoading}
                 className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:from-sky-800 disabled:to-indigo-800 disabled:cursor-not-allowed transition font-semibold flex items-center justify-center gap-2"
               >
                 {isLoading ? (
                   <>
                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                     Signing in...
                   </>
                 ) : (
                   <>
                     <LogIn className="w-4 h-4" /> Continue
                   </>
                 )}
               </button>
            </form>

            <div className="mt-4 text-sm text-white/70 text-center">
              New to the club? <a href="/auth/signup" className="text-white hover:underline">Create an account</a>
            </div>
      </motion.div>
    </AuthPageShell>
  );
} 