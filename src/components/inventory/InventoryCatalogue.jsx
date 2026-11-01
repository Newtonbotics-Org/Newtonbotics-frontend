"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Grid2X2,
  List,
  MapPin,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { CardSkeletonGrid } from "@/components/PageSkeletons";
import BlueprintPlaceholder from "@/components/lab/BlueprintPlaceholder";
import {
  Alert,
  EmptyState,
  MONO_META,
  categoryCode,
  stockChip,
} from "./InventoryUi";
import styles from "./inventory.module.css";
import { optimizeImageUrl } from "@/lib/cloudinaryMedia";

export function stockStatus(item) {
  if (item.status === "maintenance")
    return { label: "Maintenance", tone: "neutral" };
  if (item.status === "retired") return { label: "Retired", tone: "neutral" };
  if (
    item.currentQuantity == null ||
    !Number.isFinite(Number(item.currentQuantity))
  )
    return { label: "Quantity unavailable", tone: "neutral" };
  if (Number(item.currentQuantity) <= 0)
    return { label: "Out of stock", tone: "danger" };
  if (Number(item.currentQuantity) <= Number(item.minQuantity || 0))
    return { label: "Low stock", tone: "warning" };
  return { label: "Available", tone: "success" };
}

function categoryNameOf(item, categoryMap) {
  const id =
    typeof item.categoryId === "object"
      ? item.categoryId?._id
      : item.categoryId;
  return (
    categoryMap.get(id) ||
    (typeof item.categoryId === "object" && item.categoryId?.name) ||
    "Uncategorized"
  );
}

/** Available / max, with a bar when a max quantity is recorded. */
function Availability({ item, low }) {
  const current = Number(item.currentQuantity);
  const max = Number(item.maxQuantity);
  const hasCurrent = item.currentQuantity != null && Number.isFinite(current);
  const hasMax = hasCurrent && Number.isFinite(max) && max > 0;
  const pct = hasMax
    ? Math.max(0, Math.min(100, Math.round((current / max) * 100)))
    : 0;
  return (
    <span className="flex flex-col gap-1.5">
      <span className="font-mono text-xs">
        {hasCurrent ? current : "—"}
        {hasMax ? ` / ${max}` : ""}
      </span>
      {hasMax && (
        <span className={styles.bar} aria-hidden="true">
          <span
            className={`${styles.barFill} ${low ? styles.barLow : ""}`}
            style={{ width: `${pct}%` }}
          />
        </span>
      )}
    </span>
  );
}

function ItemTile({ item, category }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={styles.codeTile} aria-hidden="true">
      {item.imageUrl && !failed ? (
        // API-supplied images may use hosts outside Next's image allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={optimizeImageUrl(item.imageUrl, { width: 40, height: 40, crop: "fill" })}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        categoryCode(category)
      )}
    </span>
  );
}

function RowActions({ item, canEdit, canDelete, onEdit, onDelete }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canEdit && (
        <button
          type="button"
          className="nb-btn nb-btn-ghost nb-btn-sm"
          onClick={() => onEdit(item)}
        >
          Edit
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          className="nb-btn nb-btn-ghost nb-btn-sm text-[#991B1B]"
          onClick={() => onDelete(item._id)}
          aria-label={`Delete ${item.name}`}
        >
          Delete
        </button>
      )}
      <Link
        href={`/Inventory/${encodeURIComponent(item._id)}`}
        className="nb-btn nb-btn-secondary nb-btn-sm"
        aria-label={`${canEdit ? "Details and checkout" : "View details"}: ${item.name}`}
      >
        {canEdit ? "Details & checkout" : "View"}
      </Link>
    </div>
  );
}

