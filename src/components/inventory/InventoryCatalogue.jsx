"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Boxes, Grid2X2, List, MapPin, Plus, Search, Settings2, SlidersHorizontal } from "lucide-react";
import { CardSkeletonGrid } from "@/components/PageSkeletons";
import styles from "./inventory.module.css";

export function stockStatus(item) {
  if (item.status === "maintenance") return { label: "Maintenance", tone: "neutral" };
  if (item.status === "retired") return { label: "Retired", tone: "neutral" };
  if (item.currentQuantity == null || !Number.isFinite(Number(item.currentQuantity))) return { label: "Quantity unavailable", tone: "neutral" };
  if (Number(item.currentQuantity) <= 0) return { label: "Out of stock", tone: "danger" };
  if (Number(item.currentQuantity) <= Number(item.minQuantity || 0)) return { label: "Low stock", tone: "warning" };
  return { label: "Available", tone: "success" };
}

function EquipmentImage({ item }) {
  const [failed, setFailed] = useState(false);
  return <div className={styles.itemImage}>{item.imageUrl && !failed ? (
    // API-supplied images may use hosts outside Next's image allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.imageUrl} alt={item.name || "Equipment"} loading="lazy" onError={() => setFailed(true)} />
  ) : <Boxes size={42} strokeWidth={1.2} aria-label="No component image" />}</div>;
}

function EquipmentCard({ item, category, canEdit, canDelete, onEdit, onDelete }) {
  const status = stockStatus(item);
  return <article className={styles.itemCard}>
    <EquipmentImage key={item.imageUrl || "empty"} item={item} />
    <div className={styles.itemBody}>
      <div className={styles.itemMeta}><span className={styles.categoryLabel}>{category}</span><span className={`${styles.stockBadge} ${styles[status.tone]}`}>{status.label}</span></div>
      <h4><Link href={`/Inventory/${encodeURIComponent(item._id)}`}>{item.name}</Link></h4>
      <p className={styles.itemDescription}>{item.description || item.modelNumber || "Lab component"}</p>
      <div className={styles.itemFacts}><div><strong>{item.currentQuantity ?? "—"}</strong><span>available</span></div><span><MapPin size={14} />{item.location || "Location not recorded"}</span></div>
      <div className={styles.itemActions}>
        <Link href={`/Inventory/${encodeURIComponent(item._id)}`}>{canEdit ? "Details & checkout" : "View details"}<ArrowUpRight size={15} /></Link>
        <div>{canEdit && <button onClick={() => onEdit(item)}>Edit</button>}{canDelete && <button className={styles.deleteAction} onClick={() => onDelete(item._id)} aria-label={`Delete ${item.name}`}>Delete</button>}</div>
      </div>
    </div>
  </article>;
}

