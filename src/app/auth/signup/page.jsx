"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap, Users, Shield, Cpu, Bot, User, Mail, Lock, UserPlus } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import AuthSideVideo from "../components/AuthSideVideo";
import AuthPageShell from "../components/AuthPageShell";

const roles = [
  { id: "student", name: "Student", icon: GraduationCap },
  { id: "team", name: "Team Member", icon: Bot },
  { id: "mentor", name: "Mentor", icon: Shield },
  { id: "research", name: "Researcher", icon: Cpu },
  { id: "community", name: "Community", icon: Users },
];

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

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    if (!name.trim()) return setError("Please enter your name");
    if (!/[^\s@]+@[^\s@]+\.[^\s@]+/.test(email)) return setError("Enter a valid email");
    if (password.length < 6) return setError("Password must be at least 6 characters");

    setIsLoading(true);
    
    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role
      });
      
      if (result.success) {
        setMessage("Account created! Redirecting...");
        setTimeout(() => router.push("/DashBoard"), 500);
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (error) {
      setError(error.message || "Registration failed");
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
        className="w-full max-w-xl lg:max-w-none rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl shadow-2xl p-6 md:p-8"
      >
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Create your account</h1>
            <p className="text-white/70 mb-6">Choose a role and join the NewtonBotics community.</p>

            <form onSubmit={onSubmit} className="space-y-5">
              <Input label="Full name" icon={User} type="text" placeholder="Jane Doe" value={name} onChange={(e)=>setName(e.target.value)} />
              <Input label="Email" icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
              <Input label="Password" icon={Lock} type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e)=>setPassword(e.target.value)} />

              <div>
                <div className="text-sm text-white/80 mb-2">Role</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {roles.map((r) => (
                    <button key={r.id} type="button" onClick={()=>setRole(r.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${role===r.id?"border-sky-400 bg-sky-400/10":"border-white/20 bg-white/5 hover:bg-white/10"}`}>
                      <r.icon className="w-4 h-4" />
                      <span className="text-sm">{r.name}</span>
                    </button>
                  ))}
                </div>
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
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Create account
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-sm text-white/70 text-center">Already have an account? <a href="/auth/signin" className="text-white hover:underline">Sign in</a></div>
      </motion.div>
    </AuthPageShell>
  );
} 