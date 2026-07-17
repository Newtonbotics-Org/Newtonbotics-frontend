"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, ExternalLink, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { isValidObjectId } from "@/lib/news";

const fallbackAnnouncements = [
  {
    id: 'fallback-news-1',
    type: 'news',
    text: '# Welcome to NewtonBotics',
    details: 'Browse our latest research, events, and lab updates.',
    date: null,
    category: 'News',
    isFallback: true,
  },
];

const MIN_TRACK_REPEATS = 6;

const NewsTicker = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [hoveredNews, setHoveredNews] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const segmentRef = useRef(null);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const displayAnnouncements =
    announcements.length > 0 ? announcements : fallbackAnnouncements;

  const tickerItems = useMemo(() => {
    const repeatCount = Math.max(
      MIN_TRACK_REPEATS,
      Math.ceil(MIN_TRACK_REPEATS / displayAnnouncements.length)
    );

    return Array.from({ length: repeatCount }, (_, repeatIndex) =>
      displayAnnouncements.map((announcement) => ({
        ...announcement,
        loopKey: `${announcement.id}-${repeatIndex}`,
      }))
    ).flat();
  }, [displayAnnouncements]);

  const handleNewsClick = useCallback((announcement) => {
    setSelectedNews(announcement);
  }, []);

  const renderAnnouncementItems = useCallback(
    (keyPrefix = 'item') =>
      tickerItems.map((announcement, index) => (
        <span key={`${keyPrefix}-${announcement.loopKey}-${index}`} className="inline-flex items-center">
          <span
            className={`inline-block px-2 py-1 rounded-lg transition-all duration-300 cursor-pointer hover:bg-white/10 hover:shadow-md hover:scale-105 relative ${
              hoveredNews === announcement.id ? 'bg-white/10 shadow-md scale-105' : ''
            }`}
            onMouseEnter={(e) => {
              setHoveredNews(announcement.id);
              setIsPaused(true);
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltipPosition({
                x: rect.left + rect.width / 2,
                y: rect.top - 10,
              });
            }}
            onMouseLeave={() => {
              setHoveredNews(null);
              setIsPaused(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleNewsClick(announcement);
            }}
          >
            {announcement.text}
          </span>
          <span className="mx-8 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" aria-hidden="true" />
        </span>
      )),
    [tickerItems, handleNewsClick, hoveredNews]
  );

  useEffect(() => {
    const updateSegmentWidth = () => {
      if (segmentRef.current) {
        setSegmentWidth(segmentRef.current.offsetWidth);
      }
    };

    updateSegmentWidth();

    const observer = new ResizeObserver(updateSegmentWidth);
    if (segmentRef.current) {
      observer.observe(segmentRef.current);
    }

    window.addEventListener('resize', updateSegmentWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSegmentWidth);
    };
  }, [tickerItems]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/events/navigation`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          if (isMounted) {
            setAnnouncements(fallbackAnnouncements);
            setIsLoading(false);
          }
          return;
        }

        const data = await res.json();
        if (!isMounted) return;

        if (data?.success && Array.isArray(data?.data?.items) && data.data.items.length > 0) {
          const mapped = data.data.items.map((item) => ({
            id: String(item.id),
            type: item.type,
            text: `# ${item.title}`,
            details:
              item.type === 'news'
                ? item.excerpt || item.content || 'Click to read more...'
                : item.description || 'Click to view event details...',
            date:
              item.type === 'news'
                ? item.publishedAt || item.createdAt
                : item.startDate || item.createdAt,
            category:
              item.type === 'news'
                ? item.category?.name || 'News'
                : item.eventType || item.category || 'Event',
          }));
          setAnnouncements(mapped);
        } else {
          setAnnouncements([]);
        }
      } catch {
        if (isMounted) {
          setAnnouncements(fallbackAnnouncements);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTickerClick = () => {
    setIsPaused((prev) => !prev);
  };

  const closeModal = () => {
    setSelectedNews(null);
  };

  const scrollSpeed = 45;
  const duration = Math.max((segmentWidth || 1) / scrollSpeed, 18);
  const tickerShift = segmentWidth ? `-${segmentWidth}px` : "-50%";

  return (
    <>
      <div className="bg-black border-b border-white/10 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-y-1"></div>
        </div>

        <div className="container mx-auto px-4 py-2.5 relative">
          <div className="flex items-center justify-between min-h-[32px]">
            <div className="flex items-center gap-2 mr-4 md:mr-6 flex-shrink-0">
              <div
                className={`w-2 h-2 rounded-full ${isPaused ? 'bg-white' : 'bg-white animate-pulse'}`}
              ></div>
              <span className="text-xs font-bold text-white uppercase tracking-wide hidden sm:inline">
                {isLoading ? 'Loading...' : 'Latest News'}
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-wide sm:hidden">
                {isLoading ? 'Loading' : 'News'}
              </span>
            </div>

            <div
              className="flex-1 overflow-hidden relative min-h-[20px] flex items-center cursor-pointer hover:bg-white/5 rounded-lg transition-colors duration-200"
              onClick={handleTickerClick}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div
                className="news-ticker-track flex w-max items-center whitespace-nowrap text-sm font-medium text-white/80"
                style={{
                  animationDuration: `${duration}s`,
                  animationPlayState: isPaused ? 'paused' : 'running',
                  ['--ticker-shift']: tickerShift,
                }}
              >
                <div ref={segmentRef} className="inline-flex items-center shrink-0">
                  {renderAnnouncementItems('track-a')}
                </div>
                <div className="inline-flex items-center shrink-0" aria-hidden="true">
                  {renderAnnouncementItems('track-b')}
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 ml-4 md:ml-6 flex-shrink-0">
              <div
                onClick={handleTickerClick}
                className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer hover:scale-125 ${
                  isPaused ? 'bg-white scale-125 shadow-sm' : 'bg-white/60 animate-pulse'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {hoveredNews && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-black border border-white/10 text-white px-3 py-2 rounded-lg shadow-lg text-xs whitespace-nowrap flex items-center gap-2">
            <Info className="w-3 h-3" />
            Click for details
          </div>
          <div className="w-2 h-2 bg-black border-l border-b border-white/10 rotate-45 mx-auto -mt-1"></div>
        </div>
      )}

      {selectedNews && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-black border border-white/10 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/5 border-b border-white/10 p-6 text-white relative">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded-full text-white">
                  {selectedNews.category}
                </span>
                {selectedNews.date && (
                  <span className="text-xs text-white/60">
                    {new Date(selectedNews.date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white">{selectedNews.text}</h3>
            </div>

            <div className="p-6">
              <p className="text-white/80 leading-relaxed mb-6">{selectedNews.details}</p>

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (
                      selectedNews?.id &&
                      selectedNews?.type &&
                      !selectedNews?.isFallback &&
                      isValidObjectId(String(selectedNews.id))
                    ) {
                      const routePath =
                        selectedNews.type === 'event'
                          ? `/Events/${selectedNews.id}`
                          : `/News/${selectedNews.id}`;
                      router.push(routePath);
                      setSelectedNews(null);
                    }
                  }}
                  disabled={
                    selectedNews?.isFallback ||
                    !isValidObjectId(String(selectedNews?.id || ''))
                  }
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedNews?.type === 'event' ? 'View Event' : 'Read More'}
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewsTicker;