export default function InventoryCatalogue({
  items, categories, pagination, loading, error, categoryError, onRetry, onRetryCategories,
  search, onSearch, categoryId, onCategory, status, onStatus, statusOptions,
  limit, skip, onLimit, onSkip, viewMode, onViewMode,
  canEdit, canDelete, canManageCategories, onCreate, onEdit, onDelete, onManageCategories,
}) {
  const categoryMap = new Map(categories.map((category) => [category._id, category.name]));
  const groups = items.reduce((result, item) => {
    const id = typeof item.categoryId === "object" ? item.categoryId?._id : item.categoryId;
    const name = categoryMap.get(id) || (typeof item.categoryId === "object" && item.categoryId?.name) || "Uncategorized";
    const key = id || "uncategorized";
    if (!result.has(key)) result.set(key, { name, items: [] });
    result.get(key).items.push(item);
    return result;
  }, new Map());
  const filtered = Boolean(search || categoryId || status);
  const reset = () => { onSearch(""); onCategory(""); onStatus(""); };
  const attention = items.filter((item) => ["warning", "danger"].includes(stockStatus(item).tone)).length;
  return <section aria-labelledby="lab-title">
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>01 / SHARED LAB CATALOGUE</p><h2 id="lab-title">General Lab Inventory</h2><p>Components, tools and equipment for the next big idea.</p></div><div className={styles.headingActions}>{canManageCategories && <button className={styles.secondaryButton} onClick={onManageCategories}><Settings2 size={16} /> Categories</button>}{canEdit && <button className={styles.primaryButton} onClick={onCreate}><Plus size={18} /> Add component</button>}</div></div>
    <div className={styles.stats}>
      <div><span>{filtered ? "Matching component records" : "Component records"}</span><strong>{loading || error ? "—" : pagination.total}</strong><small>From the lab catalogue</small></div>
      <div><span>Categories</span><strong>{categoryError ? "—" : categories.length}</strong><small>Organized for discovery</small></div>
      <div><span>Low or out of stock</span><strong>{loading || error ? "—" : attention}</strong><small>On this page only</small></div>
    </div>
    <div className={styles.catalogueLayout}>
      <aside className={styles.categorySidebar} aria-label="Browse equipment categories"><p className={styles.eyebrow}><SlidersHorizontal size={14} /> BROWSE CATEGORIES</p>
        <div className={styles.categoryButtons}><button className={!categoryId ? styles.selectedCategory : ""} aria-pressed={!categoryId} onClick={() => onCategory("")}><Boxes size={16} /> All components</button>{categories.map((category) => <button key={category._id} className={categoryId === category._id ? styles.selectedCategory : ""} aria-pressed={categoryId === category._id} onClick={() => onCategory(category._id)}><span className={styles.categoryDot} />{category.name}</button>)}</div>
        {categoryError && <div className={styles.inlineError} role="alert"><p>Categories couldn’t be loaded.</p><button onClick={onRetryCategories}>Retry categories</button></div>}
        <div className={styles.sidebarNote}><strong>A place for every part.</strong><p>Find components by category, check their availability, then open the details for checkout and returns.</p></div>
      </aside>
      <div className={styles.catalogueMain}>
        <div className={styles.toolbar}>
          <label className={styles.search}><Search size={18} /><span className={styles.srOnly}>Search lab components</span><input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search components, tools, equipment…" /></label>
          <label className={styles.statusSelect}><span className={styles.srOnly}>Availability filter</span><select value={status} onChange={(e) => onStatus(e.target.value)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.value ? option.label : "All availability"}</option>)}</select></label>
          <div className={styles.viewToggle} aria-label="Display mode"><button aria-label="Grid view" aria-pressed={viewMode === "grid"} onClick={() => onViewMode("grid")}><Grid2X2 size={18} /></button><button aria-label="List view" aria-pressed={viewMode === "list"} onClick={() => onViewMode("list")}><List size={18} /></button></div>
        </div>
        <div className={styles.resultsBar}><span>{loading ? "Loading components…" : error ? "Catalogue unavailable" : `${items.length} records on this page · grouped by category`}</span>{filtered && <button onClick={reset}>Clear filters</button>}</div>
        {loading ? <CardSkeletonGrid count={6} variant="inventory" /> : error ? <div className={styles.empty} role="alert"><h3>Unable to load inventory</h3><p>{error}</p><button className={styles.secondaryButton} onClick={onRetry}>Try again</button></div> : items.length === 0 ? <div className={styles.empty}><Boxes size={40} strokeWidth={1.2} /><h3>{filtered ? "No matching components" : "Your catalogue starts here"}</h3><p>{filtered ? "Try another search or clear your filters." : "Components will appear here once added to the lab inventory."}</p>{filtered ? <button onClick={reset} className={styles.secondaryButton}>Clear filters</button> : canEdit && <button onClick={onCreate} className={styles.primaryButton}>Add first component</button>}</div> : [...groups].map(([id, group]) => <section key={id} className={styles.categoryGroup} aria-label={group.name}><div className={styles.groupHeading}><h3>{group.name}</h3><span>{group.items.length} on this page</span></div><div className={viewMode === "grid" ? styles.itemGrid : styles.itemList}>{group.items.map((item) => <EquipmentCard key={item._id} item={item} category={group.name} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />)}</div></section>)}
        <div className={styles.pagination}><span>{!loading && !error && pagination.total > 0 ? `${skip + 1}–${skip + items.length} of ${pagination.total}` : "Lab catalogue"}</span><div><label><span className={styles.srOnly}>Components per page</span><select value={limit} onChange={(e) => onLimit(Number(e.target.value))}>{[10,20,30,40,50,100].map((n) => <option key={n} value={n}>{n} / page</option>)}</select></label><button disabled={skip === 0 || loading} onClick={() => onSkip(Math.max(0, skip - limit))} aria-label="Previous page">Previous</button><button disabled={!pagination.hasMore || loading || Boolean(error)} onClick={() => onSkip(skip + limit)} aria-label="Next page">Next</button></div></div>
      </div>
    </div>
  </section>;
}
