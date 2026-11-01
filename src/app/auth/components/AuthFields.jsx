"use client";

import { useState } from "react";
import { Eye, EyeOff, Check, X, AlertCircle, CheckCircle2 } from "lucide-react";

export const PASSWORD_SPECIAL = /[!@#$%^&*()_\-.,?":{}|<>]/;

export function passwordRules(password) {
  return [
    { id: "length", short: "8+ chars", label: "At least 8 characters", met: password.length >= 8 },
    { id: "upper", short: "A–Z", label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { id: "lower", short: "a–z", label: "One lowercase letter", met: /[a-z]/.test(password) },
    { id: "number", short: "0–9", label: "One number", met: /[0-9]/.test(password) },
    { id: "special", short: "!@#", label: "One special character (!@#$%^&*…)", met: PASSWORD_SPECIAL.test(password) },
  ];
}

export function AuthHeading({ eyebrow, title, children }) {
  return (
    <header className="flex flex-col gap-2">
      {eyebrow && <span className="nb-eyebrow">{eyebrow}</span>}
      <h1 className="m-0 font-display text-[32px] font-semibold leading-tight tracking-[-0.02em]">{title}</h1>
      {children && <p className="m-0 text-[15px] leading-relaxed text-ink-muted">{children}</p>}
    </header>
  );
}

export function Field({ id, label, hint, optional, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="nb-label">
        {label}
        {optional && <span className="font-normal text-ink-muted"> (optional)</span>}
      </label>
      {children}
      {hint && <span className="text-[13px] text-ink-muted">{hint}</span>}
    </div>
  );
}

export function TextField({ id, label, hint, optional, invalid, ...props }) {
  return (
    <Field id={id} label={label} hint={hint} optional={optional}>
      <input
        id={id}
        aria-invalid={invalid || undefined}
        className={`nb-input ${invalid ? "border-[#B91C1C]" : ""}`}
        {...props}
      />
    </Field>
  );
}

export function SelectField({ id, label, hint, children, ...props }) {
  return (
    <Field id={id} label={label} hint={hint}>
      <select id={id} className="nb-input pr-8" {...props}>
        {children}
      </select>
    </Field>
  );
}

export function PasswordField({ id, label, hint, invalid, labelAction, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="nb-label">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          aria-invalid={invalid || undefined}
          className={`nb-input pr-12 ${invalid ? "border-[#B91C1C]" : ""}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-0.5 top-0.5 inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-muted hover:text-ink"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {hint && <span className="text-[13px] text-ink-muted">{hint}</span>}
    </div>
  );
}

/** Compact one-line password checklist: short tags that turn green as rules are met. */
export function PasswordChecklist({ id, rules }) {
  return (
    <ul id={id} aria-label="Password requirements" className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
      {rules.map((rule) => (
        <li
          key={rule.id}
          title={rule.label}
          className={`inline-flex h-7 items-center gap-1 rounded-full border px-2.5 font-mono text-xs transition-colors ${
            rule.met ? "border-[#BBDFC6] bg-[#E3F1E7] text-[#166534]" : "border-line-strong bg-surface text-ink-muted"
          }`}
        >
          {rule.met ? (
            <Check size={12} className="shrink-0" aria-hidden="true" />
          ) : (
            <X size={12} className="shrink-0 text-[#B91C1C]" aria-hidden="true" />
          )}
          <span aria-hidden="true">{rule.short || rule.label}</span>
          <span className="nb-sr-only">
            {rule.label}
            {rule.met ? " — done" : " — missing"}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Alert({ tone = "error", children }) {
  if (!children) return null;
  const styles =
    tone === "success"
      ? "border-[#BBDFC6] bg-[#E3F1E7] text-[#166534]"
      : "border-[#F3C4C4] bg-[#FBE4E4] text-[#991B1B]";
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm ${styles}`}>
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function SubmitButton({ children, loading, loadingText, className = "", ...props }) {
  return (
    <button type="submit" disabled={loading} className={`nb-btn nb-btn-primary h-[52px] w-full ${className}`} {...props}>
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
