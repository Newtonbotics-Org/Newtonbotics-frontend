"use client";

import React from "react";
import { Mail, AlertCircle, CheckCircle2, Info, ArrowUpRight } from "lucide-react";
import clubData from "../AllDatas/data.json";
import { getContactCategories } from "../../lib/contact";
import { useContactForm } from "../../hooks/useContactForm";

const CLUB_EMAIL = "newtonbotics.club@rishihood.edu.in";

function Alert({ tone = "error", children }) {
  if (!children) return null;
  const styles =
    tone === "success"
      ? "border-[#BBDFC6] bg-[#E3F1E7] text-[#166534]"
      : "border-[#F3C4C4] bg-[#FBE4E4] text-[#991B1B]";
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm break-words ${styles}`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}

function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <span id={id} className="text-[13px] text-[#B91C1C]">
      {children}
    </span>
  );
}

const invalidBorder = (bad) => (bad ? "border-[#B91C1C]" : "");

export default function ContactPageClient({ coreMembers = [] }) {
  const {
    formData,
    errors,
    isSubmitting,
    submitted,
    submitError,
    handleInputChange,
    handleSubmit,
  } = useContactForm();

  const availableCategories = getContactCategories();
  const social = clubData?.contactInfo?.socialMedia || {};

  return (
    <main className="nb-dark bg-paper text-ink">
      <div className="nb-container flex flex-wrap items-start gap-x-16 gap-y-12 pb-28 pt-16 sm:pt-20">
        {/* Left column: intro, details, core members */}
        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-8">
          <div className="flex flex-col gap-5">
            <span className="nb-eyebrow">
              <span className="nb-eyebrow-num">[10]</span> Contact
            </span>
            <h1 className="nb-h1 m-0">Say hello to the lab.</h1>
            <p className="m-0 text-lg leading-relaxed text-ink-muted">
              Workshops, projects, collaborations or general queries — we typically respond within 24–48 hours.
            </p>
          </div>

          <dl className="m-0 flex flex-col border-t border-ink">
            <div className="flex flex-col gap-1.5 border-b border-line py-5">
              <dt className="font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">Email</dt>
              <dd className="m-0 text-lg font-semibold">
                <a href={`mailto:${CLUB_EMAIL}`} className="nb-link break-all">
                  {CLUB_EMAIL}
                </a>
              </dd>
            </div>
            <div className="flex flex-col gap-1.5 border-b border-line py-5">
              <dt className="font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">Lab</dt>
              <dd className="m-0 text-lg font-semibold">
                Academic Block, Room 407
                <br />
                <span className="text-base font-normal text-ink-muted">Rishihood University</span>
              </dd>
            </div>
            {(social.instagram || social.linkedin) && (
              <div className="flex flex-col gap-1.5 border-b border-line py-5">
                <dt className="font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">Social</dt>
                <dd className="m-0 flex flex-wrap gap-x-5 text-lg font-semibold">
                  {social.instagram && (
                    <a
                      href={`https://www.instagram.com/${social.instagram.replace("@", "")}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nb-link inline-flex min-h-[44px] items-center gap-1"
                    >
                      Instagram <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  )}
                  {social.linkedin && (
                    <a
                      href={`https://linkedin.com/company/${social.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nb-link inline-flex min-h-[44px] items-center gap-1"
                    >
                      LinkedIn <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  )}
                </dd>
              </div>
            )}
          </dl>

          <section aria-labelledby="core-members" className="flex flex-col gap-4">
            <h2
              id="core-members"
              className="m-0 flex items-center gap-3 font-mono text-xs font-normal uppercase tracking-[0.08em] text-ink-muted"
            >
              <span>Core members</span>
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
            </h2>
            {coreMembers.length === 0 ? (
              <p className="m-0 text-sm text-ink-muted">
                Leadership team information is not available right now. Please use the club email above.
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {coreMembers.map((member) => (
                  <li
                    key={member.id}
                    className="nb-card flex items-center gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate font-semibold">{member.name}</p>
                      {member.role && (
                        <p className="m-0 truncate font-mono text-xs uppercase tracking-[0.04em] text-signal-text">
                          {member.role}
                        </p>
                      )}
                    </div>
                    {member.email ? (
                      <a
                        href={`mailto:${member.email}`}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line text-ink hover:border-ink"
                        aria-label={`Email ${member.name}`}
                      >
                        <Mail size={16} aria-hidden="true" />
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right column: form */}
        <form
          onSubmit={handleSubmit}
          className="nb-card flex min-w-0 flex-[1_1_520px] flex-col gap-6 p-6 sm:p-10"
        >
          <div className="flex flex-col gap-1">
            <h2 className="m-0 font-display text-2xl font-semibold tracking-[-0.01em]">Send a message</h2>
            <p className="m-0 text-sm text-ink-muted">All fields are required unless marked optional.</p>
          </div>

          {submitted && (
            <Alert tone="success">
              Thank you! Your message has been sent. Our team will get back to you within 24–48 hours.
            </Alert>
          )}
          {submitError && <Alert>{submitError}</Alert>}
          {errors.general && <Alert>{errors.general}</Alert>}

          <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
            <legend className="nb-label mb-3">What&apos;s this about?</legend>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => {
                const checked = formData.category === category;
                return (
                  <label
                    key={category}
                    className={`nb-pill h-10 cursor-pointer px-3.5 text-sm focus-within:ring-[3px] focus-within:ring-signal/35 ${
                      checked ? "nb-pill-active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category}
                      checked={checked}
                      onChange={handleInputChange}
                      className="nb-sr-only"
                    />
                    {category}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="name" className="nb-label">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                autoComplete="name"
                value={formData.name}
                onChange={handleInputChange}
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? "name-error" : undefined}
                className={`nb-input ${invalidBorder(errors.name)}`}
              />
              <FieldError id="name-error">{errors.name}</FieldError>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="email" className="nb-label">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`nb-input ${invalidBorder(errors.email)}`}
              />
              <FieldError id="email-error">{errors.email}</FieldError>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="subject" className="nb-label">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                id="subject"
                required
                value={formData.subject}
                onChange={handleInputChange}
                aria-invalid={errors.subject ? "true" : "false"}
                aria-describedby={errors.subject ? "subject-error" : undefined}
                className={`nb-input ${invalidBorder(errors.subject)}`}
              />
              <FieldError id="subject-error">{errors.subject}</FieldError>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="phone" className="nb-label">
                Phone <span className="font-normal text-ink-muted">(optional)</span>
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleInputChange}
                aria-invalid={errors.phone ? "true" : "false"}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className={`nb-input ${invalidBorder(errors.phone)}`}
              />
              <FieldError id="phone-error">{errors.phone}</FieldError>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="message" className="nb-label">
              Message
            </label>
            <textarea
              name="message"
              id="message"
              rows={6}
              required
              value={formData.message}
              onChange={handleInputChange}
              maxLength={1000}
              aria-invalid={errors.message ? "true" : "false"}
              aria-describedby="message-meta"
              className={`nb-textarea resize-y ${invalidBorder(errors.message)}`}
            />
            <div id="message-meta" className="flex items-start justify-between gap-3">
              <FieldError>{errors.message}</FieldError>
              <span className="ml-auto font-mono text-xs text-ink-muted">{formData.message.length}/1000</span>
            </div>
            <input
              type="text"
              name="honeypot"
              value={formData.honeypot}
              onChange={handleInputChange}
              className="hidden"
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>

          <div className="flex items-start gap-2 rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink-muted">
            <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>This message will be visible to all core team members.</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-[13px] text-ink-muted">We only use your details to reply.</span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="nb-btn nb-btn-accent h-[52px] px-6"
            >
              {isSubmitting ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink"
                    aria-hidden="true"
                  />
                  Sending…
                </>
              ) : (
                "Send message"
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
