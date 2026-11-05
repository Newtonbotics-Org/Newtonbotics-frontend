"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  LayoutGrid,
  List,
  Play,
  FileText,
  Music,
  Image as ImageIcon,
  Video,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Info,
  X,
} from "lucide-react";
import mediaService, { canViewLabOnlyMedia, resolveGalleryViewer } from "../../lib/media";
import BlueprintPlaceholder from "@/components/lab/BlueprintPlaceholder";
import EmptyLog from "@/components/lab/EmptyLog";
import { formatDate } from "@/lib/labUi";
import { useAuth } from "../../contexts/AuthContext";
import NoMatchCard from "@/components/lab/NoMatchCard";

const PAGE_SIZE = 50;

const FILE_TYPES = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "audio", label: "Audio" },
  { value: "document", label: "Documents" },
];

// Video Player Component that handles play/pause based on hover
const VideoPlayer = ({ src, isPlaying }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <video
      ref={videoRef}
      src={src}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
        isPlaying ? "z-10 opacity-100" : "z-0 opacity-0"
      }`}
      muted
      loop
      playsInline
    />
  );
};

/** "1273x633" → width / height, clamped so very tall or wide shots stay tidy in the masonry. */
const tileAspect = (dimensions) => {
  const m = typeof dimensions === "string" ? dimensions.match(/^(\d+)\s*x\s*(\d+)$/i) : null;
  if (!m) return 4 / 3;
  const ratio = Number(m[1]) / Number(m[2]);
  if (!Number.isFinite(ratio) || ratio <= 0) return 4 / 3;
  return Math.min(Math.max(ratio, 0.7), 1.8);
};

export default function GalleryClient() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams?.get("categoryId") || null;
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const viewerCanViewLabOnly = canViewLabOnlyMedia(user) || resolveGalleryViewer().canViewLabOnly;
  const [mediaItems, setMediaItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null);
  const [loadedVideos, setLoadedVideos] = useState(new Set());
  const [playingVideos, setPlayingVideos] = useState(new Set());
  const [failedThumbs, setFailedThumbs] = useState(new Set());

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState(urlCategory || "all");
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  // Pagination
  const [pagination, setPagination] = useState({
    total: 0,
    limit: PAGE_SIZE,
    skip: 0,
    hasMore: false,
  });
  // Number of raw items fetched from the server so far (before client-side filtering)
  const [serverSkip, setServerSkip] = useState(0);

  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const filmstripRef = useRef(null);
  const touchStartRef = useRef(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const lastFocusRef = useRef(null);

  // Fetch categories/collections once on mount
  useEffect(() => {
    fetchCategoriesAndCollections();
  }, []);

  // If the ?categoryId= query changes (client nav, deep link), apply it to the filter
  useEffect(() => {
    if (urlCategory) setSelectedCategory(urlCategory);
  }, [urlCategory]);

  // Fetch media after auth is ready so lab-only items work for signed-in staff
  useEffect(() => {
    if (authLoading) return;
    fetchFilteredMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authLoading,
    searchQuery,
    selectedFileType,
    selectedCategory,
    selectedCollection,
    showFeaturedOnly,
    isAuthenticated,
    user?.role,
  ]);

  const fetchCategoriesAndCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesData, collectionsData] = await Promise.all([
        mediaService.listCategories(),
        mediaService.listCollections(),
      ]);

      setCategories(categoriesData);
      setCollections(collectionsData);
    } catch (err) {
      console.error("Error fetching gallery metadata:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Safety: enforce filters client-side in case backend ignores them
  const applyClientFilters = (rawItems) => {
    let items = rawItems || [];
    if (selectedCategory !== "all") {
      const selectedCatName = (
        categories.find((c) => String(c._id) === String(selectedCategory))?.name || ""
      ).toLowerCase();
      items = items.filter((it) => {
        const raw = it.categoryId ?? it.category ?? it.category_id;
        const cid = (raw && (raw._id || raw.id)) || (typeof raw === "string" ? raw : null);
        const cname = (it.categoryName || it.category_label || it.category?.name || "").toLowerCase();
        if (cid) {
          return String(cid) === String(selectedCategory);
        }
        if (selectedCatName && cname) {
          return cname === selectedCatName;
        }
        return false;
      });
    }
    if (selectedFileType !== "all") {
      items = items.filter((it) => (it.fileType || "").toLowerCase() === selectedFileType.toLowerCase());
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((it) => {
        const title = (it.title || "").toLowerCase();
        const desc = (it.description || "").toLowerCase();
        const tags = Array.isArray(it.tags) ? it.tags.map((t) => String(t).toLowerCase()) : [];
        return title.includes(q) || desc.includes(q) || tags.some((t) => t.includes(q));
      });
    }
    if (showFeaturedOnly) {
      items = items.filter((it) => it.isFeatured === true);
    }
    // Only hide lab-only media for guests / students once auth state is known
    if (!authLoading && !viewerCanViewLabOnly) {
      items = items.filter((it) => !it.labMembersOnly);
    }
    return items;
  };

  const buildParams = (skip) => {
    const params = { limit: PAGE_SIZE, skip };
    if (searchQuery) params.q = searchQuery;
    if (selectedFileType !== "all") params.fileType = selectedFileType;
    if (selectedCategory !== "all") params.categoryId = selectedCategory;
    if (showFeaturedOnly) params.isFeatured = true;
    return params;
  };

  const isFiltered = () =>
    showFeaturedOnly || selectedCategory !== "all" || selectedFileType !== "all" || Boolean(searchQuery);

  const fetchFilteredMedia = async () => {
    try {
      setMediaLoading(true);
      const result = await mediaService.listMedia(buildParams(0));
      const items = applyClientFilters(result.items);
      setMediaItems(items);
      setServerSkip((result.items || []).length);
      const serverPagination = result.pagination || {};
      const effectiveTotal = isFiltered() ? items.length : (serverPagination.total ?? items.length);
      setPagination({ ...serverPagination, total: effectiveTotal });
    } catch (err) {
      console.error("Error fetching filtered media:", err);
      setError(err.message);
    } finally {
      setMediaLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !pagination.hasMore) return;
    try {
      setLoadingMore(true);
      const result = await mediaService.listMedia(buildParams(serverSkip));
      const items = applyClientFilters(result.items);
      setMediaItems((prev) => {
        const seen = new Set(prev.map((it) => it._id));
        return [...prev, ...items.filter((it) => !seen.has(it._id))];
      });
      setServerSkip((s) => s + (result.items || []).length);
      const serverPagination = result.pagination || {};
      setPagination((prev) => ({
        ...serverPagination,
        total: isFiltered() ? prev.total + items.length : (serverPagination.total ?? prev.total),
      }));
    } catch (err) {
      console.error("Error loading more media:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const retry = () => {
    setError(null);
    fetchCategoriesAndCollections();
    fetchFilteredMedia();
  };

  const changeCategory = (value) => {
    setSelectedCategory(value);
    // Keep the URL shareable and in sync with the category filter
    try {
      router.replace(value === "all" ? "/Gallery" : `/Gallery?categoryId=${encodeURIComponent(value)}`, {
        scroll: false,
      });
    } catch {}
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFileType("all");
    setSelectedCategory("all");
    setSelectedCollection("all");
    setShowFeaturedOnly(false);
    // Clear query params in URL so the categoryId isn't re-applied
    try {
      router.replace("/Gallery", { scroll: false });
    } catch {}
  };

  const hasActiveFilters =
    searchQuery ||
    selectedFileType !== "all" ||
    selectedCategory !== "all" ||
    selectedCollection !== "all" ||
    showFeaturedOnly;

  const handleVideoHover = (itemId) => {
    setPlayingVideos((prev) => new Set([...prev, itemId]));
    setLoadedVideos((prev) => (prev.has(itemId) ? prev : new Set([...prev, itemId])));
  };

  const handleVideoUnhover = (itemId) => {
    setPlayingVideos((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const markThumbFailed = (itemId) => setFailedThumbs((prev) => new Set([...prev, itemId]));

  // Increment view count when media is opened
  const handleMediaView = async (item) => {
    try {
      await mediaService.incrementViewCount(item._id);
      setMediaItems((prevItems) =>
        prevItems.map((mediaItem) =>
          mediaItem._id === item._id ? { ...mediaItem, viewCount: (mediaItem.viewCount || 0) + 1 } : mediaItem,
        ),
      );
    } catch (err) {
      console.error("Error tracking media view:", err);
    }
  };

  const openItem = (item) => {
    setActive(item);
    handleMediaView(item);
  };

  const navigateLightbox = useCallback((direction) => {
    if (!active || mediaItems.length <= 1) return;
    const currentIndex = mediaItems.findIndex((item) => item._id === active._id);
    if (currentIndex === -1) return;
    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % mediaItems.length
        : (currentIndex - 1 + mediaItems.length) % mediaItems.length;
    const nextItem = mediaItems[nextIndex];
    setActive(nextItem);
    handleMediaView(nextItem);
  }, [active, mediaItems]);

  // Keyboard navigation for lightbox (←/→, Escape, Tab kept inside the dialog)
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateLightbox("prev");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateLightbox("next");
      } else if (e.key === "Escape") {
        setActive(null);
      } else if (e.key === "i" || e.key === "I") {
        setInfoOpen((v) => !v);
      } else if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])',
        );
        const visible = [...focusables].filter((el) => el.offsetParent !== null);
        if (visible.length === 0) return;
        const first = visible[0];
        const last = visible[visible.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, mediaItems, navigateLightbox]);

  // Lock page scroll and manage focus while the lightbox is open
  const lightboxOpen = Boolean(active);
  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lastFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (lastFocusRef.current && typeof lastFocusRef.current.focus === "function") {
        lastFocusRef.current.focus();
      }
    };
  }, [lightboxOpen]);

  // Collapse the description and keep the active thumbnail in view when the item changes
  const activeId = active?._id;
  useEffect(() => {
    setDescExpanded(false);
    const strip = filmstripRef.current;
    if (!activeId || !strip) return;
    const idx = mediaItems.findIndex((item) => item._id === activeId);
    const thumb = strip.querySelector(`[data-thumb-index="${idx}"]`);
    if (!thumb) return;
    const left = thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [activeId, mediaItems]);

  // Clicking empty space (not the media or a control) closes the lightbox. The press
  // must also start on empty space, so a click that drifts off a button can't close it.
  const pressStartedOnBackdropRef = useRef(false);
  const isBackdrop = (target) => target instanceof Element && target.hasAttribute("data-backdrop");
  const onBackdropPointerDown = (e) => {
    pressStartedOnBackdropRef.current = isBackdrop(e.target);
  };
  const onBackdropClick = (e) => {
    if (pressStartedOnBackdropRef.current && isBackdrop(e.target)) setActive(null);
    pressStartedOnBackdropRef.current = false;
  };

  // Touch swipe left/right on the stage
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStartRef.current = t ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEnd = (e) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const t = e.changedTouches[0];
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      navigateLightbox(dx < 0 ? "next" : "prev");
    }
  };

  const lightboxIconButton =
    "grid h-11 w-11 shrink-0 place-items-center rounded-md border border-night-line-strong bg-night-raised text-night-text no-underline transition-colors hover:bg-night-hover";
  const lightboxNavButton =
    "absolute top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-night-line-strong bg-night-raised/90 text-night-text transition-colors hover:bg-night-hover";

  const activeIndex = active ? mediaItems.findIndex((item) => item._id === active._id) : -1;

  const getFileTypeIcon = (fileType, size = 16) => {
    const props = { size, "aria-hidden": true };
    switch (fileType) {
      case "image":
        return <ImageIcon {...props} />;
      case "video":
        return <Video {...props} />;
      case "audio":
        return <Music {...props} />;
      default:
        return <FileText {...props} />;
    }
  };

  const categoryName = (item) => {
    const raw = item.categoryId ?? item.category ?? item.category_id;
    const cid = (raw && (raw._id || raw.id)) || (typeof raw === "string" ? raw : null);
    const match = cid ? categories.find((c) => String(c._id) === String(cid)) : null;
    return match?.name || item.categoryName || item.category?.name || "";
  };

  // Normalize remote image URLs (e.g., Cloudinary) to web-friendly formats
  const isCloudinaryUrl = (url) => typeof url === "string" && /https?:\/\/res\.cloudinary\.com\//.test(url);

  const sanitizeCloudinaryExtension = (url) => {
    if (!url) return url;
    // Replace problematic TIFF extension with jpg to ensure browser display
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
    // Inject transforms right after /image/upload/
    return safeUrl.replace("/image/upload/", `/image/upload/${transforms}/`);
  };

  // Robust URL resolution to support different backend shapes (Cloudinary, etc.)
  const getPrimaryUrl = (item) => {
    const url = item?.fileUrl || item?.secure_url || item?.url || item?.sourceUrl || "";
    const normalized = transformCloudinaryUrl(url, {});
    return normalized;
  };

  // Cloudinary serves the file as an attachment with fl_attachment; other hosts just open it
  const getDownloadUrl = (item) => {
    const url = sanitizeCloudinaryExtension(item?.fileUrl || item?.secure_url || item?.url || item?.sourceUrl || "");
    return isCloudinaryUrl(url) ? url.replace("/upload/", "/upload/fl_attachment/") : url || getPrimaryUrl(item);
  };

  const getThumbnailUrl = (item, opts = { width: 720, crop: "limit" }) => {
    const url = item?.thumbnailUrl || item?.thumbnail || item?.previewUrl || getPrimaryUrl(item);
    const normalized = transformCloudinaryUrl(url, opts);
    // An empty src fails to load, which swaps in the blueprint placeholder
    return normalized;
  };

  const monoMeta = "font-mono text-xs uppercase tracking-[0.06em] text-ink-muted";

  const renderTileMedia = (item, { compact = false } = {}) => {
    const failed = failedThumbs.has(item._id);
    const isImage = item.fileType === "image";
    const isVideo = item.fileType === "video";
    if ((isImage || isVideo) && !failed) {
      return (
        <>
          <img
            src={compact ? getThumbnailUrl(item, { width: 160, height: 160, crop: "fill" }) : getThumbnailUrl(item)}
            alt=""
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              isVideo && playingVideos.has(item._id) ? "opacity-0" : "opacity-100"
            }`}
            onError={() => markThumbFailed(item._id)}
          />
          {isVideo && !compact && loadedVideos.has(item._id) && (
            <VideoPlayer src={getPrimaryUrl(item)} isPlaying={playingVideos.has(item._id)} />
          )}
          {isVideo && !playingVideos.has(item._id) && (
            <span className="absolute inset-0 z-20 grid place-items-center">
              <span
                className={`grid place-items-center rounded-full bg-ink/80 text-paper ${
                  compact ? "h-8 w-8" : "h-12 w-12"
                }`}
              >
                <Play size={compact ? 14 : 20} aria-hidden="true" />
              </span>
            </span>
          )}
        </>
      );
    }
    if (compact) {
      return (
        <span className="nb-blueprint-sm absolute inset-0 grid place-items-center text-ink-muted">
          {getFileTypeIcon(item.fileType, 20)}
        </span>
      );
    }
    return (
      <BlueprintPlaceholder
        label={isImage || isVideo ? "Preview unavailable" : item.fileType || "File"}
        className="absolute inset-0"
      />
    );
  };

  const showSkeleton = loading || (mediaLoading && mediaItems.length === 0);

  return (
    <>
      <main className="nb-dark bg-paper text-ink">
        <header className="nb-blueprint border-b border-line">
          <div className="nb-container flex flex-col gap-5 pb-14 pt-16 sm:pt-20">
            <span className="nb-eyebrow">
              <span className="nb-eyebrow-num">[08]</span> Gallery
            </span>
            <h1 className="nb-h1 m-0">Field notes, in pictures.</h1>
            <p className="m-0 max-w-[600px] text-lg leading-relaxed text-ink-muted">
              Unfiltered moments from our builds, events, and club fun.
            </p>
          </div>
        </header>

        <div className="nb-container flex flex-col gap-8 pb-28 pt-10">
          {/* Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div role="group" aria-label="Filter by media type" className="flex flex-wrap gap-2">
                {FILE_TYPES.map((t) => {
                  const isActive = selectedFileType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setSelectedFileType(t.value)}
                      className={`nb-pill h-10 px-4 text-sm ${isActive ? "nb-pill-active" : ""}`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-[0_1_540px] flex-wrap gap-2">
                <div className="relative min-w-0 flex-[1_1_220px]">
                  <label htmlFor="gallery-search" className="nb-sr-only">
                    Search media
                  </label>
                  <Search
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
                  />
                  <input
                    id="gallery-search"
                    type="search"
                    placeholder="Search media…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="nb-input h-11 pl-10 text-sm"
                  />
                </div>
                <label htmlFor="gallery-category" className="nb-sr-only">
                  Album
                </label>
                <select
                  id="gallery-category"
                  value={selectedCategory}
                  onChange={(e) => changeCategory(e.target.value)}
                  className="nb-input h-11 w-[200px] shrink-0 truncate pr-8 text-sm"
                >
                  <option value="all">All albums</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={showFeaturedOnly}
                  onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                  className="h-[18px] w-[18px] accent-ink"
                />
                Featured only
              </label>
              <div className="flex flex-wrap items-center gap-4">
                {!showSkeleton && (
                  <span aria-live="polite" className={monoMeta}>
                    {hasActiveFilters
                      ? `${mediaItems.length} items`
                      : `${mediaItems.length} of ${pagination.total} items`}
                  </span>
                )}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={`${monoMeta} inline-flex min-h-[44px] items-center gap-1 !text-signal-text hover:!text-signal-hover`}
                  >
                    <X size={14} aria-hidden="true" /> Clear filters
                  </button>
                )}
                <div
                  role="group"
                  aria-label="Layout"
                  className="flex rounded-md border border-line-strong bg-surface p-0.5"
                >
                  {[
                    { value: "grid", label: "Grid view", Icon: LayoutGrid },
                    { value: "list", label: "List view", Icon: List },
                  ].map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={label}
                      aria-pressed={viewMode === value}
                      onClick={() => setViewMode(value)}
                      className={`grid h-10 w-10 place-items-center rounded ${
                        viewMode === value ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      <Icon size={16} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          {showSkeleton ? (
            <div className="columns-[300px] gap-4" role="status" aria-label="Loading gallery">
              {[260, 340, 220, 300, 380, 240, 320, 280].map((h, i) => (
                <div key={i} className="nb-card mb-4 animate-pulse break-inside-avoid" style={{ height: h }} />
              ))}
            </div>
          ) : error && mediaItems.length === 0 ? (
            <div role="alert" className="nb-card flex flex-col items-start gap-4 p-10">
              <h2 className="m-0 font-display text-2xl font-semibold">The gallery couldn&apos;t be loaded</h2>
              <p className="m-0 text-ink-muted">{error}</p>
              <button type="button" onClick={retry} className="nb-btn nb-btn-primary">
                Try again
              </button>
            </div>
          ) : mediaItems.length === 0 && !hasActiveFilters ? (
            <EmptyLog
              id="gallery-empty-title"
              title="No photos or videos yet."
              scannerLabel="No media found · Jarvis is also waiting for the team to update"
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
              Shots from builds, competitions and lab days will land here once they&apos;re uploaded. Until then, the
              latest moments are on Instagram.
            </EmptyLog>
          ) : mediaItems.length === 0 ? (
            <NoMatchCard title="No media found" hint="Try a different filter or search term." onClear={clearFilters} />
          ) : viewMode === "grid" ? (
            <ul className="m-0 list-none columns-[300px] gap-4 p-0">
              {mediaItems.map((item) => {
                const cat = categoryName(item);
                return (
                  <li key={item._id} className="mb-4 break-inside-avoid">
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      onMouseEnter={() => item.fileType === "video" && handleVideoHover(item._id)}
                      onMouseLeave={() => item.fileType === "video" && handleVideoUnhover(item._id)}
                      aria-label={`Open ${item.title || "media"}${item.fileType && item.fileType !== "image" ? ` (${item.fileType})` : ""}`}
                      className="nb-card nb-card-hover group block w-full p-2 text-left"
                    >
                      <span
                        className="relative block w-full overflow-hidden rounded bg-[#E6E7E1]"
                        style={{ aspectRatio: tileAspect(item.dimensions) }}
                      >
                        {renderTileMedia(item)}
                        {item.isFeatured && (
                          <span className="nb-chip nb-chip-signal absolute right-2 top-2 z-30 inline-flex items-center gap-1">
                            <Star size={11} aria-hidden="true" /> Featured
                          </span>
                        )}
                      </span>
                      <span className="flex justify-between gap-3 px-1 pb-1 pt-2.5 font-mono text-[11px] uppercase tracking-[0.04em] text-ink-muted">
                        <span className="min-w-0 truncate text-ink group-hover:text-signal-text">{item.title}</span>
                        {cat && <span className="max-w-[45%] shrink-0 truncate">{cat}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {mediaItems.map((item) => (
                <li key={item._id}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className="nb-card nb-card-hover group flex w-full items-center gap-4 p-3 text-left"
                  >
                    <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded bg-[#E6E7E1]">
                      {renderTileMedia(item, { compact: true })}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-display text-lg font-semibold group-hover:text-signal-text">
                          {item.title}
                        </span>
                        {item.isFeatured && <span className="nb-chip nb-chip-signal shrink-0">Featured</span>}
                      </span>
                      {item.description && (
                        <span className="line-clamp-2 text-sm leading-relaxed text-ink-muted">{item.description}</span>
                      )}
                      <span className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-ink-muted">
                        <span className="inline-flex items-center gap-1.5 uppercase">
                          {getFileTypeIcon(item.fileType, 14)} {item.fileType}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Eye size={14} aria-hidden="true" /> {item.viewCount || 0}
                        </span>
                        {item.duration && <span>{mediaService.formatDuration(item.duration)}</span>}
                        {item.createdAt && <span>{formatDate(item.createdAt)}</span>}
                        {categoryName(item) && <span className="uppercase">{categoryName(item)}</span>}
                      </span>
                    </span>
                    {item.tags && item.tags.length > 0 && (
                      <span className="hidden max-w-[240px] flex-wrap justify-end gap-1.5 md:flex">
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded border border-line px-2 py-1 font-mono text-[11px] text-ink-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!showSkeleton && pagination.hasMore && mediaItems.length > 0 && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="nb-btn nb-btn-outline self-center"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      </main>

      {/* Lightbox — full-viewport modal, rendered outside <main> (its page-enter transform would trap position:fixed) */}
      {active && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${active.title || "Media"} — media viewer`}
          data-backdrop
          className="fixed inset-0 z-[200] isolate flex flex-col overflow-hidden bg-night text-night-text"
          onPointerDown={onBackdropPointerDown}
          onClick={onBackdropClick}
        >
          {/* Ambient glow — a blurred copy of the current media tints the backdrop */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            {(active.fileType === "image" || active.thumbnailUrl) && !failedThumbs.has(active._id) && (
              <img
                key={active._id}
                src={
                  active.fileType === "image"
                    ? getThumbnailUrl(active, { width: 96, crop: "limit" })
                    : active.thumbnailUrl
                }
                alt=""
                className="h-full w-full scale-125 animate-[fadeIn_0.6s_ease-out] object-cover opacity-40 blur-3xl"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-night/70 via-night/50 to-night/90" />
          </div>

          {/* Top bar */}
          <div data-backdrop className="flex h-14 shrink-0 items-center justify-between gap-3 px-3 sm:h-16 sm:px-5">
            <div data-backdrop className="flex min-w-0 items-center gap-4">
              {mediaItems.length > 1 && activeIndex >= 0 ? (
                <p aria-live="polite" className="m-0 font-mono text-xs uppercase tracking-[0.06em] text-night-muted">
                  <span className="text-signal-light">{String(activeIndex + 1).padStart(2, "0")}</span> /{" "}
                  {String(mediaItems.length).padStart(2, "0")}
                </p>
              ) : (
                <span className="font-mono text-xs uppercase tracking-[0.06em] text-night-muted">Gallery</span>
              )}
              <span className="hidden font-mono text-[11px] uppercase tracking-[0.06em] text-night-muted/70 lg:inline">
                ← → browse · I info · Esc close
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInfoOpen((v) => !v)}
                className={`${lightboxIconButton} ${infoOpen ? "border-signal-light text-signal-light" : ""}`}
                aria-pressed={infoOpen}
                aria-label="Toggle details"
                title="Details (I)"
              >
                <Info size={18} aria-hidden="true" />
              </button>
              <a
                href={getDownloadUrl(active)}
                target="_blank"
                rel="noopener noreferrer"
                download
                aria-label="Download"
                title="Download"
                className={lightboxIconButton}
              >
                <Download size={18} aria-hidden="true" />
              </a>
              <a
                href={getPrimaryUrl(active)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open original in a new tab"
                title="Open original"
                className={lightboxIconButton}
              >
                <ExternalLink size={18} aria-hidden="true" />
              </a>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setActive(null)}
                className={lightboxIconButton}
                aria-label="Close gallery view"
                title="Close (Esc)"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div data-backdrop className="flex min-h-0 flex-1 flex-col lg:flex-row">
            {/* Stage */}
            <div
              data-backdrop
              className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-2 sm:px-20 lg:pb-6"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {active.fileType === "image" ? (
                <img
                  key={active._id}
                  src={getPrimaryUrl(active)}
                  alt={active.title || ""}
                  className="block h-auto max-h-full w-auto max-w-full animate-[fadeIn_0.3s_ease-out] rounded-md object-contain shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
                />
              ) : active.fileType === "video" ? (
                <video
                  key={active._id}
                  src={getPrimaryUrl(active)}
                  poster={active.thumbnailUrl || undefined}
                  className="block max-h-full max-w-full rounded-md bg-night-raised shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-night-line bg-night-raised px-10 py-16 text-center text-night-muted">
                  {getFileTypeIcon(active.fileType, 28)}
                  <p className="m-0 text-sm">Preview not available</p>
                </div>
              )}

              {mediaItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => navigateLightbox("prev")}
                    className={`${lightboxNavButton} left-2 sm:left-5`}
                    aria-label="Previous"
                  >
                    <ChevronLeft size={22} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateLightbox("next")}
                    className={`${lightboxNavButton} right-2 sm:right-5`}
                    aria-label="Next"
                  >
                    <ChevronRight size={22} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {/* Details — caption under the media on small screens, side panel on large ones */}
            {infoOpen && (
              <aside
                aria-label="Media details"
                className="flex shrink-0 flex-col gap-4 px-4 pb-3 pt-2 sm:px-20 lg:w-[360px] lg:overflow-y-auto lg:border-l lg:border-night-line lg:bg-night-raised/60 lg:p-6 lg:backdrop-blur-xl"
              >
                <div className="flex flex-col gap-2">
                  {active.isFeatured && (
                    <span className="inline-flex items-center gap-1 self-start rounded border border-signal-light px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-signal-light">
                      <Star size={11} aria-hidden="true" /> Featured
                    </span>
                  )}
                  <h2 className="m-0 font-display text-lg font-semibold leading-snug text-night-text sm:text-xl lg:text-2xl">
                    {active.title}
                  </h2>
                  <p className="m-0 font-mono text-xs uppercase tracking-[0.04em] text-night-muted lg:hidden">
                    {[
                      active.fileType,
                      `${active.viewCount || 0} views`,
                      active.duration ? mediaService.formatDuration(active.duration) : null,
                      active.createdAt ? formatDate(active.createdAt) : null,
                      categoryName(active) || null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                {active.description && (
                  <div className="flex flex-col items-start gap-1">
                    <p
                      className={`m-0 text-sm leading-relaxed text-night-soft lg:max-h-none lg:overflow-visible lg:text-[15px] lg:[-webkit-line-clamp:unset] ${
                        descExpanded ? "max-h-[20vh] overflow-y-auto" : "line-clamp-2"
                      }`}
                    >
                      {active.description}
                    </p>
                    {active.description.length > 160 && (
                      <button
                        type="button"
                        onClick={() => setDescExpanded((v) => !v)}
                        aria-expanded={descExpanded}
                        className="font-mono text-xs uppercase tracking-[0.06em] text-signal-light hover:text-night-text lg:hidden"
                      >
                        {descExpanded ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                )}

                <dl className="m-0 hidden border-t border-night-line lg:block">
                  {[
                    ["Type", active.fileType],
                    ["Views", String(active.viewCount || 0)],
                    ["Duration", active.duration ? mediaService.formatDuration(active.duration) : null],
                    ["Date", active.createdAt ? formatDate(active.createdAt) : null],
                    ["Category", categoryName(active) || null],
                  ]
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4 border-b border-night-line py-3">
                        <dt className="font-mono text-xs uppercase tracking-[0.06em] text-night-muted">{label}</dt>
                        <dd className="m-0 text-right text-sm font-semibold capitalize text-night-text">{value}</dd>
                      </div>
                    ))}
                </dl>

                {active.tags && active.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {active.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded border border-night-line-strong px-2 py-0.5 font-mono text-[11px] text-night-soft"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <a
                  href={getDownloadUrl(active)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="mt-auto hidden h-11 items-center justify-center gap-2 rounded-md bg-signal font-semibold text-night no-underline transition-colors hover:bg-signal-light lg:flex"
                >
                  <Download size={16} aria-hidden="true" /> Download
                </a>
              </aside>
            )}
          </div>

          {/* Filmstrip — hidden on small or short screens; edges fade out */}
          {mediaItems.length > 1 && (
            <div
              ref={filmstripRef}
              data-backdrop
              className="relative hidden shrink-0 overflow-x-auto border-t border-night-line/70 bg-night/40 px-10 py-3 [mask-image:linear-gradient(to_right,transparent,black_48px,black_calc(100%-48px),transparent)] [scrollbar-width:none] sm:block [@media(max-height:700px)]:hidden [&::-webkit-scrollbar]:hidden"
            >
              <div data-backdrop className="mx-auto flex w-max gap-2" role="group" aria-label="All media">
                {mediaItems.map((item, i) => {
                  const isCurrent = item._id === active._id;
                  const canPreview =
                    (item.fileType === "image" || item.fileType === "video") && !failedThumbs.has(item._id);
                  return (
                    <button
                      key={item._id}
                      type="button"
                      data-thumb-index={i}
                      aria-label={`Show ${item.title || `item ${i + 1}`}`}
                      aria-current={isCurrent ? "true" : undefined}
                      onClick={() => {
                        if (!isCurrent) {
                          setActive(item);
                          handleMediaView(item);
                        }
                      }}
                      className={`relative h-14 shrink-0 overflow-hidden rounded transition-all duration-200 ${
                        isCurrent
                          ? "w-20 opacity-100 outline outline-2 outline-offset-2 outline-signal"
                          : "w-12 opacity-45 grayscale hover:w-14 hover:opacity-100 hover:grayscale-0"
                      }`}
                    >
                      {canPreview ? (
                        <img
                          src={getThumbnailUrl(item, { width: 160, height: 112, crop: "fill" })}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                          onError={() => markThumbFailed(item._id)}
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center bg-night-raised text-night-muted">
                          {getFileTypeIcon(item.fileType, 16)}
                        </span>
                      )}
                      {item.fileType === "video" && (
                        <span className="absolute inset-0 grid place-items-center bg-night/30">
                          <Play size={14} aria-hidden="true" className="text-night-text" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
