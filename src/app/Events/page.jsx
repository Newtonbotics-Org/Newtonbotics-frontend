"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, Star, X } from "lucide-react";
import RemoteImage from "@/components/RemoteImage";
import BlueprintPlaceholder from "@/components/lab/BlueprintPlaceholder";
import EmptyLog from "@/components/lab/EmptyLog";
import { API_BASE_URL, apiRequest } from "@/lib/api";
import { combineDateTime, dateParts, eventTypeChip, formatClock, formatDate, titleCase } from "@/lib/labUi";
import NoMatchCard from "@/components/lab/NoMatchCard";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const STATUS_CHIP = {
  ongoing: { label: "Happening now", chip: "nb-chip-signal" },
  cancelled: { label: "Cancelled", chip: "nb-chip-red" },
};

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Determine status from dates when possible so UI stays consistent
const getDerivedStatus = (event) => {
  if (!event) return "upcoming";
  if (event.status === "cancelled") return "cancelled";
  const now = new Date();
  const start = event.startDate ? combineDateTime(event.startDate, event.startTime) : null;
  const end = event.endDate ? combineDateTime(event.endDate, event.endTime) : null;
  if (start && end) {
    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "ongoing";
    if (now > end) return "completed";
  }
  if (start) {
    return now < start ? "upcoming" : "ongoing";
  }
  return event.status || "upcoming";
};

const isUpcoming = (event) => ["upcoming", "ongoing"].includes(getDerivedStatus(event));

const startTime = (event) => combineDateTime(event.startDate, event.startTime)?.getTime() ?? 0;

// Compute available seats text
const getAvailabilityText = (event) => {
  const max = typeof event?.maxCapacity === "number" ? event.maxCapacity : null;
  const current = typeof event?.currentRegistrations === "number" ? event.currentRegistrations : 0;
  if (max === null) return null; // no cap → omit
  const available = Math.max(0, max - current);
  return available === 0 ? "Sold out" : `${available} seats left`;
};

const timeRange = (event) => {
  const start = formatClock(event.startTime);
  const end = formatClock(event.endTime);
  if (start && end) return `${start} – ${end}`;
  return start;
};

const plainText = (text = "") => text.replace(/\*\*(.+?)\*\*/g, "$1");

