"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import RemoteImage from "@/components/RemoteImage";
import { API_BASE_URL } from "@/lib/api";
import { combineDateTime, dateParts, formatClock, sortUpcoming, titleCase } from "@/lib/labUi";
import SectionLabel from "@/components/lab/SectionLabel";
import throttleThrash from "@/app/assets/image01.png";

const INSTAGRAM_URL = "https://www.instagram.com/newtonbotics_/";
const SHOW = 3;

// Most recent past events first (cancelled ones skipped)
function sortRecent(events, now = new Date()) {
  return events
    .map((e) => ({ e, start: combineDateTime(e.startDate, e.startTime) }))
    .filter(({ e, start }) => start && start < now && e.status !== "cancelled")
    .sort((a, b) => b.start - a.start)
    .map(({ e }) => e);
}

/**
 * Homepage events: the next few upcoming events, or — when nothing is scheduled — the most recent
 * ones, so the section never sits empty. The photo beside the list is the lead event's own image.
 */
export default function HomeEvents() {
  const [state, setState] = useState(null); // { mode: "upcoming" | "recent", events }

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE_URL}/events?limit=50`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = data?.success ? data.data?.items || [] : [];
        const upcoming = sortUpcoming(list).slice(0, SHOW);
        const next = upcoming.length
          ? { mode: "upcoming", events: upcoming }
          : { mode: "recent", events: sortRecent(list).slice(0, SHOW) };
        if (alive) setState(next);
      })
      .catch(() => alive && setState({ mode: "recent", events: [] }));
    return () => {
      alive = false;
    };
  }, []);

  const upcoming = state?.mode === "upcoming";
  const events = state?.events || [];
  // The photo shows the first listed event that has one
  const lead = events.find((e) => typeof e.imageUrl === "string" && /^https?:\/\//i.test(e.imageUrl));
  const leadImage = lead?.imageUrl || null;

  return (
    <section className="nb-container flex flex-col gap-10 pt-24 sm:pt-28" aria-labelledby="home-events">
      <SectionLabel index="04">Events &amp; workshops</SectionLabel>
      <div className="flex flex-wrap items-stretch gap-8">
        <div className="flex min-w-0 flex-[3_1_560px] flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-3">
              <h2 id="home-events" className="nb-h2 m-0">
                {state && !upcoming ? "Recently in the lab." : "Coming up."}
              </h2>
            </div>
            <Link href="/Events" className="nb-link text-[15px]">
              All events →
            </Link>
          </div>

          {/* Status callout: the key message when nothing is scheduled, so it can't be missed */}
          {state && !upcoming && (
            <div
              role="status"
              className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-lg border border-signal/40 bg-signal/10 px-5 py-4 shadow-[inset_3px_0_0_#FF5A1F] sm:px-6"
            >
              <span className="flex min-w-0 flex-[1_1_280px] items-start gap-3">
                <span aria-hidden="true" className="relative mt-1.5 flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inset-0 animate-ping rounded-full bg-signal opacity-60" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-signal" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="font-display text-lg font-semibold text-ink">Nothing scheduled right now</span>
                  <span className="text-sm leading-relaxed text-ink-muted">
                    New workshops are announced on Instagram first — follow so you don&apos;t miss the next one. Below
                    is what we ran last.
                  </span>
                </span>
              </span>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="nb-btn nb-btn-sm nb-btn-accent h-11 shrink-0"
              >
                Follow @newtonbotics_
              </a>
            </div>
          )}

          <div className="flex flex-col border-t border-line">
            {state === null &&
              [0, 1, 2].map((i) => <div key={i} className="h-[104px] animate-pulse border-b border-line bg-surface/40" />)}

            {state && events.length === 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-8">
                <p className="m-0 text-[17px] text-ink-muted">
                  No events yet. New workshops are announced on Instagram first.
                </p>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="nb-btn nb-btn-sm nb-btn-outline">
                  Follow @newtonbotics_
                </a>
              </div>
            )}

            {events.map((event) => {
              const { month, day } = dateParts(event.startDate);
              const meta = [titleCase(event.type), event.location, upcoming ? formatClock(event.startTime) : null]
                .filter(Boolean)
                .join(" · ");
              return (
                <Link
                  key={event._id}
                  href={`/Events/${event._id}`}
                  className="group flex items-center gap-4 border-b border-line py-5 text-ink no-underline sm:gap-6 sm:py-6"
                >
                  <span
                    className={`flex w-[64px] shrink-0 flex-col items-center rounded-md border py-2 sm:w-[72px] ${
                      upcoming ? "border-signal/40 bg-signal/10" : "border-line bg-surface"
                    }`}
                  >
                    <span className="font-mono text-[11px] tracking-[0.08em] text-signal-text">{month}</span>
                    <span className="font-display text-[24px] font-semibold leading-tight sm:text-[28px]">{day}</span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    {meta && <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">{meta}</span>}
                    <span className="font-display text-[20px] font-semibold leading-snug group-hover:text-signal-text sm:text-[22px]">
                      {event.title}
                    </span>
                  </span>
                  <span className="nb-btn nb-btn-sm nb-btn-outline hidden h-11 shrink-0 sm:inline-flex">
                    {upcoming ? (event.requiresRegistration ? "Register" : "Details") : "Recap"}
                  </span>
                  <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-ink-muted group-hover:text-signal-text sm:hidden" />
                </Link>
              );
            })}
          </div>
        </div>

        <figure className="nb-card m-0 flex min-h-[320px] min-w-0 flex-[2_1_340px] flex-col gap-3 p-3">
          <span className="relative block min-h-[260px] flex-1 overflow-hidden rounded">
            {leadImage ? (
              <RemoteImage
                src={leadImage}
                displayWidth={560}
                alt={lead.title || "NewtonBotics event"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Image
                src={throttleThrash}
                alt="Students gathered around the Throttle Thrash RC race track on campus"
                fill
                className="object-cover object-[center_40%]"
                sizes="(max-width: 1024px) 100vw, 480px"
              />
            )}
          </span>
          <figcaption className="px-1 pb-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">
            {leadImage
              ? `Fig. 02 — ${lead.title}${upcoming ? ", next up" : ", recently"}`
              : "Fig. 02 — Throttle Thrash, last season"}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
