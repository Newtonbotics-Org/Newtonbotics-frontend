"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Users, Shield, Cpu, Bot, User2, Mail, Lock, Phone, Building, Calendar, Eye, EyeOff, ChevronLeft } from "lucide-react";
import AuthPageShell from "./components/AuthPageShell";

const roles = [
  { id: "student", name: "Student", icon: GraduationCap, blurb: "Learning and building" },
  { id: "team_member", name: "Team Member", icon: Bot, blurb: "Core robotics team" },
  { id: "mentor", name: "Mentor", icon: Shield, blurb: "Guiding and reviewing" },
  { id: "researcher", name: "Researcher", icon: Cpu, blurb: "AI & systems research" },
  { id: "community", name: "Community", icon: Users, blurb: "Helping the club" },
];

const departments = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Robotics Engineering",
  "Artificial Intelligence",
  "Data Science",
  "Other"
];

const authInputClass =
  "min-w-0 font-sans text-sm placeholder:text-xs placeholder:tracking-normal rounded-xl bg-white/10 border border-white/15 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-white placeholder-white/50";

function Input({ icon: Icon, className = "", ...props }) {
  return (
    <div className="relative min-w-0">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
      )}
      <input
        {...props}
        className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-3 ${authInputClass} ${className}`}
      />
    </div>
  );
}

function Select({ icon: Icon, children, className = "", ...props }) {
  return (
    <div className="relative min-w-0">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
      )}
      <select
        {...props}
        className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-3 ${authInputClass} ${className}`}
      >
        {children}
      </select>
    </div>
  );
}

function FieldLabel({ children }) {
  return <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/55">{children}</span>;
}

