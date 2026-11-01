"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { API_BASE_URL } from "@/lib/api";
import { dateParts, formatClock, sortUpcoming, titleCase } from "@/lib/labUi";
import SectionLabel from "@/components/lab/SectionLabel";
import throttleThrash from "@/app/assets/image01.png";

export default function HomeEvents() {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE_URL}/events?limit=30`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = data?.success ? data.data?.items || [] : [];
        if (alive) setEvents(sortUpcoming(list).slice(0, 3));
      })
      .catch(() => alive && setEvents([]));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="nb-container flex flex-col gap-10 pt-24 sm:pt-28" aria-labelledby="home-events">
      <SectionLabel index="04">Events &amp; workshops</SectionLabel>
      <div className="flex flex-wrap gap-8">
        <div className="flex min-w-0 flex-[3_1_560px] flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="home-events" className="nb-h2 m-0">
              Coming up.
            </h2>
            <Link href="/Events" className="nb-link text-[15px]">
              All events →
            </Link>
          </div>

          <div className="flex flex-col border-t border-line">
            {events === null &&
              [0, 1, 2].map((i) => <div key={i} className="h-[104px] animate-pulse border-b border-line bg-surface/40" />)}

            {events?.length === 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-8">
                <p className="m-0 text-[17px] text-ink-muted">
                  Nothing scheduled this week. New workshops are announced on Instagram first.
                </p>
                <a
                  href="https://www.instagram.com/newtonbotics_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nb-btn nb-btn-sm nb-btn-outline"
                >
                  Follow @newtonbotics_
                </a>
              </div>
            )}

            {events?.map((event) => {
              const { month, day } = dateParts(event.startDate);
              const meta = [titleCase(event.type), event.location, formatClock(event.startTime)]
                .filter(Boolean)
                .join(" · ");
              return (
                <Link
                  key={event._id}
                  href={`/Events/${event._id}`}
                  className="group flex flex-wrap items-center gap-6 border-b border-line py-6 text-ink no-underline"
                >
                  <span className="flex w-[72px] flex-col items-center rounded-md border border-line bg-surface py-2">
                    <span className="font-mono text-[11px] tracking-[0.08em] text-signal-text">{month}</span>
                    <span className="font-display text-[28px] font-semibold leading-tight">{day}</span>
                  </span>
                  <span className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
                    <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">{meta}</span>
                    <span className="font-display text-[22px] font-semibold group-hover:text-signal-text">
                      {event.title}
                    </span>
                  </span>
                  <span className="nb-btn nb-btn-sm nb-btn-outline h-11">
                    {event.requiresRegistration ? "Register" : "Details"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <figure className="nb-card m-0 flex min-w-0 flex-[2_1_340px] flex-col gap-3 p-3">
          <Image
            src={throttleThrash}
            alt="Students gathered around the Throttle Thrash RC race track on campus"
            className="h-[440px] w-full rounded object-cover object-[center_40%]"
            sizes="(max-width: 1024px) 100vw, 480px"
          />
          <figcaption className="px-1 pb-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">
            Fig. 02 — Throttle Thrash, last season
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
