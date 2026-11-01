"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ExternalLink, ArrowUpRight, X } from "lucide-react";
import ProtectedRoute from "../../components/ProtectedRoute";
import RemoteImage from "@/components/RemoteImage";
import EmptyLog from "@/components/lab/EmptyLog";
import resourcesService, { RESOURCE_CATEGORIES, RESOURCE_TYPES } from "../../lib/resources";
import { getResourceOpenUrl, getResourcePreviewUrl } from "../../lib/cloudinaryMedia";
import NoMatchCard from "@/components/lab/NoMatchCard";

const TYPE_BADGE = {
  link: { label: "LINK", tone: "bg-[#E5ECFB] text-[#1E40AF]" },
  image: { label: "IMG", tone: "bg-[#E3F1E7] text-[#166534]" },
  video: { label: "VIDEO", tone: "bg-[#E6E7E1] text-ink" },
  document: { label: "DOC", tone: "bg-signal-tint text-signal-hover" },
};

function categoryLabel(id) {
  return RESOURCE_CATEGORIES.find((c) => c.id === id)?.label || id;
}

function typeLabel(id) {
  return RESOURCE_TYPES.find((t) => t.id === id)?.label || id;
}

function ResourceThumb({ resource }) {
  const [failed, setFailed] = useState(false);
  const previewUrl = getResourcePreviewUrl(resource);
  const badge = TYPE_BADGE[resource.resourceType] || { label: "FILE", tone: "bg-ink text-paper" };

  if (previewUrl && !failed) {
    return (
      <RemoteImage
        src={previewUrl}
        alt=""
        className="block h-14 w-14 shrink-0 rounded-md border border-line object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-medium ${badge.tone}`}
    >
      {badge.label}
    </span>
  );
}

function ResourceRow({ resource, onOpen }) {
  const isLink = resource.resourceType === "link";
  const hasUrl = Boolean(getResourceOpenUrl(resource));

  return (
    <li className="flex flex-wrap items-center gap-5 border-b border-line-soft px-5 py-5 last:border-b-0 sm:px-6">
      <ResourceThumb resource={resource} />
      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
        <h3 className="m-0 text-base font-semibold leading-snug">{resource.title}</h3>
        <p className="m-0 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
          {typeLabel(resource.resourceType)} · {categoryLabel(resource.category)}
        </p>
        {resource.description && (
          <p className="m-0 mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">{resource.description}</p>
        )}
        {resource.tags?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {resource.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-ink-muted">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onOpen(resource)}
        disabled={!hasUrl}
        aria-label={`${isLink ? "Open link" : "View resource"}: ${resource.title}`}
        className="nb-btn nb-btn-secondary h-11 shrink-0 px-4 text-sm"
      >
        {isLink ? "Open link" : "View"}
        {isLink ? <ExternalLink size={16} aria-hidden="true" /> : <ArrowUpRight size={16} aria-hidden="true" />}
      </button>
    </li>
  );
}

function FilterGroup({ legend, name, value, onChange, options, anyLabel }) {
  return (
    <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
      <legend className="mb-2.5 font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">{legend}</legend>
      {[{ id: "", label: anyLabel }, ...options].map((opt) => (
        <label key={opt.id || "any"} className="flex min-h-[36px] cursor-pointer items-center gap-2.5 text-[15px]">
          <input
            type="radio"
            name={name}
            value={opt.id}
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
            className="h-[18px] w-[18px] accent-ink"
          />
          {opt.label}
        </label>
      ))}
    </fieldset>
  );
}

function ResourcesContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [viewer, setViewer] = useState(null);

  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await resourcesService.list({
        q: search || undefined,
        category: category || undefined,
        resourceType: resourceType || undefined,
        limit: 100,
      });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, [search, category, resourceType]);

  useEffect(() => {
    const timer = setTimeout(loadResources, 250);
    return () => clearTimeout(timer);
  }, [loadResources]);

  const handleOpen = (resource) => {
    const url = getResourceOpenUrl(resource);
    if (!url) return;
    if (resource.resourceType === "link") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    setViewer(resource);
  };

  useEffect(() => {
    if (!viewer) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setViewer(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [viewer]);

  const filteredCount = useMemo(() => items.length, [items]);
  const hasActiveFilters = Boolean(search || category || resourceType);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setResourceType("");
  };

  return (
    <main className="nb-dark bg-paper text-ink">
      <header className="nb-blueprint border-b border-line">
        <div className="nb-container flex flex-col gap-5 pb-12 pt-16 sm:pt-20">
          <span className="nb-eyebrow">
            <span className="nb-eyebrow-num">[09]</span> Resources
          </span>
          <h1 className="nb-h1 m-0">The lab&apos;s shared notebook.</h1>
          <p className="m-0 max-w-[640px] text-lg leading-relaxed text-ink-muted">
            Shared robotics materials for signed-in members — drone guides, motor specs, reference links, photos and
            videos.
          </p>
          <div className="relative mt-2 w-full max-w-[720px]">
            <label htmlFor="res-q" className="nb-sr-only">
              Search resources
            </label>
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle"
            />
            <input
              id="res-q"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drones, motors, guides…"
              className="nb-input h-[52px] border-ink bg-surface pl-11 text-base"
            />
          </div>
        </div>
      </header>

      <div className="nb-container flex flex-wrap items-start gap-12 pb-28 pt-12">
        <aside aria-label="Filters" className="flex min-w-0 flex-[1_1_220px] flex-col gap-7">
          <FilterGroup
            legend="Type"
            name="res-type"
            value={resourceType}
            onChange={setResourceType}
            options={RESOURCE_TYPES.map((t) => ({ id: t.id, label: t.label }))}
            anyLabel="All types"
          />
          <FilterGroup
            legend="Category"
            name="res-category"
            value={category}
            onChange={setCategory}
            options={RESOURCE_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))}
            anyLabel="All categories"
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-[44px] items-center gap-1 self-start font-mono text-xs uppercase tracking-[0.06em] text-signal-text hover:text-signal-hover"
            >
              <X size={14} aria-hidden="true" /> Clear filters
            </button>
          )}
        </aside>

        <section aria-label="Resources" className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
          <div className="flex flex-wrap justify-between gap-2 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
            <span aria-live="polite">{loading ? "Loading…" : `${filteredCount} result${filteredCount === 1 ? "" : "s"}`}</span>
            {(category || resourceType) && (
              <span>
                {[resourceType && typeLabel(resourceType), category && categoryLabel(category)].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-[#F3C4C4] bg-[#FBE4E4] px-4 py-3 text-sm text-[#991B1B]">
              {error}
            </div>
          )}

          {loading ? (
            <ul role="status" aria-label="Loading resources" className="m-0 list-none rounded-lg border border-line bg-surface p-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center gap-5 border-b border-line-soft px-6 py-5 last:border-b-0">
                  <span className="h-14 w-14 shrink-0 animate-pulse rounded-md bg-[#E6E7E1]" />
                  <span className="flex flex-1 flex-col gap-2">
                    <span className="h-4 w-2/3 animate-pulse rounded bg-[#E6E7E1]" />
                    <span className="h-3 w-1/3 animate-pulse rounded bg-[#E6E7E1]" />
                  </span>
                </li>
              ))}
            </ul>
          ) : filteredCount === 0 && !hasActiveFilters ? (
            <EmptyLog
              id="resources-empty-title"
              title="No resources shared yet."
              scannerLabel="No resources found · Jarvis is also waiting for the team to update"
            >
              Datasheets, guides and shared lab materials will be listed here once admins publish them. Check back
              soon.
            </EmptyLog>
          ) : filteredCount === 0 ? (
            <NoMatchCard title="No resources match" hint="Try a different search term, type or category." onClear={clearFilters} />
          ) : (
            <ul className="m-0 list-none rounded-lg border border-line bg-surface p-0">
              {items.map((resource) => (
                <ResourceRow key={resource._id} resource={resource} onOpen={handleOpen} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {viewer && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-viewer-title"
          onClick={() => setViewer(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-line bg-surface text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h3 id="resource-viewer-title" className="m-0 font-display text-lg font-semibold">
                  {viewer.title}
                </h3>
                <p className="m-0 mt-1 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
                  {categoryLabel(viewer.category)} · {typeLabel(viewer.resourceType)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewer(null)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line text-ink hover:border-ink"
                aria-label="Close resource viewer"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              {viewer.resourceType === "video" && viewer.fileUrl && (
                <video src={viewer.fileUrl} controls className="max-h-[60vh] w-full rounded-md bg-ink" />
              )}
              {viewer.resourceType === "image" && viewer.fileUrl && (
                <div className="nb-blueprint-sm relative aspect-video w-full overflow-hidden rounded-md">
                  <RemoteImage
                    src={getResourcePreviewUrl(viewer) || viewer.fileUrl}
                    alt={viewer.title}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              {(viewer.resourceType === "document" || viewer.resourceType === "link") && (
                <a
                  href={getResourceOpenUrl(viewer)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nb-btn nb-btn-primary"
                >
                  Open in new tab
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              )}
              {viewer.description && (
                <p className="m-0 mt-4 max-w-[680px] leading-relaxed text-ink-muted">{viewer.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ResourcesPage() {
  return (
    <ProtectedRoute>
      <ResourcesContent />
    </ProtectedRoute>
  );
}
