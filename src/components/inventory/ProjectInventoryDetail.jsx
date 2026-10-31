"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Boxes, MapPin, Search } from "lucide-react";
import { getInventoryProject } from "@/lib/inventoryProjects";
import inventoryService from "@/lib/inventory";
import { DetailPageSkeleton } from "@/components/PageSkeletons";
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
    <main className={styles.scope}>
      <div className={styles.container}>
        <nav className={styles.detailNav} aria-label="Inventory breadcrumb">
          <Link href="/Inventory?section=projects" className={styles.backLink}>
            <ArrowLeft size={16} /> Project inventories
          </Link>
          {projectId && (
            <Link href={`/Projects/${encodeURIComponent(projectId)}`} className={styles.backLink}>
              Back to project <ArrowUpRight size={14} />
            </Link>
          )}
        </nav>

        {loading ? (
          <DetailPageSkeleton />
        ) : error ? (
          <div className={styles.empty} role="alert">
            <h1>Project inventory unavailable</h1>
            <p>{error}</p>
            <button className={styles.secondaryButton} onClick={() => setRetry((value) => value + 1)}>Try again</button>
          </div>
        ) : project && (
          <>
            <header className={styles.projectHeader}>
              <p className={styles.eyebrow}>PROJECT INVENTORY</p>
              <h1>{project.title || "Untitled project"}</h1>
              {project.description && <p>{project.description}</p>}
              <Link href={`/Projects/${encodeURIComponent(projectId)}`} className={styles.backLink}>
                View project details <ArrowUpRight size={16} />
              </Link>
            </header>

            <div className={styles.demoBanner} role="status">
              <span>PROJECT-OWNED STOCK</span>
              <span>Approved requests transfer quantities from General Lab into this project.</span>
            </div>

            <div className={styles.sectionHeading}>
              <div>
                <h2>Project components</h2>
                <p>Component records are managed through the admin dashboard.</p>
              </div>
            </div>

            <div className={styles.toolbar}>
              <label className={styles.search}>
                <Search size={18} />
                <span className={styles.srOnly}>Search project components</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search components…" />
              </label>
              <label className={styles.statusSelect}>
                <span className={styles.srOnly}>Filter by category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="">All categories</option>
                  {categories.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className={styles.statusSelect}>
                <span className={styles.srOnly}>Filter by availability</span>
                <select value={availability} onChange={(event) => setAvailability(event.target.value)}>
                  <option value="">All availability</option>
                  <option value="success">Available</option>
                  <option value="danger">Out of stock</option>
                </select>
              </label>
              {hasFilters && <button className={styles.secondaryButton} onClick={clearFilters}>Clear filters</button>}
            </div>

            {filteredItems.length === 0 ? (
              <div className={styles.empty}>
                <Boxes size={40} strokeWidth={1.2} />
                <h3>{hasFilters ? "No matching components" : "No components yet"}</h3>
                <p>{hasFilters ? "Try changing your search or filters." : "Components will appear here after an admin adds them or approves a request."}</p>
                {hasFilters && <button className={styles.secondaryButton} onClick={clearFilters}>Clear filters</button>}
              </div>
            ) : (
              <div className={styles.itemGrid}>
                {filteredItems.map((item) => {
                  const stock = stockTone(item);
                  return (
                    <article key={item._id} className={styles.itemCard}>
                      <div className={styles.itemImage}><Boxes size={42} strokeWidth={1.2} aria-label="Component" /></div>
                      <div className={styles.itemBody}>
                        <div className={styles.itemMeta}>
                          <span className={styles.categoryLabel}>{item.category || "Uncategorized"}</span>
                          <span className={`${styles.stockBadge} ${styles[stock.tone]}`}>{stock.label}</span>
                        </div>
                        <h4>{item.name}</h4>
                        <p className={styles.itemDescription}>{item.description || "Project component"}</p>
                        <div className={styles.itemFacts}>
                          <div><strong>{item.quantity}</strong><span>available</span></div>
                          <span><MapPin size={14} />{item.location || "Location not set"}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
