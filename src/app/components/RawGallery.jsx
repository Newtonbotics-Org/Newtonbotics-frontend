"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import mediaService from "../../lib/media";

// Utility: Format a Cloudinary image url to force browser display (f_auto for TIFF)
function isCloudinaryUrl(url) {
  return typeof url === "string" && /https?:\/\/res\.cloudinary\.com\//.test(url);
}

function sanitizeCloudinaryExtension(url) {
  if (!url) return url;
  // Replace problematic TIFF extension with jpg to ensure browser display
  return url.replace(/\.(tif|tiff)(\?|#|$)/i, '.jpg$2');
}

function transformCloudinaryUrl(url, { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = {}) {
  if (!isCloudinaryUrl(url)) return url;
  const safeUrl = sanitizeCloudinaryExtension(url);
  const transforms = [
    `f_${format}`,
    `q_${quality}`,
    (width || height) ? `c_${crop}` : null,
    width ? `w_${width}` : null,
    height ? `h_${height}` : null,
  ].filter(Boolean).join(',');
  // Inject transforms right after /image/upload/
  return safeUrl.replace('/image/upload/', `/image/upload/${transforms}/`);
}

function getPrimaryUrl(item) {
  const url = (
    item?.fileUrl ||
    item?.secure_url ||
    item?.url ||
    item?.sourceUrl ||
    ''
  );
  const normalized = transformCloudinaryUrl(url, {});
  return normalized;
}

function getThumbnailUrl(item) {
  const url = (
    item?.thumbnailUrl ||
    item?.thumbnail ||
    item?.previewUrl ||
    getPrimaryUrl(item)
  );
  const normalized = transformCloudinaryUrl(url, { width: 600, height: 600, crop: 'fill' });
  return normalized;
}

import autonomousDrone from "../assets/automousdronesystem.jpg";
import industrialAutomation from "../assets/industrialAutonomous.jpg";
import medicalAssistantRobot from "../assets/medicalautonomousSystem.jpg";
import image01 from "../assets/image01.png";

const rotations = [-6, 4, -2, 5, -4, 3, -5, 2, -3, 6, -1, 4];

export default function RawGallery() {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    mediaService
      .listMedia({ isFeatured: true, limit: 50 })
      .then((res) => {
        if (isMounted) {
          setMediaItems(res.items || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Error loading media");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Only show featured media (add right after state vars)
  const featuredMedia = mediaItems.filter(item => item.isFeatured);

  return (
    <div className="container mx-auto px-6">
        <div className="flex items-end justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-white">And we have a lot of fun!</h2>
        <Link href="/Gallery" className="hidden sm:inline-block">
          <span className="px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-white/90 hover:bg-white/15">
            Explore more →
          </span>
        </Link>
      </div>
      <div className="relative mx-auto">
        {loading ? (
          <div className="text-center text-white py-10">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-400 py-10">{error}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {featuredMedia.map((item, idx) => (
              <div
                key={item._id || idx}
                className="relative bg-white rounded-xl shadow-2xl shadow-black/50 p-1 rotate-0 transform transition-transform duration-150 hover:scale-102"
                style={{ rotate: `${rotations[idx % rotations.length]}deg` }}
                title={item.title}
              >
                <div className="relative w-full h-36 sm:h-40 md:h-44 lg:h-48 overflow-hidden rounded-lg flex flex-col justify-center items-center">
                  {item.fileType === "image" ? (
                    <Image
                      src={getThumbnailUrl(item)}
                      alt={item.title || item.alt || "Featured Media"}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover"
                      priority={idx < 4}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/bgImageforroboticslab.jpg";
                      }}
                    />
                  ) : item.fileType === "video" ? (
                    <video
                      src={item.fileUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      controls
                      preload="metadata"
                      title={item.title || "Video"}
                    />
                  ) : null}
                  {/* Show title if image is missing */}
                  {item.fileType === "image" && !getThumbnailUrl(item) && (
                    <div className="bg-gray-100 text-gray-600 p-2 rounded shadow">{item.title}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-8 text-center sm:hidden">
        <Link href="/Gallery" className="inline-block px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-white/90 hover:bg-white/15">
          Explore more →
        </Link>
      </div>
    </div>
  );
} 