function InventoryTable({ items, categoryMap, ...actions }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Category</th>
            <th scope="col">Location</th>
            <th scope="col">Available</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="nb-sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const category = categoryNameOf(item, categoryMap);
            const status = stockStatus(item);
            return (
              <tr key={item._id}>
                <td>
                  <span className="flex min-w-[220px] items-center gap-3">
                    <ItemTile
                      key={item.imageUrl || "empty"}
                      item={item}
                      category={category}
                    />
                    <span className="flex min-w-0 flex-col">
                      <Link
                        href={`/Inventory/${encodeURIComponent(item._id)}`}
                        className="font-semibold text-ink hover:text-signal-text"
                      >
                        {item.name}
                      </Link>
                      {item.modelNumber && (
                        <span className="font-mono text-[11px] text-ink-muted">
                          {item.modelNumber}
                        </span>
                      )}
                    </span>
                  </span>
                </td>
                <td className="text-ink-muted">{category}</td>
                <td className="whitespace-nowrap font-mono text-[13px]">
                  {item.location || <span className="text-ink-muted">—</span>}
                </td>
                <td>
                  <Availability
                    item={item}
                    low={status.tone === "warning" || status.tone === "danger"}
                  />
                </td>
                <td>
                  <span className={`nb-chip ${stockChip(status.label)}`}>
                    {status.label}
                  </span>
                </td>
                <td>
                  <RowActions item={item} {...actions} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EquipmentImage({ item }) {
  const [failed, setFailed] = useState(false);
  if (!item.imageUrl || failed)
    return (
      <BlueprintPlaceholder
        label="No photo"
        className="h-[180px] border-b border-line"
      />
    );
  return (
    <div className={styles.cardMedia}>
      {/* eslint-disable-next-line @next/next/no-img-element -- API-supplied hosts */}
      <img
        src={optimizeImageUrl(item.imageUrl, { width: 360 })}
        alt={item.name || "Equipment"}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function EquipmentCard({
  item,
  category,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}) {
  const status = stockStatus(item);
  return (
    <article className="nb-card nb-card-hover flex flex-col overflow-hidden">
      <EquipmentImage key={item.imageUrl || "empty"} item={item} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={MONO_META}>{category}</span>
          <span className={`nb-chip ${stockChip(status.label)}`}>
            {status.label}
          </span>
        </div>
        <h3 className="m-0 font-display text-lg font-semibold tracking-[-0.01em]">
          <Link
            href={`/Inventory/${encodeURIComponent(item._id)}`}
            className="text-ink hover:text-signal-text"
          >
            {item.name}
          </Link>
        </h3>
        <p className="m-0 line-clamp-2 text-sm text-ink-muted">
          {item.description || item.modelNumber || "Lab component"}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm">
          <span>
            <strong className="font-mono font-medium">
              {item.currentQuantity ?? "—"}
            </strong>{" "}
            <span className="text-ink-muted">available</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1 font-mono text-xs text-ink-muted">
            <MapPin size={14} aria-hidden="true" />
            <span className="truncate">
              {item.location || "Location not recorded"}
            </span>
          </span>
        </div>
        <RowActions
          item={item}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </article>
  );
}

/** Desktop filter rail: searchable category list + availability options. */
function FilterSidebar({
  categories,
  categoryId,
  onCategory,
  status,
  onStatus,
  statusOptions,
  total,
  loading,
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = q
    ? categories.filter((c) => c.name?.toLowerCase().includes(q))
    : categories;
  const itemClass = (active) =>
    `flex min-h-[40px] w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm transition-colors ${
      active
        ? "bg-surface font-semibold text-ink shadow-[inset_3px_0_0_#FF5A1F,0_0_0_1px_#DCDDD6]"
        : "text-ink-body hover:bg-[#E6E7E1] hover:text-ink"
    }`;

  return (
    <aside
      aria-label="Inventory filters"
      className="hidden w-[248px] shrink-0 flex-col gap-6 lg:sticky lg:top-[calc(var(--nb-nav-height,72px)+16px)] lg:flex"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h3 className="m-0 font-mono text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">
            Categories
          </h3>
          <span className="font-mono text-xs text-ink-subtle">
            {categories.length}
          </span>
        </div>
        {categories.length > 8 && (
          <div className="relative">
            <label htmlFor="inventory-category-filter" className="nb-sr-only">
              Filter categories
            </label>
            <Search
              size={14}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
            />
            <input
              id="inventory-category-filter"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter categories…"
              className="nb-input h-10 pl-9 text-sm"
            />
          </div>
        )}
        <nav
          aria-label="Categories"
          className="-mx-1 max-h-[min(52vh,520px)] overflow-y-auto px-1 py-0.5"
        >
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {!q && (
              <li>
                <button
                  type="button"
                  aria-pressed={!categoryId}
                  onClick={() => onCategory("")}
                  className={itemClass(!categoryId)}
                >
                  <span>All components</span>
                  {total != null && (
                    <span className="font-mono text-xs font-normal text-ink-muted">
                      {loading ? "…" : total}
                    </span>
                  )}
                </button>
              </li>
            )}
            {visible.map((category) => {
              const active = categoryId === category._id;
              return (
                <li key={category._id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onCategory(category._id)}
                    className={itemClass(active)}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="w-7 shrink-0 font-mono text-[10px] text-ink-subtle">
                        {categoryCode(category.name)}
                      </span>
                      <span className="truncate">{category.name}</span>
                    </span>
                  </button>
                </li>
              );
            })}
            {q && visible.length === 0 && (
              <li className="px-3 py-2 text-sm text-ink-muted">
                No category matches “{query}”.
              </li>
            )}
          </ul>
        </nav>
      </div>

      <fieldset className="m-0 flex flex-col gap-1 border-0 border-t border-line p-0 pt-5">
        <legend className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">
          Availability
        </legend>
        {statusOptions.map((option) => (
          <label
            key={option.value || "any"}
            className="flex min-h-[36px] cursor-pointer items-center gap-2.5 rounded-md px-3 text-sm hover:bg-[#E6E7E1]"
          >
            <input
              type="radio"
              name="inventory-availability"
              value={option.value}
              checked={status === option.value}
              onChange={() => onStatus(option.value)}
              className="h-4 w-4 accent-ink"
            />
            {option.value ? option.label : "Any status"}
          </label>
        ))}
      </fieldset>
    </aside>
  );
}

export default function InventoryCatalogue({
  items,
  categories,
  pagination,
  loading,
  error,
  categoryError,
  onRetry,
  onRetryCategories,
  search,
  onSearch,
  categoryId,
  onCategory,
  status,
  onStatus,
  statusOptions,
  limit,
  skip,
  onLimit,
  onSkip,
  viewMode,
  onViewMode,
  canEdit,
  canDelete,
  canManageCategories,
  onCreate,
  onEdit,
  onDelete,
  onManageCategories,
}) {
  const categoryMap = new Map(
    categories.map((category) => [category._id, category.name]),
  );
  const groups = items.reduce((result, item) => {
    const id =
      typeof item.categoryId === "object"
        ? item.categoryId?._id
        : item.categoryId;
    const name = categoryNameOf(item, categoryMap);
    const key = id || "uncategorized";
    if (!result.has(key)) result.set(key, { name, items: [] });
    result.get(key).items.push(item);
    return result;
  }, new Map());
  const filtered = Boolean(search || categoryId || status);
  const reset = () => {
    onSearch("");
    onCategory("");
    onStatus("");
  };
  const attention = items.filter((item) =>
    ["warning", "danger"].includes(stockStatus(item).tone),
  ).length;
  const actions = { canEdit, canDelete, onEdit, onDelete };

  return (
    <section aria-labelledby="lab-title" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h2
            id="lab-title"
            className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]"
          >
            General lab inventory
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[13px] text-ink-muted">
            <span>
              <strong className="font-medium text-ink">
                {loading || error ? "—" : pagination.total}
              </strong>{" "}
              {filtered ? "matching records" : "component records"}
            </span>
            <span>
              <strong className="font-medium text-ink">
                {categoryError ? "—" : categories.length}
              </strong>{" "}
              categories
            </span>
            <span>
              <strong className="font-medium text-ink">
                {loading || error ? "—" : attention}
              </strong>{" "}
              low or out of stock on this page
            </span>
          </div>
        </div>
        {(canManageCategories || canEdit) && (
          <div className="flex flex-wrap gap-2">
            {canManageCategories && (
              <button
                type="button"
                className="nb-btn nb-btn-secondary nb-btn-sm"
                onClick={onManageCategories}
              >
                <Settings2 size={16} aria-hidden="true" /> Categories
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                className="nb-btn nb-btn-primary nb-btn-sm"
                onClick={onCreate}
              >
                <Plus size={16} aria-hidden="true" /> Add component
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-start gap-8">
        <FilterSidebar
          categories={categories}
          categoryId={categoryId}
          onCategory={onCategory}
          status={status}
          onStatus={onStatus}
          statusOptions={statusOptions}
          total={filtered ? null : pagination.total}
          loading={loading}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {categoryError && (
            <Alert className="flex flex-wrap items-center justify-between gap-3">
              <span>Categories couldn&apos;t be loaded.</span>
              <button
                type="button"
                className="nb-btn nb-btn-secondary nb-btn-sm"
                onClick={onRetryCategories}
              >
                Retry categories
              </button>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-[1_1_240px]">
              <label htmlFor="inventory-search" className="nb-sr-only">
                Search lab components
              </label>
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
              />
              <input
                id="inventory-search"
                type="search"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search parts, tools, equipment…"
                className="nb-input h-11 pl-10 text-sm"
              />
            </div>
            <label htmlFor="inventory-category" className="nb-sr-only">
              Category
            </label>
            <select
              id="inventory-category"
              value={categoryId}
              onChange={(e) => onCategory(e.target.value)}
              className="nb-input h-11 min-w-0 flex-[1_1_150px] truncate pr-8 text-sm lg:hidden"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <label htmlFor="inventory-status" className="nb-sr-only">
              Availability filter
            </label>
            <select
              id="inventory-status"
              value={status}
              onChange={(e) => onStatus(e.target.value)}
              className="nb-input h-11 min-w-0 flex-[1_1_150px] truncate pr-8 text-sm lg:hidden"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value ? option.label : "Any status"}
                </option>
              ))}
            </select>
            <div
              role="group"
              aria-label="Display mode"
              className="flex shrink-0 overflow-hidden rounded-md border border-line-strong bg-surface"
            >
              <button
                type="button"
                aria-label="Table view"
                aria-pressed={viewMode === "list"}
                onClick={() => onViewMode("list")}
                className={`inline-flex h-11 w-11 items-center justify-center ${viewMode === "list" ? "bg-ink text-paper" : "text-ink hover:bg-[#E6E7E1]"}`}
              >
                <List size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
                onClick={() => onViewMode("grid")}
                className={`inline-flex h-11 w-11 items-center justify-center border-l border-line-strong ${viewMode === "grid" ? "bg-ink text-paper" : "text-ink hover:bg-[#E6E7E1]"}`}
              >
                <Grid2X2 size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={MONO_META} aria-live="polite">
              {loading
                ? "Loading components…"
                : error
                  ? "Catalogue unavailable"
                  : `${items.length} records on this page${categoryId && categoryMap.get(categoryId) ? ` · ${categoryMap.get(categoryId)}` : ""}`}
            </span>
            {filtered && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-[44px] items-center gap-1 font-mono text-xs uppercase tracking-[0.06em] text-signal-text hover:text-signal-hover"
              >
                <X size={14} aria-hidden="true" /> Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <CardSkeletonGrid count={6} variant="inventory" />
          ) : error ? (
            <EmptyState
              role="alert"
              title="Unable to load inventory"
              action={
                <button
                  type="button"
                  className="nb-btn nb-btn-primary"
                  onClick={onRetry}
                >
                  Try again
                </button>
              }
            >
              {error}
            </EmptyState>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title={
                filtered
                  ? "No matching components"
                  : "Your catalogue starts here"
              }
              action={
                filtered ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="nb-btn nb-btn-secondary"
                  >
                    Clear filters
                  </button>
                ) : (
                  canEdit && (
                    <button
                      type="button"
                      onClick={onCreate}
                      className="nb-btn nb-btn-primary"
                    >
                      Add first component
                    </button>
                  )
                )
              }
            >
              {filtered
                ? "Try another search or clear your filters."
                : "Components will appear here once added to the lab inventory."}
            </EmptyState>
          ) : viewMode === "list" ? (
            <InventoryTable
              items={items}
              categoryMap={categoryMap}
              {...actions}
            />
          ) : (
            <div className="flex flex-col gap-10">
              {[...groups].map(([id, group]) => (
                <section
                  key={id}
                  aria-label={group.name}
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">
                    <span className="text-ink">{group.name}</span>
                    <span>{group.items.length} on this page</span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
                    {group.items.map((item) => (
                      <EquipmentCard
                        key={item._id}
                        item={item}
                        category={group.name}
                        {...actions}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
            <span>
              {!loading && !error && pagination.total > 0
                ? `Showing ${skip + 1}–${skip + items.length} of ${pagination.total}`
                : "Lab catalogue"}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="inventory-limit" className="nb-sr-only">
                Components per page
              </label>
              <select
                id="inventory-limit"
                value={limit}
                onChange={(e) => onLimit(Number(e.target.value))}
                className="nb-input h-11 w-[136px] shrink-0 pr-8 font-mono text-xs"
              >
                {[10, 20, 30, 40, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="nb-btn nb-btn-secondary h-11 px-3 font-mono text-xs font-medium"
                disabled={skip === 0 || loading}
                onClick={() => onSkip(Math.max(0, skip - limit))}
                aria-label="Previous page"
              >
                ← Prev
              </button>
              <button
                type="button"
                className="nb-btn nb-btn-secondary h-11 px-3 font-mono text-xs font-medium"
                disabled={!pagination.hasMore || loading || Boolean(error)}
                onClick={() => onSkip(skip + limit)}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