// Cloudinary helpers: browsers can't render .tif/.tiff, so ask Cloudinary for an auto format.
const getEventImageUrl = (url, width = 1200) => {
  if (!url) return null;
  if (!/https?:\/\/res\.cloudinary\.com\//.test(url)) return url;
  const safe = url.replace(/\.(tif|tiff)(\?|#|$)/i, ".jpg$2");
  return safe.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_fill,w_${width}/`);
};

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [when, setWhen] = useState("upcoming");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, skip: 0, hasMore: false });
  const debouncedQuery = useDebounced(searchQuery.trim());

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (selectedType !== "all") params.append("type", selectedType);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (showFeaturedOnly) params.append("isFeatured", "true");
      if (debouncedQuery) params.append("q", debouncedQuery);
      params.append("limit", "100"); // Get more events for better filtering

      const res = await apiRequest(`${API_BASE_URL}/events?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      if (data.success) {
        const items = data.data.items || [];
        setEvents(items);
        setPagination(data.data.pagination || {});
        // The unfiltered response doubles as the source for filter options, the
        // featured spotlight and the calendar, so no second request is needed.
        if (![...params.keys()].some((k) => k !== "limit")) {
          setAllEvents(items);
          setCategories([...new Set(items.map((e) => e.category).filter(Boolean))].sort());
          setTypes([...new Set(items.map((e) => e.type).filter(Boolean))].sort());
        }
      } else {
        throw new Error(data.message || "Failed to fetch events");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setEvents([]);
      setError(err.message || "Events could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedCategory, showFeaturedOnly, debouncedQuery]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);


  const upcomingEvents = useMemo(
    () => events.filter(isUpcoming).sort((a, b) => startTime(a) - startTime(b)),
    [events]
  );
  const pastEvents = useMemo(
    () => events.filter((e) => !isUpcoming(e)).sort((a, b) => startTime(b) - startTime(a)),
    [events]
  );
  const visibleEvents = when === "upcoming" ? upcomingEvents : pastEvents;

  // Spotlight: every upcoming featured event (soonest first). With none, fall back to a
  // single card: the next event, else the most recent featured/past one.
  const spotlight = useMemo(() => {
    const upcoming = allEvents.filter(isUpcoming).sort((a, b) => startTime(a) - startTime(b));
    const featuredUpcoming = upcoming.filter((e) => e.isFeatured);
    if (featuredUpcoming.length) return featuredUpcoming;
    const past = allEvents.filter((e) => !isUpcoming(e) && e.status !== "cancelled").sort((a, b) => startTime(b) - startTime(a));
    const fallback = upcoming[0] || past.find((e) => e.isFeatured) || past[0];
    return fallback ? [fallback] : [];
  }, [allEvents]);
  const slides = spotlight.slice(0, 6);

  const clearFilters = () => {
    setSelectedType("all");
    setSelectedCategory("all");
    setShowFeaturedOnly(false);
    setSearchQuery("");
  };

  const hasActiveFilters = selectedType !== "all" || selectedCategory !== "all" || showFeaturedOnly || searchQuery;

  return (
    <main className="nb-dark bg-paper text-ink">
      <header className="nb-blueprint border-b border-line">
        <div className="nb-container flex flex-col gap-5 pb-14 pt-16 sm:pt-20">
          <span className="nb-eyebrow">
            <span className="nb-eyebrow-num">[04]</span> Events &amp; workshops
          </span>
          <h1 className="nb-h1 m-0 max-w-[820px]">Learn it on Tuesday. Race it on Saturday.</h1>
          <p className="m-0 max-w-[620px] text-lg leading-relaxed text-ink-muted">
            Hands-on workshops, competitions and talks, open to every student.
          </p>
        </div>
      </header>

      {slides.length > 0 && (
        <section className="nb-container pt-10" aria-label={slides.length > 1 ? "Featured events" : "Featured event"}>
          {slides.length > 1 ? <FeaturedCarousel events={slides} /> : <FeaturedEvent event={slides[0]} />}
        </section>
      )}

      <div className="nb-container flex flex-wrap items-start gap-12 pb-28 pt-12">
        <div id="events-list" className="flex min-w-0 scroll-mt-24 flex-[999_1_600px] flex-col gap-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div role="tablist" aria-label="When" className="flex rounded-lg bg-[#E6E7E1] p-1">
              {[
                { id: "upcoming", label: "Upcoming", count: upcomingEvents.length },
                { id: "past", label: "Past", count: pastEvents.length },
              ].map((tab) => {
                const active = when === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setWhen(tab.id)}
                    className={`h-10 rounded-md px-[18px] text-sm transition-colors ${
                      active ? "bg-surface font-semibold text-ink shadow-[0_1px_2px_rgba(14,16,19,0.08)]" : "font-medium text-ink-muted hover:text-ink"
                    }`}
                  >
                    {tab.label}
                    {!loading && <span className="ml-1.5 font-mono text-xs text-ink-muted">{tab.count}</span>}
                  </button>
                );
              })}
            </div>

            {types.length > 0 && (
              <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-2">
                {["all", ...types].map((t) => {
                  const active = selectedType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedType(t)}
                      className={`nb-pill h-10 ${active ? "nb-pill-active" : ""}`}
                    >
                      {t === "all" ? "All types" : titleCase(t)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="relative min-w-0 flex-[1_1_220px]">
              <label htmlFor="events-search" className="nb-sr-only">
                Search events
              </label>
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
              />
              <input
                id="events-search"
                type="search"
                placeholder="Search events…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nb-input h-11 pl-10 text-sm"
              />
            </div>
            <label htmlFor="events-category" className="nb-sr-only">
              Category
            </label>
            <select
              id="events-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="nb-input h-11 w-[180px] shrink-0 truncate pr-8 text-sm"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {titleCase(c)}
                </option>
              ))}
            </select>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className="h-[18px] w-[18px] accent-ink"
              />
              Featured only
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
            {!loading && !error ? (
              <span aria-live="polite">
                {visibleEvents.length} {when} event{visibleEvents.length === 1 ? "" : "s"}
                {pagination.total > events.length ? ` · ${events.length} of ${pagination.total} loaded` : ""}
              </span>
            ) : (
              <span />
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-11 items-center gap-1 font-mono text-xs uppercase tracking-[0.06em] text-signal-text hover:text-signal-hover"
              >
                <X size={14} aria-hidden="true" /> Clear filters
              </button>
            )}
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex flex-col gap-3" role="status" aria-label="Loading events">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="nb-card h-[124px] animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="nb-card flex flex-col items-start gap-4 p-10">
              <h2 className="m-0 font-display text-2xl font-semibold">Events couldn&apos;t be loaded</h2>
              <p className="m-0 text-ink-muted">{error}</p>
              <button type="button" onClick={fetchEvents} className="nb-btn nb-btn-primary">
                Try again
              </button>
            </div>
          ) : visibleEvents.length === 0 ? (
            <EmptyState
              when={when}
              hasActiveFilters={hasActiveFilters}
              pastCount={pastEvents.length}
              onShowPast={() => setWhen("past")}
              onClear={clearFilters}
            />
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {visibleEvents.map((event) => (
                <li key={event._id}>
                  <EventRow event={event} past={when === "past"} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <MiniCalendar events={allEvents} />
          <div className="flex flex-col gap-3 rounded-lg bg-signal p-6 text-ink">
            <span className="font-display text-[22px] font-semibold leading-tight">Want to run a workshop?</span>
            <span className="text-sm leading-relaxed">
              Members can propose a session. We&apos;ll handle the room, kits and promotion.
            </span>
            <Link href="/contact" className="nb-btn nb-btn-primary nb-btn-sm h-11 self-start no-underline">
              Propose a session
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
};

const SLIDE_MS = 6000;

/**
 * Auto-advancing featured slideshow. Pauses on hover/focus and when the tab is
 * hidden; never auto-advances for reduced-motion users. All slides share one
 * grid cell so the height stays fixed while they crossfade.
 */
function FeaturedCarousel({ events }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const count = events.length;
  const paused = hovered || focused || hidden || reduceMotion;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mq.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const id = setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => clearTimeout(id);
  }, [index, paused, count]);

  const go = (next) => setIndex(((next % count) + count) % count);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured events"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid">
        {events.map((event, i) => {
          const active = i === index;
          return (
            <div
              key={event._id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={`flex transition-opacity duration-700 ease-out [grid-area:1/1] motion-reduce:transition-none ${
                active ? "z-10 opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <FeaturedEvent event={event} />
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex min-w-0 flex-1 gap-1.5">
          {events.map((event, i) => (
            <button
              key={event._id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show featured event ${i + 1}: ${event.title}`}
              aria-current={i === index ? "true" : undefined}
              className="group flex h-11 min-w-0 flex-1 items-center"
            >
              <span className="relative h-1 w-full overflow-hidden rounded-full bg-line">
                <span
                  key={i === index ? `active-${index}` : `idle-${i}`}
                  className={`absolute inset-y-0 left-0 rounded-full bg-signal ${
                    i < index ? "w-full" : i === index ? (paused ? "w-full" : "nb-slide-progress") : "w-0"
                  }`}
                  style={i === index && !paused ? { animationDuration: `${SLIDE_MS}ms` } : undefined}
                />
              </span>
            </button>
          ))}
        </div>
        <span className="font-mono text-xs tabular-nums text-ink-muted" aria-live={paused ? "polite" : "off"}>
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous featured event"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink hover:border-ink"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next featured event"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink hover:border-ink"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FeaturedEvent({ event }) {
  const [imageFailed, setImageFailed] = useState(false);
  const status = getDerivedStatus(event);
  const upcoming = status === "upcoming" || status === "ongoing";
  const imageUrl = getEventImageUrl(event.imageUrl);
  const time = timeRange(event);
  const label = event.isFeatured ? "Featured" : upcoming ? "Next up" : "Latest";

  return (
    <Link
      href={`/Events/${event._id}`}
      className="group flex w-full flex-wrap overflow-hidden rounded-lg bg-ink text-night-text no-underline lg:h-[500px] lg:flex-nowrap"
    >
      {imageUrl && !imageFailed ? (
        <RemoteImage
          src={imageUrl}
          alt=""
          className="block h-[260px] min-w-0 flex-[1_1_420px] self-stretch object-cover object-[center_35%] sm:h-[340px] lg:h-full"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <BlueprintPlaceholder className="h-[260px] min-w-0 flex-[1_1_420px] self-stretch sm:h-[340px] lg:h-full" />
      )}
      <span className="flex min-w-0 flex-[1_1_420px] flex-col gap-[18px] overflow-hidden p-6 sm:p-10">
        <span className="flex flex-wrap gap-2">
          <span className="nb-chip bg-signal text-ink">{label}</span>
          {event.type && (
            <span className="nb-chip border border-night-line-strong px-[7px] py-[3px] text-night-soft">
              {titleCase(event.type)}
            </span>
          )}
          {!upcoming && (
            <span className="nb-chip border border-night-line-strong px-[7px] py-[3px] text-night-soft">
              {status === "cancelled" ? "Cancelled" : "Past event"}
            </span>
          )}
        </span>
        <span className="line-clamp-2 font-display text-[clamp(2rem,3.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] group-hover:text-signal-light">
          {event.title}
        </span>
        {event.description && (
          <span className="line-clamp-3 text-base leading-relaxed text-night-muted">{plainText(event.description)}</span>
        )}
        <dl className="m-0 mt-2 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4 border-t border-night-line pt-5">
          <div>
            <dt className="font-mono text-[11px] uppercase text-night-muted">Date</dt>
            <dd className="m-0 mt-1 font-semibold">
              {formatDate(event.startDate, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) || "TBA"}
            </dd>
          </div>
          {time && (
            <div>
              <dt className="font-mono text-[11px] uppercase text-night-muted">Time</dt>
              <dd className="m-0 mt-1 font-semibold">{time}</dd>
            </div>
          )}
          {event.location && (
            <div>
              <dt className="font-mono text-[11px] uppercase text-night-muted">Where</dt>
              <dd className="m-0 mt-1 font-semibold">{event.location}</dd>
            </div>
          )}
          {upcoming && getAvailabilityText(event) && (
            <div>
              <dt className="font-mono text-[11px] uppercase text-night-muted">Seats</dt>
              <dd className="m-0 mt-1 font-semibold">{getAvailabilityText(event)}</dd>
            </div>
          )}
        </dl>
        <span className="nb-btn nb-btn-accent mt-auto self-start">
          {upcoming && event.requiresRegistration ? "Register" : upcoming ? "Event details" : "See what happened"}
        </span>
      </span>
    </Link>
  );
}

function EventRow({ event, past }) {
  const { month, day, weekday } = dateParts(event.startDate);
  const year = event.startDate ? String(new Date(event.startDate).getFullYear()) : "";
  const status = getDerivedStatus(event);
  const statusChip = STATUS_CHIP[status];
  const meta = [event.location, timeRange(event), event.category && titleCase(event.category)].filter(Boolean).join(" · ");
  const seats = past ? null : getAvailabilityText(event);

  return (
    <Link
      href={`/Events/${event._id}`}
      className="nb-card nb-card-hover group flex flex-wrap items-center gap-x-6 gap-y-4 p-5 text-ink no-underline"
    >
      <span className="flex w-[76px] shrink-0 flex-col items-center border-r border-line-soft pr-5">
        <span className={`font-mono text-[11px] tracking-[0.08em] ${past ? "text-ink-muted" : "text-signal-text"}`}>{month}</span>
        <span className="font-display text-[32px] font-semibold leading-[1.1]">{day}</span>
        <span className="font-mono text-[11px] text-ink-muted">{past ? year : weekday}</span>
      </span>
      <span className="flex min-w-0 flex-[1_1_280px] flex-col items-start gap-1.5">
        <span className="flex flex-wrap gap-2">
          {event.type && <span className={`nb-chip ${eventTypeChip(event.type)}`}>{titleCase(event.type)}</span>}
          {statusChip && <span className={`nb-chip ${statusChip.chip}`}>{statusChip.label}</span>}
          {event.isFeatured && (
            <span className="nb-chip nb-chip-outline inline-flex items-center gap-1">
              <Star size={11} aria-hidden="true" /> Featured
            </span>
          )}
        </span>
        <span className="font-display text-[21px] font-semibold leading-snug group-hover:text-signal-text">{event.title}</span>
        {meta && <span className="text-sm text-ink-muted">{meta}</span>}
      </span>
      <span className="flex flex-col items-end gap-2">
        {seats && <span className="font-mono text-xs text-ink-muted">{seats}</span>}
        <span className="nb-btn nb-btn-outline nb-btn-sm h-11">
          {!past && event.requiresRegistration ? "Register" : "Details"}
        </span>
      </span>
    </Link>
  );
}

function EmptyState({ when, hasActiveFilters, pastCount, onShowPast, onClear }) {
  if (when === "upcoming" && pastCount > 0) {
    return (
      <div className="nb-card flex flex-col items-start gap-4 p-8 sm:p-10">
        <span className="font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">Calendar is clear</span>
        <h2 className="m-0 font-display text-2xl font-semibold">Nothing scheduled right now.</h2>
        <p className="m-0 max-w-[520px] text-ink-muted">
          {hasActiveFilters
            ? "No upcoming events match these filters."
            : "New workshops and competitions are announced on Instagram first. In the meantime, browse what we've already run."}
        </p>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={onShowPast} className="nb-btn nb-btn-primary">
            See {pastCount} past event{pastCount === 1 ? "" : "s"}
          </button>
          <a
            href="https://www.instagram.com/newtonbotics_/"
            target="_blank"
            rel="noopener noreferrer"
            className="nb-btn nb-btn-secondary no-underline"
          >
            Follow @newtonbotics_
          </a>
        </div>
      </div>
    );
  }

  if (!hasActiveFilters) {
    return (
      <EmptyLog
        id="events-empty-title"
        eyebrow="Calendar empty · First event pending"
        title={when === "past" ? "No past events yet." : "Nothing scheduled yet."}
        scannerLabel="No events found · Jarvis is also waiting for the team to update"
        actions={
          <a
            href="https://www.instagram.com/newtonbotics_/"
            target="_blank"
            rel="noopener noreferrer"
            className="nb-btn nb-btn-primary no-underline"
          >
            Follow @newtonbotics_
          </a>
        }
      >
        Workshops, competitions and open lab sessions are announced on Instagram first. They&apos;ll be listed here
        with registration details as soon as they&apos;re published.
      </EmptyLog>
    );
  }

  return (
    <NoMatchCard title="No events found" hint="Try a different filter or search term." onClear={onClear} />
  );
}

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function MiniCalendar({ events }) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [jumped, setJumped] = useState(false);

  // Open on the month of the next event once events arrive.
  useEffect(() => {
    if (jumped || events.length === 0) return;
    const next = events
      .filter(isUpcoming)
      .map((e) => combineDateTime(e.startDate, e.startTime))
      .filter(Boolean)
      .sort((a, b) => a - b)[0];
    if (next) setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
    setJumped(true);
  }, [events, jumped]);

  // Map each calendar day to the first event running on it (multi-day events cover every day).
  const byDay = useMemo(() => {
    const map = new Map();
    events.forEach((e) => {
      if (!e.startDate || e.status === "cancelled") return;
      const start = new Date(e.startDate);
      const end = e.endDate ? new Date(e.endDate) : start;
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      for (let i = 0; i < 31 && d <= end; i += 1) {
        const key = dayKey(d);
        if (!map.has(key)) map.set(key, e);
        d.setDate(d.getDate() + 1);
      }
    });
    return map;
  }, [events]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });
  const monthEvents = useMemo(() => {
    const set = new Set();
    for (let d = 1; d <= daysInMonth; d += 1) {
      const e = byDay.get(dayKey(new Date(year, month, d)));
      if (e) set.add(e._id);
    }
    return set;
  }, [byDay, daysInMonth, month, year]);

  return (
    <div className="nb-card flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="m-0 font-display text-lg font-semibold" aria-live="polite">
          {monthLabel}
        </h2>
        <span className="flex gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="grid h-11 w-11 place-items-center rounded-md border border-line bg-surface hover:border-ink"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="grid h-11 w-11 place-items-center rounded-md border border-line bg-surface hover:border-ink"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-ink-subtle" aria-hidden="true">
            {w}
          </span>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`pad-${i}`} className="h-9" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = new Date(year, month, i + 1);
          const event = byDay.get(dayKey(date));
          const isToday = dayKey(date) === dayKey(today);
          const base = "flex h-9 items-center justify-center rounded-md";
          if (event) {
            return (
              <Link
                key={i}
                href={`/Events/${event._id}`}
                title={event.title}
                aria-label={`${formatDate(date, { day: "numeric", month: "long" })}: ${event.title}`}
                className={`${base} bg-signal font-medium text-ink no-underline hover:bg-signal-light ${
                  isToday ? "ring-1 ring-inset ring-ink" : ""
                }`}
              >
                {i + 1}
              </Link>
            );
          }
          return (
            <span key={i} className={`${base} ${isToday ? "font-medium text-ink shadow-[inset_0_0_0_1px_#0E1013]" : "text-ink-body"}`}>
              {i + 1}
            </span>
          );
        })}
      </div>
      <p className="m-0 border-t border-line-soft pt-3 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
        {monthEvents.size === 0
          ? "No events this month"
          : `${monthEvents.size} event${monthEvents.size === 1 ? "" : "s"} this month`}
      </p>
    </div>
  );
}

export default EventsPage;
