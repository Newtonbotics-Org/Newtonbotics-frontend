"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Search, Star, X } from "lucide-react";
import RemoteImage from "@/components/RemoteImage";
import BlueprintPlaceholder from "@/components/lab/BlueprintPlaceholder";
import EmptyLog from "@/components/lab/EmptyLog";
import { API_BASE_URL, apiRequest } from "@/lib/api";
import { formatDate, projectStatus } from "@/lib/labUi";
import NoMatchCard from "@/components/lab/NoMatchCard";

const PROJECT_STATUSES = ["ongoing", "upcoming", "completed", "on_hold"];
const STATUS_ORDER = { ongoing: 0, upcoming: 1, completed: 2, on_hold: 3 };

const calculateProgress = (milestones) => {
  if (!milestones || milestones.length === 0) return 0;
  const completed = milestones.filter((m) => m.status === "completed").length;
  return Math.round((completed / milestones.length) * 100);
};

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [pagination, setPagination] = useState({ total: 0 });
  const debouncedQuery = useDebounced(searchQuery.trim());

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (showFeaturedOnly) params.append("isFeatured", "true");
      if (debouncedQuery) params.append("q", debouncedQuery);
      params.append("limit", "100");

      const res = await apiRequest(`${API_BASE_URL}/projects?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data?.projects)) {
        throw new Error(data.message || "The project list response is incomplete.");
      }
      setProjects(data.data.projects);
      setPagination(data.data.pagination || {});
      // The unfiltered response doubles as the source for category options and status counts.
      if (!params.has("status") && !params.has("category") && !params.has("isFeatured") && !params.has("q")) {
        setAllProjects(data.data.projects);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setProjects([]);
      setError(err.message || "Projects could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedCategory, showFeaturedOnly, debouncedQuery]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const categories = useMemo(
    () => [...new Set(allProjects.map((p) => p.category).filter(Boolean))].sort(),
    [allProjects]
  );

  const statusCounts = useMemo(
    () =>
      allProjects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {}),
    [allProjects]
  );

  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (a, b) =>
          Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) ||
          (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
      ),
    [projects]
  );

  const clearFilters = () => {
    setSelectedStatus("all");
    setSelectedCategory("all");
    setShowFeaturedOnly(false);
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedStatus !== "all" || selectedCategory !== "all" || showFeaturedOnly || searchQuery;

  return (
    <main className="nb-dark bg-paper text-ink">
      <header className="nb-blueprint border-b border-line">
        <div className="nb-container flex flex-col gap-5 pb-14 pt-16 sm:pt-20">
          <span className="nb-eyebrow">
            <span className="nb-eyebrow-num">[02]</span> Projects
          </span>
          <h1 className="nb-h1 m-0 max-w-[860px]">Everything we&apos;ve built, are building, and want to build next.</h1>
          {allProjects.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-8 font-mono text-[13px] text-ink-muted">
              {PROJECT_STATUSES.filter((s) => statusCounts[s]).map((s) => (
                <span key={s}>
                  <strong className="font-medium text-ink">{statusCounts[s]}</strong>{" "}
                  {projectStatus(s).label.toLowerCase()}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="nb-container flex flex-col gap-8 pb-28 pt-10">
        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
              {["all", ...PROJECT_STATUSES].map((s) => {
                const active = selectedStatus === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedStatus(s)}
                    className={`nb-pill h-10 px-4 text-sm ${active ? "nb-pill-active" : ""}`}
                  >
                    {s === "all" ? "All" : projectStatus(s).label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-[0_1_520px] flex-wrap gap-2">
              <div className="relative min-w-0 flex-[1_1_220px]">
                <label htmlFor="projects-search" className="nb-sr-only">
                  Search projects
                </label>
                <Search
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
                />
                <input
                  id="projects-search"
                  type="search"
                  placeholder="Search projects…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="nb-input h-11 pl-10 text-sm"
                />
              </div>
              <label htmlFor="projects-category" className="nb-sr-only">
                Category
              </label>
              <select
                id="projects-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="nb-input h-11 w-[180px] shrink-0 truncate pr-8 text-sm"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className="h-[18px] w-[18px] accent-ink"
              />
              Featured only
            </label>
            <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
              {!loading && !error && (
                <span aria-live="polite">
                  {sortedProjects.length}
                  {pagination.total > sortedProjects.length ? ` of ${pagination.total}` : ""} projects
                </span>
              )}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.06em] text-signal-text hover:text-signal-hover"
                >
                  <X size={14} aria-hidden="true" /> Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5" role="status" aria-label="Loading projects">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="nb-card h-[440px] animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="nb-card flex flex-col items-start gap-4 p-10">
            <h2 className="m-0 font-display text-2xl font-semibold">Projects couldn&apos;t be loaded</h2>
            <p className="m-0 text-ink-muted">{error}</p>
            <button type="button" onClick={fetchProjects} className="nb-btn nb-btn-primary">
              Try again
            </button>
          </div>
        ) : sortedProjects.length === 0 && !hasActiveFilters ? (
          <EmptyLog
            id="projects-empty-title"
            title="No projects published yet."
            scannerLabel="No projects found · Jarvis is also waiting for the team to update"
            actions={
              <>
                <Link href="/projectRequest" className="nb-btn nb-btn-primary">
                  Pitch a project
                </Link>
                <Link href="/research-areas" className="nb-btn nb-btn-secondary">
                  Explore research areas
                </Link>
              </>
            }
          >
            Builds from every team will be documented here as they&apos;re published. Got an idea worth building?
            Pitch it and it could be the first one on the board.
          </EmptyLog>
        ) : sortedProjects.length === 0 ? (
          <NoMatchCard title="No projects found" hint="Try a different filter or search term." onClear={clearFilters} />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
            {sortedProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

function ProjectCard({ project }) {
  const [imageFailed, setImageFailed] = useState(false);
  const status = projectStatus(project.status);
  const progress = project.status === "ongoing" ? calculateProgress(project.milestones) : null;
  const teamCount = project.teamMembers?.length || 0;

  return (
    <Link
      href={`/Projects/${project._id}`}
      className="nb-card nb-card-hover group flex flex-col overflow-hidden text-ink no-underline"
    >
      {project.imageUrl && !imageFailed ? (
        <RemoteImage
          src={project.imageUrl}
          displayWidth={420}
          alt=""
          className="block h-[220px] w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <BlueprintPlaceholder className="h-[220px]" />
      )}
      <div className="flex flex-1 flex-col gap-2.5 px-6 pb-6 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`nb-chip ${status.chip}`}>{status.label}</span>
          {project.isFeatured && (
            <span className="nb-chip nb-chip-outline inline-flex items-center gap-1">
              <Star size={11} aria-hidden="true" /> Featured
            </span>
          )}
          {project.category && (
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">{project.category}</span>
          )}
        </div>
        <h2 className="m-0 font-display text-[22px] font-semibold leading-snug tracking-[-0.01em] group-hover:text-signal-text">
          {project.title}
        </h2>
        <p className="m-0 line-clamp-3 text-[15px] leading-relaxed text-ink-muted">{project.description}</p>

        {progress !== null && project.milestones?.length > 0 && (
          <div className="mt-1 flex flex-col gap-1.5">
            <span className="flex justify-between font-mono text-xs text-ink-muted">
              <span>Progress</span>
              <span>{progress}%</span>
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-[#E6E7E1]">
              <span className="block h-full bg-signal" style={{ width: `${progress}%` }} />
            </span>
          </div>
        )}

        <div className="mt-auto flex justify-between gap-3 border-t border-line-soft pt-3.5 font-mono text-xs text-ink-muted">
          <span>{project.startDate ? `Started ${formatDate(project.startDate, { month: "short", year: "numeric" })}` : "Start TBD"}</span>
          <span>{teamCount > 0 ? `${teamCount} member${teamCount === 1 ? "" : "s"}` : ""}</span>
        </div>
      </div>
    </Link>
  );
}

export default ProjectsPage;
