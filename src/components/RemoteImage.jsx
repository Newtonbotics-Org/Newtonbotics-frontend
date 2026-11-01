"use client";

import { optimizeImageUrl } from "@/lib/cloudinaryMedia";

/**
 * Renders remote CMS/CDN images without next/image host allowlisting.
 * Cloudinary URLs are right-sized via `optimizeImageUrl`: pass `displayWidth`
 * (CSS px the image is shown at; doubled for retina) and optionally
 * `displayHeight` + `crop="fill"` for fixed-ratio thumbnails.
 * Images lazy-load unless `priority` is set (use it for above-the-fold heroes).
 */
export default function RemoteImage({
  src,
  alt = "",
  className = "",
  fill = false,
  width,
  height,
  displayWidth,
  displayHeight,
  crop,
  priority = false,
  onError,
}) {
  if (!src) return null;

  const optimized = optimizeImageUrl(src, {
    width: displayWidth || width || 800,
    height: displayHeight,
    crop: crop || (displayHeight ? "fill" : "limit"),
  });

  return (
    // eslint-disable-next-line @next/next/no-img-element -- API-supplied hosts aren't allowlisted for next/image
    <img
      src={optimized}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      className={fill ? `absolute inset-0 h-full w-full ${className}` : className}
      onError={onError}
    />
  );
}
