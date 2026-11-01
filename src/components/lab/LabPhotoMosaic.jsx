"use client";
import { useEffect, useState } from "react";
import RemoteImage from "@/components/RemoteImage";
import { API_BASE_URL } from "@/lib/api";

const photoUrl = (item) => item?.fileUrl || item?.secure_url || item?.url || "";
// Only real uploads: remote URLs from the media API (local /public files are stock or demo images)
const isRealPhoto = (item) => item?.fileType === "image" && /^https?:\/\//i.test(photoUrl(item));

const HEIGHTS = {
  lg: "h-[260px] sm:h-[420px] lg:h-[520px]",
  sm: "h-[280px]",
};

/**
 * Real photos from the lab's Gallery, laid out as one large frame and two small ones. Calls the media
 * API directly (mediaService falls back to stock mock data) and prefers featured shots. If no real
 * photos load, it renders `fallback` instead of ever showing a stock image.
 */
export default function LabPhotoMosaic({ count = 3, size = "lg", fallback = null, className = "" }) {
  const [photos, setPhotos] = useState(null); // null = loading

  useEffect(() => {
    let alive = true;
    const load = async (params) => {
      const res = await fetch(`${API_BASE_URL}/media?fileType=image&limit=24${params}`, { cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      return (data?.data?.items || []).filter(isRealPhoto);
    };
    (async () => {
      try {
        const featured = await load("&isFeatured=true");
        const picked = featured.length >= count ? featured : [...featured, ...(await load(""))];
        const unique = [...new Map(picked.map((p) => [p._id, p])).values()];
        if (alive) setPhotos(unique.slice(0, count));
      } catch (_) {
        if (alive) setPhotos([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [count]);

  if (photos === null) {
    return <div aria-hidden="true" className={`nb-skeleton rounded-lg ${HEIGHTS[size]} ${className}`} />;
  }
  if (photos.length === 0) return fallback;

  const [lead, ...rest] = photos;
  return (
    <div
      className={`grid gap-3 ${rest.length ? "sm:grid-cols-[2fr_1fr] sm:grid-rows-2" : ""} ${
        size === "lg" ? "sm:h-[420px] lg:h-[520px]" : "h-[280px]"
      } ${className}`}
    >
      {[lead, ...rest].map((p, i) => (
        <figure
          key={p._id}
          className={`group relative m-0 overflow-hidden rounded-md bg-surface ${
            i === 0 ? `${size === "lg" ? "h-[260px] sm:h-auto" : "h-full"} sm:row-span-2` : "hidden h-auto sm:block"
          }`}
        >
          <RemoteImage
            src={photoUrl(p)}
            displayWidth={i === 0 ? 900 : 450}
            alt={p.title || "NewtonBotics lab"}
            priority={i === 0}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {p.title && (
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-10 font-mono text-[11px] uppercase tracking-[0.06em] text-white/90">
              {p.title}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
