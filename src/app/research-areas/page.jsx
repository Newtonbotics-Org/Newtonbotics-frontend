"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import RemoteImage from "@/components/RemoteImage";
import BlueprintPlaceholder from "@/components/lab/BlueprintPlaceholder";
import EmptyLog from "@/components/lab/EmptyLog";
import { API_BASE_URL, apiRequest } from "@/lib/api";
import NoMatchCard from "@/components/lab/NoMatchCard";

const DEFAULT_CATEGORIES = ["AI/ML", "Mechanics", "Robotics"];

const pad = (n) => String(n).padStart(2, "0");

const ResearchAreasPage = () => {
  const [researchAreas, setResearchAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  const fetchResearchAreas = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiRequest(`${API_BASE_URL}/research-areas?isActive=true&limit=100`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch research areas");
      const data = await res.json();
      if (data.success) {
        setResearchAreas(data.data.items || []);
      }
    } catch (err) {
      console.error("Error fetching research areas:", err);
      setError(err.message || "Research areas could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResearchAreas();
  }, [fetchResearchAreas]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiRequest(`${API_BASE_URL}/research-areas/categories`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setCategories(data.data.categories || []);
          } else {
            console.error("Failed to fetch categories:", data.message);
          }
        } else {
          console.error("Categories API error:", res.status);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const categoryOptions = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const sortedAreas = useMemo(
    () => [...researchAreas].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [researchAreas]
  );

  const q = searchQuery.toLowerCase();
  const filteredResearchAreas = sortedAreas.filter((area) => {
    const matchesSearch =
      (area.name || "").toLowerCase().includes(q) ||
      (area.description || "").toLowerCase().includes(q) ||
      (area.keywords && area.keywords.some((keyword) => keyword.toLowerCase().includes(q)));
    const matchesCategory = selectedCategory === "all" || area.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const hasActiveFilters = Boolean(searchQuery) || selectedCategory !== "all";
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  const total = filteredResearchAreas.length;

  return (
    <main className="nb-dark bg-paper text-ink">
      <header className="nb-blueprint border-b border-line">
        <div className="nb-container flex flex-wrap items-end justify-between gap-10 pb-16 pt-16 sm:pt-20">
          <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-5">
            <span className="nb-eyebrow">
              <span className="nb-eyebrow-num">[01]</span> Research areas
            </span>
            <h1 className="nb-h1 m-0">Where our robots are headed.</h1>
            <p className="m-0 max-w-[600px] text-lg leading-relaxed text-ink-muted">
              Explore the research directions behind our projects. Pick one, find the team, start building.
            </p>
          </div>
          {sortedAreas.length > 0 && (
            <nav aria-label="Jump to area" className="flex min-w-0 flex-[0_1_320px] flex-col border-t border-ink">
              {sortedAreas.map((area, i) => (
                <a
                  key={area._id || i}
                  href={`#area-${area._id || i}`}
                  className="flex min-h-[44px] items-center gap-3.5 border-b border-line py-3 text-[15px] text-ink no-underline hover:text-signal-text"
                >
                  <span className="font-mono text-xs text-signal-text">{pad(i + 1)}</span>
                  <span className="truncate">{area.name}</span>
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>

      <div className="nb-container flex flex-col pb-28 pt-10">
        {/* Filters — only useful once there is something to filter */}
        {!loading && !error && researchAreas.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-[0_1_560px] flex-wrap gap-2">
              <div className="relative min-w-0 flex-[1_1_220px]">
                <label htmlFor="research-search" className="nb-sr-only">
                  Search research areas
                </label>
                <Search
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
                />
                <input
                  id="research-search"
                  type="search"
                  placeholder="Search research areas…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="nb-input h-11 pl-10 text-sm"
                />
              </div>
              <label htmlFor="research-category" className="nb-sr-only">
                Category
              </label>
              <select
                id="research-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="nb-input h-11 w-[180px] shrink-0 truncate pr-8 text-sm"
              >
                <option value="all">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
              <span aria-live="polite">
                {total} of {researchAreas.length} areas
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex min-h-[44px] items-center gap-1 font-mono text-xs uppercase tracking-[0.06em] text-signal-text hover:text-signal-hover"
                >
                  <X size={14} aria-hidden="true" /> Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-6 pt-8" role="status" aria-label="Loading research areas">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex flex-wrap gap-14 border-b border-line py-10">
                <div className="nb-card h-[320px] flex-[1_1_440px] animate-pulse" />
                <div className="flex flex-[1_1_440px] flex-col gap-4">
                  <div className="h-4 w-20 animate-pulse rounded bg-[#E6E7E1]" />
                  <div className="h-10 w-3/4 animate-pulse rounded bg-[#E6E7E1]" />
                  <div className="h-20 w-full animate-pulse rounded bg-[#E6E7E1]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="nb-card mt-8 flex flex-col items-start gap-4 p-10">
            <h2 className="m-0 font-display text-2xl font-semibold">Research areas couldn&apos;t be loaded</h2>
            <p className="m-0 text-ink-muted">{error}</p>
            <button type="button" onClick={fetchResearchAreas} className="nb-btn nb-btn-primary">
              Try again
            </button>
          </div>
        ) : researchAreas.length === 0 ? (
          <div className="mt-2">
            <EmptyLog
              id="research-empty-title"
              title="Research areas are being written up."
              scannerLabel="No research areas found · Jarvis is also waiting for the team to update"
              actions={
                <>
                  <Link href="/Projects" className="nb-btn nb-btn-primary">
                    Browse projects
                  </Link>
                  <Link href="/projectRequest" className="nb-btn nb-btn-secondary">
                    Pitch a project
                  </Link>
                </>
              }
            >
              The lab&apos;s research directions will be listed here once they&apos;re published. In the meantime,
              see what the teams are building.
            </EmptyLog>
          </div>
        ) : total === 0 ? (
          <NoMatchCard className="mt-8" title="No research areas found" hint="Try a different search term or category." onClear={clearFilters} />
        ) : (
          <div className="flex flex-col">
            {filteredResearchAreas.map((area, i) => (
              <AreaRow key={area._id || i} area={area} index={i} total={total} />
            ))}
          </div>
        )}
      </div>

      <section className="bg-ink text-night-text">
        <div className="nb-container flex flex-wrap items-center justify-between gap-8 py-20">
          <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-3">
            <h2 className="m-0 font-display text-[clamp(28px,3vw,40px)] font-semibold leading-tight tracking-[-0.02em]">
              Have a research idea that doesn&apos;t fit?
            </h2>
            <p className="m-0 text-base text-night-muted">We add new directions when a team forms around them.</p>
          </div>
          <Link href="/projectRequest" className="nb-btn nb-btn-accent">
            Pitch a project
          </Link>
        </div>
      </section>
    </main>
  );
};

function AreaRow({ area, index, total }) {
  const [imageFailed, setImageFailed] = useState(false);
  const focus = Array.isArray(area.focusAreas) ? area.focusAreas : [];
  const keywords = Array.isArray(area.keywords) ? area.keywords : [];
  const reverse = index % 2 === 1;
  const href = `/research-areas/${area._id}`;

  return (
    <section
      id={`area-${area._id || index}`}
      aria-labelledby={`area-title-${area._id || index}`}
      className={`flex scroll-mt-24 flex-wrap items-center gap-10 border-b border-line py-14 lg:gap-14 lg:py-[72px] ${
        reverse ? "flex-row-reverse" : ""
      }`}
    >
      <div className="min-w-0 flex-[1_1_440px]">
        {area.featuredImageUrl && !imageFailed ? (
          <div className="rounded-lg border border-line bg-surface p-3">
            <RemoteImage
              src={area.featuredImageUrl}
              alt={area.name}
              className="block h-[260px] w-full rounded object-cover sm:h-[396px]"
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <BlueprintPlaceholder label={area.category || "Research area"} className="h-[260px] rounded-lg border border-line sm:h-[420px]" />
        )}
      </div>

      <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[13px] text-signal-text">
            {pad(index + 1)} / {pad(total)}
          </span>
          {area.category && <span className="nb-chip nb-chip-outline">{area.category}</span>}
          {area.isFeatured && <span className="nb-chip nb-chip-signal">Featured</span>}
        </div>
        <h2
          id={`area-title-${area._id || index}`}
          className="m-0 font-display text-[clamp(30px,3.5vw,44px)] font-semibold leading-[1.05] tracking-[-0.03em]"
        >
          {area.name}
        </h2>
        {area.description && (
          <p className="m-0 line-clamp-4 text-[17px] leading-[1.65] text-ink-muted">{area.description}</p>
        )}

        {focus.length > 0 && (
          <ul className="m-0 flex list-none flex-col border-t border-line p-0">
            {focus.slice(0, 4).map((f, i) => (
              <li key={i} className="flex items-center gap-3 border-b border-line py-3 text-[15px]">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-ink" />
                {f}
              </li>
            ))}
            {focus.length > 4 && (
              <li className="py-3 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
                + {focus.length - 4} more focus areas
              </li>
            )}
          </ul>
        )}

        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {keywords.slice(0, 5).map((k, i) => (
              <span key={i} className="rounded border border-line px-2 py-1 font-mono text-[11px] text-ink-muted">
                {k}
              </span>
            ))}
            {keywords.length > 5 && (
              <span className="px-1 py-1 font-mono text-[11px] text-ink-muted">+{keywords.length - 5}</span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap gap-6 font-mono text-[13px] text-ink-muted">
            <span>
              <strong className="font-medium text-ink">{area.publicationCount || 0}</strong> publications
            </span>
            <span>
              <strong className="font-medium text-ink">{area.memberCount || 0}</strong> members
            </span>
          </div>
          <Link href={href} className="nb-btn nb-btn-secondary nb-btn-sm">
            View details <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ResearchAreasPage;
