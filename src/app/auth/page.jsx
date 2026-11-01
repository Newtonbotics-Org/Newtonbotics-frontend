"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import AuthPageShell from "./components/AuthPageShell";
import {
  Alert,
  AuthHeading,
  PasswordChecklist,
  PasswordField,
  SelectField,
  SubmitButton,
  TextField,
  passwordRules as buildPasswordRules,
} from "./components/AuthFields";
import {
  OTHER_ACADEMIC_YEAR,
  PASSING_YEARS,
  passingYearOptionLabel,
  passingYearToYearOfStudy,
} from "@/lib/academicYear";

const roles = [
  { id: "student", name: "Student", blurb: "Learning and building" },
  { id: "team_member", name: "Team member", blurb: "Core robotics team" },
  { id: "mentor", name: "Mentor", blurb: "Guiding and reviewing" },
  { id: "researcher", name: "Researcher", blurb: "AI & systems research" },
  { id: "community", name: "Community", blurb: "Helping the club" },
];

const departments = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Robotics Engineering",
  "Artificial Intelligence",
  "Data Science",
  "Other",
];

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "student",
  studentId: "",
  department: "",
  yearOfStudy: "",
  phone: "",
};

function StepIndicator({ step }) {
  const steps = ["Your details", "Role & academics"];
  return (
    <ol className="m-0 grid list-none grid-cols-2 gap-2 p-0" aria-label="Sign-up progress">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const current = step === n;
        return (
          <li key={label} className="flex flex-col gap-2" aria-current={current ? "step" : undefined}>
            <span className={`h-1 rounded-full ${done ? "bg-night-text" : current ? "bg-signal" : "bg-line"}`} />
            <span
              className={`font-mono text-[11px] uppercase tracking-[0.06em] ${
                current ? "text-signal-hover" : "text-ink-muted"
              }`}
            >
              Step {n} {done ? "· done" : current ? "· now" : ""}
            </span>
            <span className={`text-sm ${current || done ? "font-semibold text-ink" : "text-ink-muted"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function AuthPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const urlTab = searchParams.get("tab") === "signup" ? "signup" : "signin";
  const [tab, setTabState] = useState(urlTab);

  // Follow external navigation (e.g. the navbar's "Create an account" link).
  useEffect(() => {
    setTabState(urlTab);
  }, [urlTab]);

  const [signupStep, setSignupStep] = useState(1);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register, error: authError, clearError } = useAuth();

  // Switch locally and update the URL without a router navigation, so only the
  // form column re-renders and the left panel's animation keeps running.
  const setTab = (next) => {
    setTabState(next);
    window.history.replaceState(window.history.state, "", `${pathname}?tab=${next}`);
  };

  useEffect(() => {
    setMessage("");
    setError("");
    clearError();
    setSignupStep(1);
  }, [tab, clearError]);

  useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);

  const isValidEmail = useMemo(() => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(formData.email), [formData.email]);
  const passwordRules = useMemo(() => buildPasswordRules(formData.password), [formData.password]);
  const isValidPassword = passwordRules.every((rule) => rule.met);
  const passwordsMatch = formData.password === formData.confirmPassword;
  const showPasswordHints = formData.password.length > 0;
  const showPasswordMismatch = formData.confirmPassword.length > 0 && !passwordsMatch;

  const isValidPhone = useMemo(() => {
    const phone = formData.phone.trim();
    const digitsOnly = phone.replace(/\D/g, "");
    return (
      /^[6-9]\d{9}$/.test(digitsOnly) || // 7541062514
      /^0[6-9]\d{9}$/.test(digitsOnly) || // 07541062514
      /^91[6-9]\d{9}$/.test(digitsOnly) // +91 or 917541062514
    );
  }, [formData.phone]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    if (!passwordsMatch) {
      setError("Passwords do not match");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (!isValidPhone) {
      setError("Please enter a valid 10-digit mobile number (or use 0, +91, or 91 prefix)");
      return false;
    }
    return true;
  };

  const validateSignupStep2 = () => {
    if (formData.role !== "student") return true;
    if (!formData.studentId.trim()) {
      setError("Student ID is required for students");
      return false;
    }
    if (!formData.department) {
      setError("Department is required for students");
      return false;
    }
    if (!formData.yearOfStudy) {
      setError("Academic year is required for students");
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateSignupStep1() || !validateSignupStep2()) return;
    setIsSubmitting(true);
    setError("");
    try {
      const derivedYearOfStudy =
        formData.role === "student" && formData.yearOfStudy !== OTHER_ACADEMIC_YEAR
          ? passingYearToYearOfStudy(formData.yearOfStudy)
          : null;

      const userData = {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
        ...(formData.role === "student" && {
          studentId: formData.studentId.trim(),
          department: formData.department,
          ...(derivedYearOfStudy ? { yearOfStudy: derivedYearOfStudy } : {}),
        }),
        // Validated above as an Indian mobile; send it as +91XXXXXXXXXX, the format the API accepts
        phone: `+91${formData.phone.replace(/\D/g, "").slice(-10)}`,
      };

      const result = await register(userData);
      if (result.success) {
        if (result.roleNotice) {
          const { requestedRole, assignedRole, message: noticeMsg } = result.roleNotice;
          setMessage(
            noticeMsg || `Requested role '${requestedRole}' is not pre-approved. Registered as '${assignedRole}'.`
          );
        } else {
          setMessage("Account created. Taking you in…");
        }
      } else if (result.code === 409) {
        setError("An account with this email already exists.");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setError("");
    if (!isValidEmail) {
      setError("Please enter a valid email address");
      return;
    }
    if (!formData.password) {
      setError("Please enter your password");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await login({ email: formData.email.trim(), password: formData.password });
      if (result.success) {
        setMessage("Welcome back. Taking you in…");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (signupStep === 1) {
      if (validateSignupStep1()) setSignupStep(2);
      return;
    }
    handleSignup();
  };

  return (
    <AuthPageShell width={tab === "signup" ? "max-w-[520px]" : "max-w-[420px]"}>
      <div role="tablist" aria-label="Account" className="flex rounded-lg bg-[#E6E7E1] p-1">
        {[
          ["signin", "Sign in"],
          ["signup", "Create account"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`h-10 flex-1 rounded-md text-sm transition-colors ${
              tab === id
                ? "bg-surface font-semibold text-ink shadow-[0_1px_2px_rgba(14,16,19,0.08)]"
                : "font-medium text-ink-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "signin" ? (
        <>
          <AuthHeading title="Welcome back">Sign in with your university email.</AuthHeading>
          <form onSubmit={handleSignin} className="flex flex-col gap-5" noValidate>
            <TextField
              id="signin-email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@nst.rishihood.edu.in"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
            <PasswordField
              id="signin-password"
              label="Password"
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              labelAction={
                <Link href="/auth/forgot" className="nb-link text-[13px] font-medium">
                  Forgot password?
                </Link>
              }
            />
            <Alert>{error}</Alert>
            <Alert tone="success">{message}</Alert>
            <SubmitButton loading={isSubmitting} loadingText="Signing in…">
              Sign in
            </SubmitButton>
          </form>
          <p className="m-0 text-center text-sm text-ink-muted">
            New to the lab?{" "}
            <button type="button" onClick={() => setTab("signup")} className="nb-link">
              Create an account
            </button>
          </p>
        </>
      ) : (
        <>
          <AuthHeading title="Join the lab">
            No experience needed. Two quick steps and you&apos;re in.
          </AuthHeading>
          <StepIndicator step={signupStep} />

          <form onSubmit={handleSignupSubmit} className="flex flex-col gap-5" noValidate>
            {signupStep === 1 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    id="signup-first"
                    label="First name"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                  />
                  <TextField
                    id="signup-last"
                    label="Last name"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                  />
                </div>
                <TextField
                  id="signup-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@nst.rishihood.edu.in"
                  hint="Use your university email to get member access."
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <PasswordField
                    id="signup-password"
                    label="Password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    invalid={showPasswordHints && !isValidPassword}
                    aria-describedby="signup-password-rules"
                  />
                  <PasswordField
                    id="signup-confirm"
                    label="Confirm password"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    invalid={showPasswordMismatch}
                    hint={showPasswordMismatch ? "Passwords do not match" : undefined}
                  />
                </div>
                {showPasswordHints && <PasswordChecklist id="signup-password-rules" rules={passwordRules} />}
                <TextField
                  id="signup-phone"
                  label="Phone"
                  required
                  type="tel"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </>
            ) : (
              <>
                <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
                  <legend className="nb-label mb-3">I&apos;m joining as</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {roles.map((r) => {
                      const selected = formData.role === r.id;
                      return (
                        <label
                          key={r.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                            selected ? "border-ink bg-surface shadow-[inset_3px_0_0_#FF5A1F]" : "border-line-strong bg-surface hover:border-ink"
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={r.id}
                            checked={selected}
                            onChange={() => handleInputChange("role", r.id)}
                            className="mt-1 h-4 w-4 accent-ink"
                          />
                          <span className="flex flex-col">
                            <span className="text-sm font-semibold">{r.name}</span>
                            <span className="text-[13px] text-ink-muted">{r.blurb}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <span className="text-[13px] text-ink-muted">
                    Roles other than student need approval. Until then you&apos;ll be registered as a student.
                  </span>
                </fieldset>

                {formData.role === "student" ? (
                  <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4">
                    <span className="nb-eyebrow">Student details</span>
                    <TextField
                      id="signup-student-id"
                      label="Student ID"
                      value={formData.studentId}
                      onChange={(e) => handleInputChange("studentId", e.target.value)}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SelectField
                        id="signup-department"
                        label="Department"
                        value={formData.department}
                        onChange={(e) => handleInputChange("department", e.target.value)}
                      >
                        <option value="">Select department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </SelectField>
                      <SelectField
                        id="signup-year"
                        label="Academic year"
                        value={formData.yearOfStudy}
                        onChange={(e) => handleInputChange("yearOfStudy", e.target.value)}
                      >
                        <option value="">Select passing year</option>
                        {PASSING_YEARS.map((year) => (
                          <option key={year} value={year}>
                            {passingYearOptionLabel(year)}
                          </option>
                        ))}
                        <option value={OTHER_ACADEMIC_YEAR}>Other (other branch / programme)</option>
                      </SelectField>
                    </div>
                  </div>
                ) : (
                  <p className="m-0 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
                    No academic details needed for{" "}
                    <strong className="text-ink">{roles.find((r) => r.id === formData.role)?.name}</strong>.
                  </p>
                )}
              </>
            )}

            <Alert>{error}</Alert>
            <Alert tone="success">{message}</Alert>

            <div className="flex gap-3">
              {signupStep === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSignupStep(1);
                  }}
                  className="nb-btn nb-btn-secondary h-[52px]"
                >
                  <ArrowLeft size={16} aria-hidden="true" /> Back
                </button>
              )}
              <SubmitButton loading={isSubmitting} loadingText="Creating account…" className="flex-1">
                {signupStep === 1 ? (
                  <>
                    Continue <ArrowRight size={16} aria-hidden="true" />
                  </>
                ) : (
                  "Create account"
                )}
              </SubmitButton>
            </div>
          </form>
          <p className="m-0 text-center text-sm text-ink-muted">
            Already a member?{" "}
            <button type="button" onClick={() => setTab("signin")} className="nb-link">
              Sign in
            </button>
          </p>
        </>
      )}
    </AuthPageShell>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageShell>{null}</AuthPageShell>}>
      <AuthPageContent />
    </Suspense>
  );
}
