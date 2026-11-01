"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FolderKanban, Search } from "lucide-react";
import { listInventoryProjects } from "@/lib/inventoryProjects";
import { CardSkeletonGrid } from "@/components/PageSkeletons";
import { projectStatus } from "@/lib/labUi";
import { EmptyState, MONO_META } from "./InventoryUi";

const projectGroups = [
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" },
  { key: "other", label: "Other" },
];

function projectGroupForStatus(status) {
  if (status === "ongoing" || status === "completed") return status;
  return "other";
}

export default function ProjectInventories() {
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ongoing");
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(async () => {
      try {
        const data = await listInventoryProjects({ q: query, signal: controller.signal });
        if (!controller.signal.aborted) { setProjects(data.projects); setPagination(data.pagination); }
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, retry]);

  const groupedProjects = projects.filter((project) => projectGroupForStatus(project.status) === selectedGroup);

  return (
    <section aria-labelledby="projects-title" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 id="projects-title" className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Project inventories</h2>
        <p className="m-0 text-ink-muted">Every project gets its own stock. Browse projects from the club directory and open their inventory workspace.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {!loading && !error && projects.length > 0 ? (
          <div role="group" aria-label="Project status" className="flex flex-wrap gap-2">
            {projectGroups.map((group) => {
              const count = projects.filter((project) => projectGroupForStatus(project.status) === group.key).length;
              const active = selectedGroup === group.key;
              return (
                <button
                  key={group.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedGroup(group.key)}
                  className={`nb-pill h-10 px-4 text-sm ${active ? "nb-pill-active" : ""}`}
                >
                  {group.label} <span className="font-mono text-[11px] opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        ) : <span />}
        <div className="relative min-w-0 flex-[0_1_360px]">
          <label htmlFor="project-inventory-search" className="nb-sr-only">Search projects</label>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            id="project-inventory-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="nb-input h-11 pl-10 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <CardSkeletonGrid count={3} variant="project" />
      ) : error ? (
        <EmptyState
          role="alert"
          title="Projects couldn't be loaded"
          action={<button type="button" className="nb-btn nb-btn-primary" onClick={() => setRetry((n) => n + 1)}>Try again</button>}
        >
          {error}
        </EmptyState>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={query ? "No matching projects" : "No projects available"}
          action={query && <button type="button" className="nb-btn nb-btn-secondary" onClick={() => setQuery("")}>Clear search</button>}
        >
          {query ? "Try a different project name." : "Projects will appear here when they are available in the club directory."}
        </EmptyState>
      ) : (
        <>
          <p className={`m-0 ${MONO_META}`} aria-live="polite">
            {groupedProjects.length} {selectedGroup} projects
            {pagination?.hasMore || pagination?.total > projects.length ? " · Showing up to 100 matches. Refine your search to find another project." : ""}
          </p>
          {groupedProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title={`No ${selectedGroup} projects`}
              action={query && <button type="button" className="nb-btn nb-btn-secondary" onClick={() => setQuery("")}>Clear search</button>}
            >
              {query ? "Try a different project name." : "Projects in this status will appear here when available."}
            </EmptyState>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
              {groupedProjects.map((project) => {
                const id = project._id || project.id;
                const status = projectStatus(project.status);
                return (
                  <article key={id} className="nb-card nb-card-hover flex flex-col gap-4 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className={MONO_META}>{project.category || "Robotics project"}</span>
                      <span className={`nb-chip ${status.chip}`}>{status.label}</span>
                    </div>
                    <h3 className="m-0 font-display text-xl font-semibold tracking-[-0.01em]">{project.title || "Untitled project"}</h3>
                    <p className="m-0 line-clamp-3 text-sm text-ink-muted">
                      {project.description || "Open this project's workspace to view inventory availability."}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
                      <span className={MONO_META}>Project-owned stock</span>
                      {id && (
                        <Link
                          className="nb-link inline-flex min-h-[44px] items-center gap-1 text-sm"
                          href={`/Inventory/projects/${encodeURIComponent(id)}`}
                          aria-label={`Open inventory workspace: ${project.title || "Untitled project"}`}
                        >
                          Open workspace <ArrowUpRight size={16} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
