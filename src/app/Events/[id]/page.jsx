"use client";
import { useState, useEffect, Fragment } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Copy, ExternalLink, Link2, Share2, Star, X } from "lucide-react";
import RemoteImage from "@/components/RemoteImage";
import { DetailPageSkeleton } from "@/components/PageSkeletons";
import CropFrame from "@/components/lab/CropFrame";
import BlueprintPlaceholder from "@/components/lab/BlueprintPlaceholder";
import { API_BASE_URL, apiRequest } from "@/lib/api";
import { combineDateTime, dateParts, eventTypeChip, formatClock, titleCase } from "@/lib/labUi";
import NotFoundState from "@/components/lab/NotFoundState";

const STATUS = {
  upcoming: { label: "Upcoming", chip: "nb-chip-blue" },
  ongoing: { label: "Happening now", chip: "nb-chip-signal" },
  completed: { label: "Completed", chip: "nb-chip-green" },
  cancelled: { label: "Cancelled", chip: "nb-chip-red" },
  closed: { label: "Registration closed", chip: "nb-chip-amber" },
  unknown: { label: "Scheduled", chip: "nb-chip-outline" },
};

const REGISTRATION = {
  open: { label: "Registration open", dot: "bg-[#22C55E]" },
  full: { label: "Registration full", dot: "bg-[#EF4444]" },
  closed: { label: "Registration closed", dot: "bg-[#F59E0B]" },
  cancelled: { label: "Event cancelled", dot: "bg-[#EF4444]" },
  completed: { label: "Event completed", dot: "bg-night-muted" },
};

const REGISTRATION_NOTE = {
  full: "This event is at full capacity. Check back later for cancellations.",
  closed: "The registration deadline has passed.",
  cancelled: "This event has been cancelled.",
  completed: "This event has already taken place.",
};

