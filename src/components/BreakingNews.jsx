"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { newsService } from "@/lib/news";

const FIRST_SHOW_MS = 1200;
const VISIBLE_MS = 5000; // each pop stays this long (longer while hovered or focused)
const HIDDEN_MS = 5000; // gap before the next pop
const RECENT_DAYS = 30;
const DISMISS_KEY = "nb-breaking-dismissed-at";
const DISMISS_FOR_MS = 12 * 60 * 60 * 1000;
// Shown when there is no news to break
const WELCOME = { _id: "welcome", welcome: true };

/**
 * Vertical breaking-news tab docked to the middle of the right edge. It pops in for 5s, tucks away for
 * 5s, and repeats, showing the next story on each pop. Stories are the ones an admin ticked "Show in
 * Navigation" (in nav order); if none are ticked, the newest from the last 30 days; with no news at all it
 * just keeps showing "Welcome to NewtonBotics". Hovering or focusing keeps it open; closing it hides it
 * for 12 hours.
 */
export default function BreakingNews() {
  const pathname = usePathname();
  const [stories, setStories] = useState([]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const shownOnce = useRef(false);

  useEffect(() => {
    try {
      if (Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < DISMISS_FOR_MS) {
        setDismissed(true);
        return;
      }
    } catch {}
    let alive = true;
    (async () => {
      let { items = [] } = await newsService.listNews({ showInNav: true, limit: 5 });
      if (!items.length) {
        const latest = await newsService.listNews({ limit: 3 });
        const cutoff = Date.now() - RECENT_DAYS * 864e5;
        items = (latest.items || []).filter((n) => new Date(n.publishedAt || n.createdAt).getTime() >= cutoff);
      }
      if (alive) setStories(items.length ? items : [WELCOME]);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Pop in → stay 5s → tuck away → wait 5s → pop in with the next story → …
  useEffect(() => {
    if (!stories.length || dismissed) return;
    if (open) {
      if (paused) return;
      const t = setTimeout(() => setOpen(false), VISIBLE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => {
        if (shownOnce.current) setIndex((i) => (i + 1) % stories.length);
        shownOnce.current = true;
        setOpen(true);
      },
      shownOnce.current ? HIDDEN_MS : FIRST_SHOW_MS,
    );
    return () => clearTimeout(t);
  }, [open, paused, dismissed, stories.length]);

  const dismiss = () => {
    setOpen(false);
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  if (!stories.length || pathname?.startsWith("/auth")) return null;
  const story = stories[index];
  const label = story.welcome ? "Welcome to NewtonBotics" : story.title;

  return (
    <aside
      aria-label={story.welcome ? "Welcome" : "Breaking news"}
      aria-hidden={!open}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`fixed right-0 top-1/2 z-[90] -translate-y-1/2 transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none ${
        open ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-[calc(100%+24px)] opacity-0"
      }`}
    >
      {/* Vertical tab docked to the right edge: label on top, the headline reading upwards, arrow at its start */}
      <Link
        href={story.welcome ? "/aboutus" : `/News/${story._id}`}
        title={label}
        tabIndex={open ? 0 : -1}
        className="group flex w-12 flex-col items-center gap-3 rounded-l-2xl border border-r-0 border-night-line-strong bg-night-raised px-2 pb-4 pt-3.5 text-night-text no-underline shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-[padding,border-color] duration-300 hover:border-signal/60 hover:pr-4 sm:w-14"
      >
        <span className="flex flex-col items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-signal" aria-hidden="true" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-signal-light sm:text-[11px]">
            {story.welcome ? "Hi" : "New"}
          </span>
        </span>
        {/* Outer span carries the per-story slide animation; the inner one is rotated to read bottom-to-top */}
        <span key={story._id} className="nb-breaking-slide">
          <span className="flex max-h-[min(300px,52vh)] rotate-180 items-center gap-2.5 overflow-hidden text-[12px] font-semibold uppercase tracking-[0.14em] [writing-mode:vertical-rl] group-hover:text-signal-light sm:text-[13px]">
            <ArrowRight size={16} aria-hidden="true" className="shrink-0 rotate-90 text-signal" />
            <span className="truncate">{label}</span>
          </span>
        </span>
        {stories.length > 1 && (
          <span className="flex flex-col gap-1" aria-hidden="true">
            {stories.map((n, i) => (
              <span key={n._id} className={`w-1 rounded-full transition-all ${i === index ? "h-3 bg-signal" : "h-1 bg-night-line-strong"}`} />
            ))}
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={dismiss}
        tabIndex={open ? 0 : -1}
        aria-label={story.welcome ? "Close welcome" : "Close breaking news"}
        className="absolute -left-3.5 -top-3.5 grid h-8 w-8 place-items-center rounded-full border border-night-line-strong bg-night-raised text-night-muted shadow-[0_4px_14px_rgba(0,0,0,0.4)] transition-colors hover:text-night-text"
      >
        <X size={15} aria-hidden="true" />
      </button>
    </aside>
  );
}