function PasswordInput({ icon: Icon = Lock, value, onChange, placeholder = "Password" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative min-w-0">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
      )}
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-10 py-3 ${authInputClass}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function SignupStepIndicator({ step }) {
  const steps = [
    { num: 1, label: "Personal details" },
    { num: 2, label: "Academic & role" },
  ];

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-3">
        {steps.map((s, index) => (
          <div key={s.num} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center nb-chamfer text-xs font-semibold transition ${
                  step >= s.num ? "bg-red-600 text-white" : "bg-white/10 text-white/45"
                }`}
              >
                {s.num}
              </div>
              <span className={`truncate text-xs sm:text-sm ${step >= s.num ? "text-white" : "text-white/45"}`}>
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-px flex-1 ${step > s.num ? "bg-red-500/50" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-white/45">Step {step} of 2</p>
    </div>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState("signin");
  const [signupStep, setSignupStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    studentId: "",
    department: "",
    yearOfStudy: "",
    phone: ""
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, register, error: authError, clearError } = useAuth();

  useEffect(() => {
    setMessage("");
    setError("");
    clearError();
    setSignupStep(1);
  }, [tab, clearError]);

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const isValidEmail = useMemo(
    () => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(formData.email),
    [formData.email]
  );

  const isValidPassword = useMemo(() => {
    const password = formData.password;
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password) && 
           /[!@#$%^&*()_\-.,?":{}|<>]/.test(password);
  }, [formData.password]);

  const isValidPhone = useMemo(() => {
    const phone = formData.phone.trim();
    if (!phone) return true; // Phone is optional

    const digitsOnly = phone.replace(/\D/g, "");

    return (
      /^[6-9]\d{9}$/.test(digitsOnly) || // 7541062514
      /^0[6-9]\d{9}$/.test(digitsOnly) || // 07541062514
      /^91[6-9]\d{9}$/.test(digitsOnly) // +91 or 917541062514
    );
  }, [formData.phone]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateSignupStep1 = () => {
    if (!formData.firstName.trim() || formData.firstName.length < 2) {
      setError("First name must be at least 2 characters");
      return false;
    }

    if (!formData.lastName.trim() || formData.lastName.length < 2) {
      setError("Last name must be at least 2 characters");
      return false;
    }

    if (!isValidEmail) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!isValidPassword) {
      setError("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (!isValidPhone) {
      setError("Please enter a valid 10-digit mobile number (or use 0, +91, or 91 prefix)");
      return false;
    }

    return true;
  };

  const validateSignupStep2 = () => {
    if (formData.role === "student" && !formData.studentId.trim()) {
      setError("Student ID is required for students");
      return false;
    }

    if (formData.role === "student" && !formData.department) {
      setError("Department is required for students");
      return false;
    }

    if (formData.role === "student" && !formData.yearOfStudy) {
      setError("Year of study is required for students");
      return false;
    }

    return true;
  };

  const validateSignupForm = () => validateSignupStep1() && validateSignupStep2();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateSignupForm()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const userData = {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
        ...(formData.role === "student" && {
          studentId: formData.studentId.trim(),
          department: formData.department,
          yearOfStudy: parseInt(formData.yearOfStudy),
        }),
        ...(formData.phone && { phone: formData.phone.trim() }),
      };

      const result = await register(userData);
      
      if (result.success) {
        if (result.roleNotice) {
          const { requestedRole, assignedRole, message: noticeMsg } = result.roleNotice;
          setMessage(
            noticeMsg || `Requested role '${requestedRole}' is not pre-approved. Registered as '${assignedRole}'.`
          );
        } else {
          setMessage("Account created successfully! Redirecting...");
        }
      } else {
        if (result.code === 409) {
          setError('An account with this email already exists.');
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      setError(error.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const result = await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      
      if (result.success) {
        setMessage("Welcome back! Redirecting...");
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupStep = (e) => {
    e.preventDefault();
    setError("");

    if (signupStep === 1) {
      if (validateSignupStep1()) {
        setSignupStep(2);
      }
      return;
    }

    handleSignup(e);
  };

  const goToPreviousSignupStep = () => {
    setError("");
    setSignupStep(1);
  };

  const onSubmit = (e) => {
    if (tab === "signin") {
      handleSignin(e);
    } else {
      handleSignupStep(e);
    }
  };

  return (
    <AuthPageShell variant="brand" withGrid={false}>
          {/* Left: Video */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative w-full max-w-lg lg:max-w-xl h-64 md:h-96 lg:h-[500px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl lg:order-1"
          >
            <video
              src="/authentication.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`relative w-full rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.03] p-6 md:p-8 lg:order-2 flex flex-col ${
              tab === "signup" ? "max-w-2xl" : "max-w-md"
            }`}
          >
            {/* Tabs */}
            <div className="flex items-center gap-2 bg-white/5 nb-chamfer p-1 w-fit mx-auto mb-6 border border-white/10 flex-shrink-0">
              <button
                className={`px-4 py-2 nb-chamfer text-sm font-medium transition ${tab === "signin" ? "bg-white/15" : "text-white/70 hover:text-white"}`}
                onClick={() => setTab("signin")}
              >
                Sign In
              </button>
              <button
                className={`px-4 py-2 nb-chamfer text-sm font-medium transition ${tab === "signup" ? "bg-white/15" : "text-white/70 hover:text-white"}`}
                onClick={() => setTab("signup")}
              >
                Sign Up
              </button>
            </div>

            <div className="flex-1">
            <AnimatePresence mode="wait">
              {tab === "signin" ? (
                <motion.form
                  key="signin"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  onSubmit={onSubmit}
                  className="space-y-4"
                >
                  <Input 
                    icon={Mail} 
                    type="email" 
                    placeholder="Email address" 
                    value={formData.email} 
                    onChange={(e) => handleInputChange('email', e.target.value)} 
                  />
                  <PasswordInput 
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Password"
                  />
                  <div className="flex justify-end">
                    <Link href="/auth/forgot" className="text-xs text-white/70 hover:text-white underline underline-offset-2">
                      Forgot password?
                    </Link>
                  </div>
                  {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
                  {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</div>}
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed transition font-semibold"
                  >
                    {isSubmitting ? "Signing In..." : "Continue"}
                  </button>
                  <div className="text-center text-sm text-white/60">
                    Don't have an account? <button type="button" onClick={()=>setTab("signup")} className="text-white hover:underline">Sign up</button>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  onSubmit={onSubmit}
                  className="space-y-6"
                >
                  <SignupStepIndicator step={signupStep} />

                  <AnimatePresence mode="wait">
                    {signupStep === 1 ? (
                      <motion.div
                        key="signup-step-1"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        className="space-y-4"
                      >
                        <p className="text-sm font-medium text-white/80">Tell us about yourself</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="block min-w-0">
                            <FieldLabel>First name</FieldLabel>
                            <Input
                              icon={User2}
                              type="text"
                              placeholder="Jane"
                              value={formData.firstName}
                              onChange={(e) => handleInputChange("firstName", e.target.value)}
                            />
                          </label>
                          <label className="block min-w-0">
                            <FieldLabel>Last name</FieldLabel>
                            <Input
                              icon={User2}
                              type="text"
                              placeholder="Doe"
                              value={formData.lastName}
                              onChange={(e) => handleInputChange("lastName", e.target.value)}
                            />
                          </label>
                        </div>

                        <label className="block min-w-0">
                          <FieldLabel>Email</FieldLabel>
                          <Input
                            icon={Mail}
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                          />
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="block min-w-0">
                            <FieldLabel>Password</FieldLabel>
                            <PasswordInput
                              value={formData.password}
                              onChange={(e) => handleInputChange("password", e.target.value)}
                              placeholder="Min 8 chars"
                            />
                          </label>
                          <label className="block min-w-0">
                            <FieldLabel>Confirm password</FieldLabel>
                            <PasswordInput
                              value={formData.confirmPassword}
                              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                              placeholder="Confirm"
                            />
                          </label>
                        </div>

                        <label className="block min-w-0">
                          <FieldLabel>Phone (optional)</FieldLabel>
                          <Input
                            icon={Phone}
                            type="tel"
                            placeholder="Phone (optional)"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                          />
                        </label>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="signup-step-2"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        className="space-y-4"
                      >
                        <p className="text-sm font-medium text-white/80">Choose your role and academic info</p>

                        <div className="space-y-3">
                          <FieldLabel>Role</FieldLabel>
                          <div className="flex flex-wrap gap-2">
                            {roles.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => handleInputChange("role", r.id)}
                                className={`inline-flex items-center gap-2 nb-chamfer border px-3.5 py-2 text-sm transition ${
                                  formData.role === r.id
                                    ? "border-red-500/70 bg-red-500/15 text-white"
                                    : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                <r.icon className="w-4 h-4 shrink-0" />
                                {r.name}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-white/45">
                            Unapproved roles default to <span className="text-red-300">student</span>.
                          </p>
                        </div>

                        {formData.role === "student" ? (
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
                            <p className="text-sm font-medium text-white/80">Student details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <label className="block min-w-0 sm:col-span-2">
                                <FieldLabel>Student ID</FieldLabel>
                                <Input
                                  icon={User2}
                                  type="text"
                                  placeholder="Your student ID"
                                  value={formData.studentId}
                                  onChange={(e) => handleInputChange("studentId", e.target.value)}
                                />
                              </label>
                              <label className="block min-w-0">
                                <FieldLabel>Department</FieldLabel>
                                <Select
                                  icon={Building}
                                  value={formData.department}
                                  onChange={(e) => handleInputChange("department", e.target.value)}
                                >
                                  <option value="">Select department</option>
                                  {departments.map((dept) => (
                                    <option key={dept} value={dept}>
                                      {dept}
                                    </option>
                                  ))}
                                </Select>
                              </label>
                              <label className="block min-w-0">
                                <FieldLabel>Year of study</FieldLabel>
                                <Select
                                  icon={Calendar}
                                  value={formData.yearOfStudy}
                                  onChange={(e) => handleInputChange("yearOfStudy", e.target.value)}
                                >
                                  <option value="">Select year</option>
                                  {[1, 2, 3, 4, 5].map((year) => (
                                    <option key={year} value={year}>
                                      Year {year}
                                    </option>
                                  ))}
                                </Select>
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/60">
                            No extra academic details needed for{" "}
                            <span className="text-white">{roles.find((r) => r.id === formData.role)?.name}</span>.
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
                  {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</div>}

                  <div className="flex gap-3">
                    {signupStep === 2 && (
                      <button
                        type="button"
                        onClick={goToPreviousSignupStep}
                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed transition font-semibold"
                    >
                      {signupStep === 1
                        ? "Continue"
                        : isSubmitting
                          ? "Creating Account..."
                          : "Create account"}
                    </button>
                  </div>

                  <div className="text-center text-sm text-white/60">
                    Already have an account?{" "}
                    <button type="button" onClick={() => setTab("signin")} className="text-white hover:underline">
                      Sign in
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
            </div>

            <div className="mt-6 text-[11px] text-white/40 text-center flex-shrink-0 pt-4 border-t border-white/10">
              Secure authentication powered by NewtonBotics Servers
            </div>
          </motion.div>
    </AuthPageShell>
  );
} 