// Render **bold** markers from the event description as <strong>.
function RichText({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part) ? (
      <strong key={i} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

function SectionHeading({ children }) {
  return <h2 className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">{children}</h2>;
}

function SpecCell({ label, children }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div className="nb-card flex flex-col gap-1.5 px-5 py-4">
      <dt className="font-mono text-xs uppercase tracking-[0.04em] text-ink-muted">{label}</dt>
      <dd className="m-0 text-[15px] font-semibold">{children}</dd>
    </div>
  );
}

// Image URL helpers (align with Gallery handling)
const isCloudinaryUrl = (url) => typeof url === "string" && /https?:\/\/res\.cloudinary\.com\//.test(url);
const sanitizeCloudinaryExtension = (url) => {
  if (!url) return url;
  return url.replace(/\.(tif|tiff)(\?|#|$)/i, ".jpg$2");
};
const transformCloudinaryUrl = (url, { width, height, crop = "fill", quality = "auto", format = "auto" } = {}) => {
  if (!isCloudinaryUrl(url)) return url;
  const safeUrl = sanitizeCloudinaryExtension(url);
  const transforms = [
    `f_${format}`,
    `q_${quality}`,
    width || height ? `c_${crop}` : null,
    width ? `w_${width}` : null,
    height ? `h_${height}` : null,
  ]
    .filter(Boolean)
    .join(",");
  return safeUrl.replace("/image/upload/", `/image/upload/${transforms}/`);
};
const getEventImageUrl = (url, opts = {}) => {
  if (!url) return null;
  return transformCloudinaryUrl(url, opts) || null;
};

const formatLongDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

const formatDateTime = (dateString) =>
  new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const sameDay = (a, b) => a && b && new Date(a).toDateString() === new Date(b).toDateString();

const EventDetail = () => {
  const params = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegistering] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await apiRequest(`${API_BASE_URL}/events/${params.id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch event");
        const data = await res.json();
        if (data.success) {
          setEvent(data.data.item);
        } else {
          throw new Error(data.message || "Failed to fetch event");
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching event:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchEvent();
    }
  }, [params.id]);

  useEffect(() => {
    if (!event) return;

    // Determine target date - use registration deadline if available, otherwise start date with time
    let targetDate = null;
    if (event.registrationDeadline) {
      targetDate = new Date(event.registrationDeadline);
    } else if (event.startDate) {
      targetDate = combineDateTime(event.startDate, event.startTime);
    }

    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return { diff, days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsImageOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const computeDerivedStatus = () => {
    if (!event) return "unknown";
    if (event.status === "cancelled") return "cancelled";
    const now = new Date();
    // Combine date and time for accurate comparison
    const start = event.startDate ? combineDateTime(event.startDate, event.startTime) : null;
    const end = event.endDate ? combineDateTime(event.endDate, event.endTime) : null;
    if (start && now < start) return "upcoming";
    if (start && end && now >= start && now <= end) return "ongoing";
    if (end && now > end) return "completed";
    // Fallbacks if dates missing
    if (start && !end && now >= start) return "ongoing";
    return "unknown";
  };

  const getEffectiveStatus = () => {
    const derived = computeDerivedStatus();
    if (derived === "upcoming" && event?.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);
      if (deadline <= new Date()) return "closed";
    }
    return derived;
  };

  const isRegistrationOpen = () => {
    if (!event) return false;
    if (event.status === "cancelled" || event.status === "completed") return false;
    if (event.registrationDeadline) {
      return new Date(event.registrationDeadline) > new Date();
    }
    return event.status === "upcoming";
  };

  const isEventFull = () => {
    if (!event) return false;
    return event.maxCapacity && event.currentRegistrations >= event.maxCapacity;
  };

  const getRegistrationStatus = () => {
    if (!event) return "unknown";
    const effective = getEffectiveStatus();
    if (effective === "cancelled") return "cancelled";
    if (effective === "completed") return "completed";
    if (isEventFull()) return "full";
    if (!isRegistrationOpen()) return "closed";
    return "open";
  };

  if (loading) {
    return <DetailPageSkeleton className="nb-dark" />;
  }

  if (error || !event) {
    return (
      <NotFoundState
        title="Event not found"
        message={error || "The event you are looking for does not exist."}
        gameLabel="Event not found"
        actions={
          <Link href="/Events" className="nb-btn nb-btn-primary">
            Back to events
          </Link>
        }
      />
    );
  }

  const effectiveStatus = getEffectiveStatus();
  const status = STATUS[effectiveStatus] || STATUS.unknown;
  const registrationStatus = getRegistrationStatus();
  const registration = REGISTRATION[registrationStatus] || REGISTRATION.closed;
  const imageUrl = getEventImageUrl(event.imageUrl, { width: 1600 });
  const { month, day, weekday } = dateParts(event.startDate);
  const startClock = formatClock(event.startTime);
  const endClock = formatClock(event.endTime);
  const timeText = startClock && endClock ? `${startClock} – ${endClock}` : startClock;
  const multiDay = event.endDate && !sameDay(event.startDate, event.endDate);
  const description = event.description || "";
  const leadIsWholeDescription = description.length <= 200 && !description.includes("\n");
  const showCountdown = (event.registrationDeadline || event.startDate) && timeLeft && timeLeft.diff > 0;
  const canRegister = event.requiresRegistration && registrationStatus === "open";

  const sampleLinks = Array.isArray(event.sampleLinks)
    ? event.sampleLinks.map((link, idx) => ({
        href:
          typeof link?.url === "string" && /^(https?:)?\/\//i.test(link.url) ? link.url : `https://${link?.url || ""}`,
        label: link?.label || `Link ${idx + 1}`,
      }))
    : [];

  const openRegistration = () => {
    if (event?.registrationFormLink) {
      window.open(event.registrationFormLink, "_blank", "noopener,noreferrer");
    } else {
      console.warn("No registration form link available for this event");
    }
  };

  const shareEvent = () =>
    navigator.share &&
    navigator.share({
      title: event.title,
      text: description,
      url: window.location.href,
    });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy link:", e);
    }
  };

  const renderRegisterButton = (className = "") => (
    <button type="button" disabled={isRegistering} onClick={openRegistration} className={`nb-btn nb-btn-accent ${className}`}>
      {isRegistering ? "Processing…" : "Register for event"}
      <ExternalLink size={16} aria-hidden="true" />
    </button>
  );

  return (
    <>
      <main className="nb-dark bg-paper text-ink">
        <div className="nb-container flex flex-col gap-7 pt-10">
          <Link
            href="/Events"
            className="inline-flex min-h-[44px] items-center gap-2 self-start font-mono text-xs uppercase tracking-[0.06em] text-ink-muted no-underline hover:text-ink"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Back to events
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {event.type && <span className={`nb-chip ${eventTypeChip(event.type)}`}>{titleCase(event.type)}</span>}
                <span className={`nb-chip ${status.chip}`}>{status.label}</span>
                {event.category && <span className="nb-chip nb-chip-outline">{titleCase(event.category)}</span>}
                {event.isFeatured && (
                  <span className="nb-chip nb-chip-outline inline-flex items-center gap-1">
                    <Star size={11} aria-hidden="true" /> Featured
                  </span>
                )}
              </div>
              <h1 className="nb-h1 m-0">{event.title}</h1>
              {description && leadIsWholeDescription && (
                <p className="m-0 max-w-[680px] text-lg leading-relaxed text-ink-muted">
                  <RichText text={description} />
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {canRegister && renderRegisterButton()}
              <button type="button" onClick={copyLink} className="nb-btn nb-btn-secondary">
                {linkCopied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {linkCopied ? "Link copied" : "Copy link"}
              </button>
            </div>
          </div>

          <CropFrame
            caption={`Fig. 01 — ${event.title}`}
            captionRight={event.location ? event.location : undefined}
          >
            {imageUrl && !imageFailed ? (
              <button
                type="button"
                onClick={() => setIsImageOpen(true)}
                className="block w-full cursor-zoom-in rounded"
                aria-label="Open full-size image"
              >
                <RemoteImage
                  src={imageUrl}
                  alt={event.title || "Event image"}
                  className="block h-[280px] w-full rounded object-cover sm:h-[480px]"
                  onError={() => setImageFailed(true)}
                />
              </button>
            ) : (
              <BlueprintPlaceholder className="h-[240px] rounded sm:h-[360px]" />
            )}
          </CropFrame>
        </div>

        <div className="nb-container flex flex-wrap items-start gap-16 pb-28 pt-16">
          <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-14">
            {description && !leadIsWholeDescription && (
              <section className="flex flex-col gap-5">
                <SectionHeading>About this event</SectionHeading>
                <p className="m-0 whitespace-pre-line text-[17px] leading-[1.7] text-ink-body">
                  <RichText text={description} />
                </p>
              </section>
            )}

            <section className="flex flex-col gap-5">
              <SectionHeading>When &amp; where</SectionHeading>
              <div className="nb-card flex flex-wrap items-center gap-x-6 gap-y-4 p-5">
                <span className="flex w-[76px] shrink-0 flex-col items-center border-r border-line-soft pr-5">
                  <span className="font-mono text-[11px] tracking-[0.08em] text-signal-text">{month}</span>
                  <span className="font-display text-[32px] font-semibold leading-[1.1]">{day}</span>
                  <span className="font-mono text-[11px] text-ink-muted">{weekday}</span>
                </span>
                <span className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
                  <span className="text-[17px] font-semibold">
                    {event.startDate ? formatLongDate(event.startDate) : "Date to be announced"}
                    {multiDay ? ` – ${formatLongDate(event.endDate)}` : ""}
                  </span>
                  {(timeText || event.location) && (
                    <span className="text-[15px] text-ink-muted">{[timeText, event.location].filter(Boolean).join(" · ")}</span>
                  )}
                </span>
              </div>
              <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <SpecCell label="Status">{status.label}</SpecCell>
                <SpecCell label="Type">{event.type ? titleCase(event.type) : null}</SpecCell>
                <SpecCell label="Category">
                  {event.category && event.category !== event.type ? titleCase(event.category) : null}
                </SpecCell>
                <SpecCell label="Capacity">{event.maxCapacity ? `${event.maxCapacity} seats` : "Open"}</SpecCell>
                <SpecCell label="Registration">
                  {event.requiresRegistration ? registration.label.replace("Registration ", "") : "Not required"}
                </SpecCell>
                <SpecCell label="Deadline">
                  {event.registrationDeadline ? formatDateTime(event.registrationDeadline) : null}
                </SpecCell>
                <SpecCell label="Organizer">{event.organizerId ? "NewtonBotics" : null}</SpecCell>
              </dl>
            </section>

            {sampleLinks.length > 0 && (
              <section className="flex flex-col gap-5">
                <SectionHeading>Resources &amp; links</SectionHeading>
                <ul className="m-0 flex list-none flex-col border-t border-line p-0">
                  {sampleLinks.map((link, idx) => (
                    <li key={`${link.label}-${idx}`} className="border-b border-line">
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="group flex min-h-14 items-center justify-between gap-4 py-3 text-ink no-underline"
                      >
                        <span className="flex min-w-0 items-center gap-4">
                          <span className="w-7 font-mono text-[13px] text-signal-text">{String(idx + 1).padStart(2, "0")}</span>
                          <Link2 size={16} aria-hidden="true" className="shrink-0 text-ink-muted" />
                          <span className="truncate font-semibold group-hover:text-signal-text">{link.label}</span>
                        </span>
                        <ExternalLink size={16} aria-hidden="true" className="shrink-0 text-ink-muted" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Registration Section - Only show if registration is required */}
            {event.requiresRegistration && (
              <section className="flex flex-col gap-5">
                <SectionHeading>Registration</SectionHeading>
                <div className="nb-card flex flex-col gap-4 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2.5 font-semibold">
                      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${registration.dot}`} />
                      {registration.label}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
                      Capacity: {event.maxCapacity || "Open"}
                    </span>
                  </div>
                  {REGISTRATION_NOTE[registrationStatus] && (
                    <p className="m-0 text-[15px] text-ink-muted">{REGISTRATION_NOTE[registrationStatus]}</p>
                  )}
                  {event.registrationDeadline && (
                    <p className="m-0 text-[15px] text-ink-muted">
                      Deadline: <span className="font-semibold text-ink">{formatDateTime(event.registrationDeadline)}</span>
                    </p>
                  )}
                  {registrationStatus === "open" && renderRegisterButton("self-start")}
                </div>
              </section>
            )}
          </article>

          {/* Offset by one section heading (42px line + 20px gap) so the first card lines up
              with the first content card in the main column, not with its heading. */}
          <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4 lg:mt-[62px]">
            {showCountdown && (
              <div className="flex flex-col gap-4 rounded-lg bg-ink p-6 text-night-text">
                <span className="font-mono text-xs uppercase tracking-[0.06em] text-signal-light">
                  {event.registrationDeadline ? "Registration closes in" : "Starts in"}
                </span>
                <div className="grid grid-cols-4 gap-2" role="timer" aria-live="off">
                  {[
                    { label: "Days", value: timeLeft.days },
                    { label: "Hrs", value: timeLeft.hours },
                    { label: "Min", value: timeLeft.minutes },
                    { label: "Sec", value: timeLeft.seconds },
                  ].map((unit) => (
                    <div key={unit.label} className="flex flex-col items-center rounded-md border border-night-line py-2.5">
                      <span className="font-display text-[26px] font-semibold tabular-nums leading-tight">
                        {String(unit.value).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-[11px] uppercase text-night-muted">{unit.label}</span>
                    </div>
                  ))}
                </div>
                {canRegister && renderRegisterButton("w-full")}
              </div>
            )}

            <div className="nb-card flex flex-col gap-3 p-6">
              <span className="font-mono text-xs uppercase tracking-[0.04em] text-ink-muted">Share event</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={shareEvent} className="nb-btn nb-btn-primary nb-btn-sm h-11 flex-1">
                  <Share2 size={16} aria-hidden="true" /> Share
                </button>
                <button type="button" onClick={copyLink} className="nb-btn nb-btn-secondary nb-btn-sm h-11 flex-1">
                  {linkCopied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                  {linkCopied ? "Copied" : "Copy link"}
                </button>
              </div>
              {linkCopied && (
                <span role="status" className="text-[13px] text-[#166534]">
                  Link copied to clipboard
                </span>
              )}
            </div>

            <Link href="/Events" className="nb-link self-start py-2 text-sm">
              ← All events
            </Link>
          </aside>
        </div>
      </main>

      {isImageOpen && imageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={event.title || "Event image"}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/85 p-4"
          onClick={() => setIsImageOpen(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsImageOpen(false)}
              className="absolute -right-3 -top-3 grid h-11 w-11 place-items-center rounded-full bg-surface text-ink hover:bg-paper"
              aria-label="Close image"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <img
              src={getEventImageUrl(event.imageUrl)}
              alt={event.title || "Event image full size"}
              className="max-h-[80vh] max-w-[90vw] cursor-zoom-out rounded-lg object-contain"
              onClick={() => setIsImageOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default EventDetail;
