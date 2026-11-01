"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Instagram, Mail, Search, Star, X } from "lucide-react";
import newsService from "../../lib/news";
import { subscribeToNewsletter } from "../../lib/newsletter";
import clubData from "../AllDatas/data.json";
import RemoteImage from "@/components/RemoteImage";
import BlueprintPlaceholder from "@/components/lab/BlueprintPlaceholder";
import EmptyStateGame from "@/components/lab/EmptyStateGame";
import { formatDate } from "@/lib/labUi";
import NoMatchCard from "@/components/lab/NoMatchCard";

const instagramHandle = clubData?.contactInfo?.socialMedia?.instagram?.replace("@", "") || "newtonbotics_";
const instagramUrl = `https://www.instagram.com/${instagramHandle}/`;

const getAuthor = (news) => {
  const a = news.author;
  if (!a) return "NewtonBotics Team";
  if (typeof a === "string") return a;
  return a.name || [a.firstName, a.lastName].filter(Boolean).join(" ") || "NewtonBotics Team";
};

const getImageUrl = (news) => news.featuredImageUrl || news.image || "";

const newsDate = (news) => formatDate(news.publishedAt || news.createdAt);

const newsHref = (news) => `/News/${news._id || news.id}`;

const NewsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [allNews, setAllNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [categories, setCategories] = useState([]); // [{id,name}]
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterFirstName, setNewsletterFirstName] = useState("");
  const [newsletterLastName, setNewsletterLastName] = useState("");
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterMessageType, setNewsletterMessageType] = useState(""); // "success" or "error"
  const [newsletterStep, setNewsletterStep] = useState(1); // 1: email, 2: name, 3: success

  // Initial fetch from public API
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError("");

        // Fetch news first
        let items = [];
        try {
          const res = await newsService.listNews({ isPublished: true, limit: 50, skip: 0 });
          items = res?.items || [];
          if (isMounted) {
            setAllNews(items);
            setFilteredNews(items);
          }
        } catch (e) {
          console.error("Error loading news:", e);
          if (isMounted) {
            setError(e.message || "Failed to load news");
            setAllNews([]);
            setFilteredNews([]);
          }
        }

        // Fetch categories separately; do not block the news list if this fails
        try {
          const cats = await newsService.listCategories();
          if (isMounted) {
            setCategories([{ id: "All", name: "All" }, ...cats.map((c) => ({ id: c._id || c.id, name: c.name }))]);
          }
        } catch (catError) {
          console.error("Error loading categories:", catError);
          if (isMounted) {
            setCategories([{ id: "All", name: "All" }]);
            if (items.length > 0) {
              setError("");
            }
          }
        }
      } catch (e) {
        if (!isMounted) return;
        console.error("General error:", e);
        setError(e.message || "Failed to load news");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter news based on category and search query
  useEffect(() => {
    let filtered = allNews;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((news) => (news.categoryId || news.category?._id || "") === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((news) => {
        const title = (news.title || "").toLowerCase();
        const excerpt = (news.excerpt || "").toLowerCase();
        const content = (news.content || "").toLowerCase();
        const tags = (news.tags || []).map((t) => String(t).toLowerCase());
        return title.includes(q) || excerpt.includes(q) || content.includes(q) || tags.some((t) => t.includes(q));
      });
    }

    if (showFeaturedOnly) {
      filtered = filtered.filter((news) => news.isFeatured);
    }

    setFilteredNews(filtered);
  }, [selectedCategory, searchQuery, allNews, showFeaturedOnly]);

  const getCategoryName = (news) => {
    if (news.category?.name) return news.category.name;
    const match = categories.find((c) => c.id !== "All" && c.id === news.categoryId);
    return match?.name || "News";
  };

  const clearFilters = () => {
    setSelectedCategory("All");
    setSearchQuery("");
    setShowFeaturedOnly(false);
  };

  const hasActiveFilters = selectedCategory !== "All" || searchQuery || showFeaturedOnly;

  // Newsletter step handlers
  const handleEmailContinue = (e) => {
    e.preventDefault();

    if (!newsletterEmail.trim()) {
      setNewsletterMessage("Please enter your email address");
      setNewsletterMessageType("error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail.trim())) {
      setNewsletterMessage("Please enter a valid email address");
      setNewsletterMessageType("error");
      return;
    }

    setNewsletterMessage("");
    setNewsletterStep(2);
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();

    setIsNewsletterSubmitting(true);
    setNewsletterMessage("");

    try {
      const subscriptionData = {
        email: newsletterEmail.trim(),
        ...(newsletterFirstName.trim() && { firstName: newsletterFirstName.trim() }),
        ...(newsletterLastName.trim() && { lastName: newsletterLastName.trim() }),
      };

      await subscribeToNewsletter(subscriptionData);
      setNewsletterStep(3);
      setNewsletterMessage("Successfully subscribed to our newsletter!");
      setNewsletterMessageType("success");

      // Reset form after 3 seconds
      setTimeout(() => {
        setNewsletterEmail("");
        setNewsletterFirstName("");
        setNewsletterLastName("");
        setNewsletterStep(1);
        setNewsletterMessage("");
      }, 3000);
    } catch (error) {
      setNewsletterMessage(error.message || "Failed to subscribe. Please try again.");
      setNewsletterMessageType("error");
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };

  const handleBackToEmail = () => {
    setNewsletterStep(1);
    setNewsletterMessage("");
  };

  // Lead story: first featured article in the current view, else the newest one.
  const lead = filteredNews.find((n) => n.isFeatured) || filteredNews[0] || null;
  const rest = lead ? filteredNews.filter((n) => n !== lead) : [];
  const featuredCount = allNews.filter((n) => n.isFeatured).length;
  const hasNews = allNews.length > 0;

  return (
    <main className="nb-dark bg-paper text-ink">
      <header className="nb-blueprint border-b border-line">
        <div className="nb-container flex flex-col gap-5 pb-14 pt-16 sm:pt-20">
          <span className="nb-eyebrow">
            <span className="nb-eyebrow-num">[07]</span> News
          </span>
          <h1 className="nb-h1 m-0">Lab log.</h1>
          <p className="m-0 max-w-[640px] text-lg leading-relaxed text-ink-muted">
            Competition results, project milestones and announcements from the lab.
          </p>
          {hasNews && (
            <div className="mt-2 flex flex-wrap gap-8 font-mono text-[13px] text-ink-muted">
              <span>
                <strong className="font-medium text-ink">{allNews.length}</strong> article{allNews.length === 1 ? "" : "s"}
              </span>
              {featuredCount > 0 && (
                <span>
                  <strong className="font-medium text-ink">{featuredCount}</strong> featured
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="nb-container flex flex-col gap-16 pb-28 pt-10">
        {/* Filters — only when there is something to filter */}
        {hasNews && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {categories.length > 1 && (
                <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const active = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`nb-pill h-10 px-4 text-sm ${active ? "nb-pill-active" : ""}`}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="relative min-w-0 flex-[0_1_360px]">
                <label htmlFor="news-search" className="nb-sr-only">
                  Search news articles
                </label>
                <Search
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
                />
                <input
                  id="news-search"
                  type="search"
                  placeholder="Search by title, content, or tags…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="nb-input h-11 pl-10 text-sm"
                />
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
                <span aria-live="polite">
                  Showing {filteredNews.length} of {allNews.length}
                </span>
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
        )}

        {isLoading ? (
          <div className="flex flex-col gap-16" role="status" aria-label="Loading news">
            <div className="flex flex-wrap items-center gap-10">
              <div className="nb-card h-[320px] flex-[3_1_520px] animate-pulse sm:h-[440px]" />
              <div className="flex flex-[2_1_380px] flex-col gap-4">
                <div className="h-3 w-40 animate-pulse rounded bg-[#E6E7E1]" />
                <div className="h-10 w-full animate-pulse rounded bg-[#E6E7E1]" />
                <div className="h-10 w-3/4 animate-pulse rounded bg-[#E6E7E1]" />
                <div className="h-4 w-full animate-pulse rounded bg-[#E6E7E1]" />
              </div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-6 gap-y-10">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3.5 border-t border-ink pt-5">
                  <div className="h-3 w-full animate-pulse rounded bg-[#E6E7E1]" />
                  <div className="h-[200px] animate-pulse rounded-md bg-[#E6E7E1]" />
                  <div className="h-6 w-3/4 animate-pulse rounded bg-[#E6E7E1]" />
                </div>
              ))}
            </div>
          </div>
        ) : error && !hasNews ? (
          <div role="alert" className="nb-card flex flex-col items-start gap-4 p-10">
            <h2 className="m-0 font-display text-2xl font-semibold">News couldn&apos;t be loaded</h2>
            <p className="m-0 text-ink-muted">{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="nb-btn nb-btn-primary">
              Try again
            </button>
          </div>
        ) : !hasNews ? (
          <section
            aria-labelledby="news-empty-title"
            className="flex flex-wrap items-center gap-10 rounded-lg border border-dashed border-line-strong bg-surface p-8 sm:p-12"
          >
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
              <span className="font-mono text-xs uppercase tracking-[0.06em] text-signal-text">Log empty · First entry pending</span>
              <h2 id="news-empty-title" className="m-0 font-display text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[34px]">
                Nothing published here yet.
              </h2>
              <p className="m-0 max-w-[560px] text-[17px] leading-relaxed text-ink-muted">
                The lab posts day-to-day progress on Instagram first. Write-ups of competitions, builds and
                announcements will land here — subscribe below and the next one comes straight to your inbox.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <a href="#newsletter" className="nb-btn nb-btn-primary">
                  <Mail size={16} aria-hidden="true" /> Subscribe by email
                </a>
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="nb-btn nb-btn-secondary">
                  <Instagram size={16} aria-hidden="true" /> @{instagramHandle}
                </a>
              </div>
            </div>
            <EmptyStateGame className="hidden flex-[1_1_300px] sm:flex" />
          </section>
        ) : (
          <>
            {error && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#F3C4C4] bg-[#FBE4E4] px-4 py-3 text-sm text-[#991B1B]">
                <span>{error}</span>
                <button type="button" onClick={() => window.location.reload()} className="font-semibold underline underline-offset-4">
                  Retry
                </button>
              </div>
            )}

            {filteredNews.length === 0 ? (
              <NoMatchCard title="No articles match" hint="Try a different category or search term." onClear={clearFilters} />
            ) : (
              <>
                {lead && <LeadStory news={lead} category={getCategoryName(lead)} />}
                {rest.length > 0 && (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-6 gap-y-10">
                    {rest.map((news, index) => (
                      <NewsItem key={news._id || news.id || index} news={news} category={getCategoryName(news)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Newsletter */}
        <section
          id="newsletter"
          aria-labelledby="newsletter-title"
          className="flex scroll-mt-24 flex-wrap items-center justify-between gap-6 rounded-lg border border-line bg-surface p-6 sm:p-10"
        >
          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-2">
            <h2 id="newsletter-title" className="m-0 font-display text-[26px] font-semibold tracking-[-0.01em]">
              Get the lab log by email
            </h2>
            <p className="m-0 text-[15px] text-ink-muted">
              One email when something ships. No spam — unsubscribe at any time.
            </p>
          </div>

          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
            {newsletterStep === 1 && (
              <form onSubmit={handleEmailContinue} noValidate className="flex flex-wrap gap-2">
                <label htmlFor="news-email" className="nb-sr-only">
                  Email address
                </label>
                <input
                  id="news-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@university.edu"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="nb-input h-12 min-w-0 flex-[1_1_220px] bg-paper"
                  required
                />
                <button type="submit" className="nb-btn nb-btn-primary">
                  Continue <ArrowRight size={16} aria-hidden="true" />
                </button>
              </form>
            )}

            {newsletterStep === 2 && (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-3">
                <p className="m-0 text-sm text-ink-muted">
                  Subscribing <span className="font-semibold text-ink">{newsletterEmail}</span>. Add your name (optional).
                </p>
                <div className="flex flex-wrap gap-2">
                  <label htmlFor="news-first-name" className="nb-sr-only">
                    First name (optional)
                  </label>
                  <input
                    id="news-first-name"
                    type="text"
                    autoComplete="given-name"
                    placeholder="First name"
                    value={newsletterFirstName}
                    onChange={(e) => setNewsletterFirstName(e.target.value)}
                    className="nb-input h-12 min-w-0 flex-[1_1_160px] bg-paper"
                  />
                  <label htmlFor="news-last-name" className="nb-sr-only">
                    Last name (optional)
                  </label>
                  <input
                    id="news-last-name"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Last name"
                    value={newsletterLastName}
                    onChange={(e) => setNewsletterLastName(e.target.value)}
                    className="nb-input h-12 min-w-0 flex-[1_1_160px] bg-paper"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleBackToEmail} className="nb-btn nb-btn-secondary">
                    <ArrowLeft size={16} aria-hidden="true" /> Back
                  </button>
                  <button type="submit" disabled={isNewsletterSubmitting} className="nb-btn nb-btn-primary flex-1">
                    {isNewsletterSubmitting ? "Subscribing…" : "Subscribe"}
                  </button>
                </div>
              </form>
            )}

            {newsletterStep === 3 && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-md border border-[#BBDFC6] bg-[#E3F1E7] px-4 py-3 text-[#166534]"
              >
                <Check size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                <div>
                  <p className="m-0 font-semibold">You&apos;re subscribed.</p>
                  <p className="m-0 text-sm">We&apos;ll email you when something new lands in the lab log.</p>
                </div>
              </div>
            )}

            {newsletterMessage && newsletterMessageType === "error" && (
              <div role="alert" className="rounded-md border border-[#F3C4C4] bg-[#FBE4E4] px-4 py-3 text-sm text-[#991B1B]">
                {newsletterMessage}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

function LeadStory({ news, category }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = getImageUrl(news);
  const meta = [category, news.readTime].filter(Boolean).join(" · ");

  return (
    <Link href={newsHref(news)} className="group flex flex-wrap items-center gap-10 text-ink no-underline">
      {image && !imageFailed ? (
        <RemoteImage
          src={image}
          alt=""
          className="block h-[260px] min-w-0 flex-[3_1_520px] rounded-lg object-cover sm:h-[440px]"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <BlueprintPlaceholder className="h-[260px] min-w-0 flex-[3_1_520px] rounded-lg sm:h-[440px]" />
      )}
      <span className="flex min-w-0 flex-[2_1_380px] flex-col gap-4">
        <span className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.06em] text-signal-text">{meta}</span>
          {news.isFeatured && (
            <span className="nb-chip nb-chip-outline inline-flex items-center gap-1">
              <Star size={11} aria-hidden="true" /> Featured
            </span>
          )}
        </span>
        <span className="font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] group-hover:text-signal-text sm:text-[44px]">
          {news.title}
        </span>
        {news.excerpt && <span className="line-clamp-4 text-[17px] leading-relaxed text-ink-muted">{news.excerpt}</span>}
        <span className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
          <span>By {getAuthor(news)}</span>
          {newsDate(news) && <span>{newsDate(news)}</span>}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-signal-text">
          Read the article <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

function NewsItem({ news, category }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = getImageUrl(news);

  return (
    <Link href={newsHref(news)} className="group flex flex-col gap-3.5 border-t border-ink pt-5 text-ink no-underline">
      <span className="flex justify-between gap-3 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
        <span className="truncate text-signal-text">
          {category}
          {news.isFeatured ? " · Featured" : ""}
        </span>
        <span className="shrink-0">{newsDate(news)}</span>
      </span>
      {image && !imageFailed && (
        <RemoteImage
          src={image}
          alt=""
          className="block h-[200px] w-full rounded-md object-cover"
          onError={() => setImageFailed(true)}
        />
      )}
      <span className="font-display text-[22px] font-semibold leading-tight tracking-[-0.01em] group-hover:text-signal-text">
        {news.title}
      </span>
      {news.excerpt && <span className="line-clamp-3 text-[15px] leading-relaxed text-ink-muted">{news.excerpt}</span>}
      {(news.tags || []).length > 0 && (
        <span className="flex flex-wrap gap-1.5">
          {news.tags.slice(0, 3).map((tag, i) => (
            <span key={`${tag}-${i}`} className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-ink-muted">
              {tag}
            </span>
          ))}
        </span>
      )}
      <span className="mt-auto font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
        By {getAuthor(news)}
        {news.readTime ? ` · ${news.readTime}` : ""}
      </span>
    </Link>
  );
}

export default NewsPage;
