"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import SectionLabel from "@/components/lab/SectionLabel";

const ICONS = [
  <svg key="h" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="20" cy="10" r="5" />
    <path d="M12 36V24l8-6 8 6v12M14 26h12" />
  </svg>,
  <svg key="ai" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <rect x="10" y="10" width="20" height="20" rx="3" />
    <path d="M16 4v6M24 4v6M16 30v6M24 30v6M4 16h6M4 24h6M30 16h6M30 24h6" />
    <circle cx="20" cy="20" r="3" fill="#FF5A1F" stroke="none" />
  </svg>,
  <svg key="sw" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="10" cy="10" r="4" />
    <circle cx="30" cy="10" r="4" />
    <circle cx="20" cy="30" r="4" />
    <path d="M14 10h12M12 14l6 12M28 14l-6 12" />
  </svg>,
  <svg key="cv" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M3 20s6-11 17-11 17 11 17 11-6 11-17 11S3 20 3 20z" />
    <circle cx="20" cy="20" r="5" />
    <path d="M20 4v3M20 33v3" />
  </svg>,
];

const FALLBACK_AREAS = [
  { name: "Humanoid robotics", description: "Human-like robots built for complex, real-world interaction." },
  { name: "AI & decision making", description: "Learning algorithms that let robots plan and act on their own." },
  { name: "Swarm systems", description: "Many simple robots coordinating on one shared task." },
  { name: "Computer vision", description: "Visual perception for autonomous navigation and object recognition." },
];

export default function HomeResearch() {
  const [areas, setAreas] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE_URL}/research-areas?isActive=true&isFeatured=true&limit=4`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (alive) setAreas(data?.success && data.data?.items?.length ? data.data.items : FALLBACK_AREAS);
      })
      .catch(() => alive && setAreas(FALLBACK_AREAS));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="nb-container flex flex-col gap-10 pt-24 sm:pt-28" aria-labelledby="home-research">
      <SectionLabel index="01">Research areas</SectionLabel>
      <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
        <h2 id="home-research" className="nb-h2 m-0 max-w-[680px]">
          Four directions we push on, every semester.
        </h2>
        <Link href="/research-areas" className="nb-link text-[15px]">
          All research areas →
        </Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {(areas || FALLBACK_AREAS).slice(0, 4).map((area, i) => (
          <Link
            key={area._id || area.name}
            href={area._id ? `/research-areas/${area._id}` : "/research-areas"}
            className={`nb-card nb-card-hover flex min-h-[260px] flex-col gap-4 p-7 text-ink no-underline ${
              areas ? "" : "animate-pulse"
            }`}
          >
            <span className="flex items-center justify-between">
              {ICONS[i % ICONS.length]}
              <span className="font-mono text-xs text-ink-subtle">{String(i + 1).padStart(2, "0")}</span>
            </span>
            <span className="mt-auto font-display text-[22px] font-semibold tracking-[-0.01em]">{area.name}</span>
            <span className="line-clamp-3 text-[15px] leading-relaxed text-ink-muted">{area.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
