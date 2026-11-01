"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { projectStatus } from "@/lib/labUi";
import SectionLabel from "@/components/lab/SectionLabel";
import RemoteImage from "@/components/RemoteImage";
import BlueprintPlaceholder from "@/components/lab/BlueprintPlaceholder";

const STATUS_ORDER = { ongoing: 0, upcoming: 1, completed: 2, on_hold: 3 };

function ProjectMedia({ project, className, displayWidth = 760 }) {
  const [failed, setFailed] = useState(false);
  if (!project.imageUrl || failed) return <BlueprintPlaceholder className={className} />;
  return (
    <RemoteImage
      src={project.imageUrl}
      displayWidth={displayWidth}
      alt={project.title}
      className={`block w-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

function StatusLine({ status }) {
  const s = projectStatus(status);
  return <span className={`nb-chip ${s.chip} self-start`}>{s.label}</span>;
}

export default function HomeProjects() {
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE_URL}/projects?limit=12`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = data?.success && Array.isArray(data.data?.projects) ? data.data.projects : [];
        list.sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
        if (alive) setProjects(list.slice(0, 3));
      })
      .catch(() => alive && setProjects([]));
    return () => {
      alive = false;
    };
  }, []);

  const [featured, ...rest] = projects || [];

  return (
    <section className="nb-container flex flex-col gap-10 pt-24 sm:pt-28" aria-labelledby="home-projects">
      <SectionLabel index="02">Projects</SectionLabel>
      <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
        <h2 id="home-projects" className="nb-h2 m-0 max-w-[680px]">
          Robots on the bench right now.
        </h2>
        <Link href="/Projects" className="nb-link text-[15px]">
          View all projects →
        </Link>
      </div>

      {projects === null ? (
        <div className="flex flex-wrap gap-4" aria-label="Loading projects">
          <div className="nb-card h-[520px] flex-[3_1_560px] animate-pulse" />
          <div className="flex flex-[2_1_360px] flex-col gap-4">
            <div className="nb-card h-[252px] animate-pulse" />
            <div className="nb-card h-[252px] animate-pulse" />
          </div>
        </div>
      ) : !featured ? (
        <div className="nb-card flex flex-wrap items-center justify-between gap-6 p-10">
          <p className="m-0 max-w-xl text-[17px] leading-relaxed text-ink-muted">
            New builds are being documented. Browse the archive or pitch the next one.
          </p>
          <Link href="/projectRequest" className="nb-btn nb-btn-primary">
            Pitch a project
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          <Link
            href={`/Projects/${featured._id}`}
            className="nb-card nb-card-hover flex min-w-0 flex-[3_1_560px] flex-col overflow-hidden text-ink no-underline"
          >
            <ProjectMedia project={featured} className="h-[300px] sm:h-[400px]" />
            <span className="flex flex-col gap-3 p-7">
              <span className="flex flex-wrap gap-2">
                <StatusLine status={featured.status} />
                {featured.category && <span className="nb-chip nb-chip-outline">{featured.category}</span>}
              </span>
              <span className="font-display text-[28px] font-semibold tracking-[-0.02em]">{featured.title}</span>
              <span className="line-clamp-3 max-w-[560px] text-base leading-relaxed text-ink-muted">
                {featured.description}
              </span>
            </span>
          </Link>
          {rest.length > 0 && (
            <div className="flex min-w-0 flex-[2_1_360px] flex-col gap-4">
              {rest.map((p) => (
                <Link
                  key={p._id}
                  href={`/Projects/${p._id}`}
                  className="nb-card nb-card-hover flex flex-1 flex-col overflow-hidden text-ink no-underline"
                >
                  <ProjectMedia project={p} className="h-[180px]" displayWidth={420} />
                  <span className="flex flex-col gap-2 px-6 py-5">
                    <StatusLine status={p.status} />
                    <span className="font-display text-xl font-semibold">{p.title}</span>
                    <span className="line-clamp-2 text-sm leading-normal text-ink-muted">{p.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
