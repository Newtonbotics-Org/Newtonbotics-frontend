"use client";
import { useState } from "react";
import Link from "next/link";
import { Instagram, Linkedin } from "lucide-react";
import clubData from "../AllDatas/data.json";
import { subscribeToNewsletter } from "@/lib/newsletter";

const instagramHandle = clubData?.contactInfo?.socialMedia?.instagram?.replace("@", "") || "newtonbotics_";
const linkedinHandle = clubData?.contactInfo?.socialMedia?.linkedin || "newtonbotics";
const contactEmail = clubData?.contactInfo?.email || "newtonbotics.club@rishihood.edu.in";

const EXPLORE_LINKS = [
  { href: "/Projects", label: "Projects" },
  { href: "/research-areas", label: "Research areas" },
  { href: "/Events", label: "Events & workshops" },
  { href: "/News", label: "News" },
  { href: "/Gallery", label: "Gallery" },
];

const LAB_LINKS = [
  { href: "/aboutus", label: "About" },
  { href: "/ourTeam", label: "Team" },
  { href: "/projectRequest", label: "Pitch a project" },
  { href: "/contact", label: "Contact" },
];

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: "loading", message: "" });
    try {
      await subscribeToNewsletter({ email: email.trim() });
      setEmail("");
      setStatus({ state: "success", message: "You're subscribed. Watch your inbox." });
    } catch (error) {
      setStatus({ state: "error", message: error.message || "Could not subscribe. Try again." });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2" noValidate>
      <label htmlFor="nb-footer-newsletter" className="font-mono text-[11px] uppercase tracking-[0.08em] text-night-muted">
        Lab newsletter
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="nb-footer-newsletter"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@university.edu"
          autoComplete="email"
          className="h-11 min-w-0 flex-[1_1_200px] rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-night-text placeholder:text-night-muted/70 focus:border-signal/70 focus:outline-none focus:ring-[3px] focus:ring-signal/25"
        />
        <button
          type="submit"
          disabled={status.state === "loading"}
          className="nb-btn nb-btn-accent h-11 rounded-xl px-4 text-sm shadow-[0_0_24px_rgba(255,90,31,0.3)]"
        >
          {status.state === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      <p
        role="status"
        className={`min-h-[1.25rem] text-[13px] ${
          status.state === "error" ? "text-[#F87171]" : "text-night-muted"
        }`}
      >
        {status.message}
      </p>
    </form>
  );
}

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const linkClass = "nb-underline self-start text-[15px] text-night-soft hover:text-signal-light";
  const headingClass = "font-mono text-[11px] uppercase tracking-[0.08em] text-night-muted";

  return (
    <footer className="relative z-10 isolate overflow-hidden bg-night text-night-text">
      {/* A lit hairline along the top edge */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/60 to-transparent" />
      <div className="nb-container flex flex-col gap-12 pb-8 pt-16 sm:pt-20">
        <div className="nb-glass-panel flex flex-wrap justify-between gap-12 rounded-3xl p-8 sm:p-10">
          <div className="flex max-w-[420px] flex-[1_1_340px] flex-col gap-5">
            <Link href="/" aria-label="NewtonBotics home" className="self-start">
              {/* eslint-disable-next-line @next/next/no-img-element -- small static logo, sized explicitly */}
              <img
                src="/brand/newtonbotics-logo-red.webp"
                alt="NewtonBotics"
                width={420}
                height={111}
                loading="lazy"
                className="block h-10 w-auto sm:h-11"
              />
            </Link>
            <p className="m-0 text-[15px] leading-relaxed text-night-muted">
              The student robotics lab at Newton School of Technology, Rishihood University.
              Building the future, one robot at a time.
            </p>
            <NewsletterForm />
          </div>

          <div className="flex flex-wrap gap-x-16 gap-y-12">
            <nav aria-label="Explore" className="flex min-w-[120px] flex-col gap-3">
              <span className={headingClass}>Explore</span>
              {EXPLORE_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <nav aria-label="Lab" className="flex min-w-[120px] flex-col gap-3">
              <span className={headingClass}>Lab</span>
              {LAB_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="flex min-w-[200px] flex-col gap-3">
              <span className={headingClass}>Find us</span>
              <span className="text-[15px] leading-relaxed">
                Academic Block, Room 407
                <br />
                Rishihood University
              </span>
              <a href={`mailto:${contactEmail}`} className="nb-underline nb-arrow self-start text-[15px] font-medium text-signal-light">
                {contactEmail}
              </a>
              <div className="mt-1 flex gap-2">
                <a
                  href={`https://www.instagram.com/${instagramHandle}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="NewtonBotics on Instagram"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-night-text transition-colors hover:border-signal hover:text-signal-light"
                >
                  <Instagram size={18} aria-hidden="true" />
                </a>
                <a
                  href={`https://www.linkedin.com/company/${linkedinHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="NewtonBotics on LinkedIn"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-night-text transition-colors hover:border-signal hover:text-signal-light"
                >
                  <Linkedin size={18} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Wordmark: faded fill, a faint outline, and orange light segments running round every letter */}
        <svg aria-hidden="true" viewBox="0 0 1000 104" className="block h-auto w-full select-none font-display font-bold">
          <defs>
            <linearGradient id="nb-wordmark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.13" />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="nb-wordmark-trace" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#FF5A1F" />
              <stop offset="0.5" stopColor="#FFA27A" />
              <stop offset="1" stopColor="#FF5A1F" />
            </linearGradient>
          </defs>
          {[
            ["url(#nb-wordmark-fill)", "rgba(255,255,255,0.08)", ""],
            ["none", "url(#nb-wordmark-trace)", "nb-wordmark-trace"],
          ].map(([fill, stroke, cls]) => (
            <text
              key={cls || "base"}
              x="4"
              y="96"
              textLength="992"
              lengthAdjust="spacing"
              fontSize="124"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.2"
              strokeLinejoin="round"
              className={cls}
            >
              NEWTONBOTICS
            </text>
          ))}
        </svg>

        <div className="flex flex-wrap justify-between gap-x-6 gap-y-3 border-t border-white/10 pt-5 font-mono text-xs text-night-muted">
          <span>© {currentYear} NewtonBotics Robotics Lab · Est. 2024</span>
          <span>
            Developed by{" "}
            <a
              href="https://monurajj.monadnocks.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="nb-underline nb-arrow text-night-text hover:text-signal-light"
            >
              Monu
            </a>{" "}
            under{" "}
            <a
              href="https://monadnocks.in"
              target="_blank"
              rel="noopener noreferrer"
              className="nb-underline nb-arrow text-night-text hover:text-signal-light"
            >
              Monadnocks
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
