"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Boxes, MapPin, Search, X } from "lucide-react";
import { getInventoryProject } from "@/lib/inventoryProjects";
import inventoryService from "@/lib/inventory";
import { DetailPageSkeleton } from "@/components/PageSkeletons";
import { DemoBanner, EmptyState, categoryCode, stockChip } from "./InventoryUi";
import styles from "./inventory.module.css";

function stockTone(item) {
  const quantity = Number(item.quantity ?? 0);
  if (quantity <= 0) return { label: "Out of stock", tone: "danger" };
  return { label: "Available", tone: "success" };
}

export default function ProjectInventoryDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setProject(null);
    setItems([]);

    Promise.all([
      getInventoryProject(projectId, { signal: controller.signal }),
      inventoryService.listProjectComponents(projectId, { limit: 100, skip: 0 }),
    ])
      .then(([projectData, inventoryData]) => {
        if (!active) return;
        setProject(projectData);
        setItems(inventoryData.items || []);
      })
      .catch((loadError) => {
        if (active && loadError.name !== "AbortError") {
          setError(loadError.message || "Project inventory could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [projectId, retry]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))].sort(),
    [items]
  );
  const filteredItems = items.filter((item) => {
    const matchesText = !search.trim() || [item.name, item.description, item.category]
      .some((value) => String(value || "").toLowerCase().includes(search.trim().toLowerCase()));
    const tone = stockTone(item).tone;
    const matchesCategory = !category || item.category === category;
    const matchesAvailability = !availability || tone === availability;
    return matchesText && matchesCategory && matchesAvailability;
  });
  const hasFilters = Boolean(search || category || availability);
  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setAvailability("");
  };

  return (
    <main className="nb-dark bg-paper text-ink">
      <header className="nb-blueprint border-b border-line">
        <div className="nb-container flex flex-col gap-5 pb-12 pt-10 sm:pt-14">
          <nav aria-label="Inventory breadcrumb" className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/Inventory?section=projects" className="inline-flex min-h-[44px] items-center gap-2 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted hover:text-ink">
              <ArrowLeft size={16} aria-hidden="true" /> Project inventories
            </Link>
            {projectId && (
              <Link href={`/Projects/${encodeURIComponent(projectId)}`} className="nb-link inline-flex min-h-[44px] items-center gap-1 text-sm">
                Back to project <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            )}
          </nav>
          {!loading && !error && project && (
            <>
              <span className="nb-eyebrow">
                <span className="nb-eyebrow-num">[INV]</span> Project inventory
              </span>
              <h1 className="nb-h1 m-0 max-w-[900px]">{project.title || "Untitled project"}</h1>
              {project.description && <p className="nb-lead m-0 line-clamp-3 max-w-[720px]">{project.description}</p>}
            </>
          )}
        </div>
      </header>

      <div className="nb-container flex flex-col gap-6 pb-28 pt-8">
        {loading ? (
          <DetailPageSkeleton />
        ) : error ? (
          <EmptyState
            role="alert"
            headingLevel={1}
            title="Project inventory unavailable"
            action={<button type="button" className="nb-btn nb-btn-primary" onClick={() => setRetry((value) => value + 1)}>Try again</button>}
          >
            {error}
          </EmptyState>
        ) : project && (
          <>
            <DemoBanner label="Project-owned stock">Approved requests transfer quantities from General Lab into this project.</DemoBanner>

            <div className="flex flex-col gap-2">
              <h2 className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Project components</h2>
              <p className="m-0 text-ink-muted">Component records are managed through the admin dashboard.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-[1_1_260px]">
                <label htmlFor="project-components-search" className="nb-sr-only">Search project components</label>
                <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
                <input
                  id="project-components-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search components…"
                  className="nb-input h-11 pl-10 text-sm"
                />
              </div>
              <label htmlFor="project-components-category" className="nb-sr-only">Filter by category</label>
              <select
                id="project-components-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="nb-input h-11 w-[180px] shrink-0 truncate pr-8 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <label htmlFor="project-components-availability" className="nb-sr-only">Filter by availability</label>
              <select
                id="project-components-availability"
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
                className="nb-input h-11 w-[180px] shrink-0 truncate pr-8 text-sm"
              >
                <option value="">Any status</option>
                <option value="success">Available</option>
                <option value="danger">Out of stock</option>
              </select>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex min-h-[44px] items-center gap-1 px-2 font-mono text-xs uppercase tracking-[0.06em] text-signal-text hover:text-signal-hover"
                >
                  <X size={14} aria-hidden="true" /> Clear filters
                </button>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title={hasFilters ? "No matching components" : "No components yet"}
                action={hasFilters && <button type="button" className="nb-btn nb-btn-secondary" onClick={clearFilters}>Clear filters</button>}
              >
                {hasFilters ? "Try changing your search or filters." : "Components will appear here after an admin adds them or approves a request."}
              </EmptyState>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col">Category</th>
                      <th scope="col">Location</th>
                      <th scope="col">Available</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const stock = stockTone(item);
                      return (
                        <tr key={item._id}>
                          <td>
                            <span className="flex min-w-[240px] items-center gap-3">
                              <span className={styles.codeTile} aria-hidden="true">{categoryCode(item.category)}</span>
                              <span className="flex min-w-0 flex-col">
                                <span className="font-semibold">{item.name}</span>
                                <span className="line-clamp-1 text-[13px] text-ink-muted">{item.description || "Project component"}</span>
                              </span>
                            </span>
                          </td>
                          <td className="text-ink-muted">{item.category || "Uncategorized"}</td>
                          <td className="font-mono text-[13px]">
                            {item.location ? (
                              <span className="inline-flex items-center gap-1"><MapPin size={14} aria-hidden="true" />{item.location}</span>
                            ) : (
                              <span className="text-ink-muted">Not set</span>
                            )}
                          </td>
                          <td className="font-mono text-xs">{item.quantity}</td>
                          <td><span className={`nb-chip ${stockChip(stock.label)}`}>{stock.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
