"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import RemoteImage from "@/components/RemoteImage";
import { API_BASE_URL, apiRequest } from "@/lib/api";

// Each print sits at its own slight angle, like photos pinned to a board
const ROTATIONS = [-6, 4, -2, 5, -4, 3, -5, 2, -3, 6, -1, 4, -4, 2, -2];
const MOBILE_ROTATIONS = [-2, 1.5, -1, 2, -1.5, 1, -2, 1, -1, 2, -0.5, 1.5];
const MAX_PHOTOS = 15;
const MOBILE_PHOTOS = 6;

const photoUrl = (item) => item?.thumbnailUrl || item?.fileUrl || item?.secure_url || item?.url || "";
// Real uploads only: never the local stock/demo images
const isRealPhoto = (item) => item?.fileType === "image" && /^https?:\/\//i.test(photoUrl(item));

/**
 * "And we have a lot of fun!" photo wall: the Gallery's featured photos as tilted white-framed prints.
 * Reads the media API directly (mediaService falls back to stock mock data); hides itself when there
 * are no real photos, and drops any print whose image fails to load.
 */
export default function HomeFunWall() {
  const [photos, setPhotos] = useState(null); // null = loading
  const [failed, setFailed] = useState(() => new Set());
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let alive = true;
    apiRequest(`${API_BASE_URL}/media?fileType=image&isFeatured=true&limit=50`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => alive && setPhotos((data?.data?.items || []).filter(isRealPhoto).slice(0, MAX_PHOTOS)))
      .catch(() => alive && setPhotos([]));
    return () => {
      alive = false;
    };
  }, []);

  const shown = (photos || []).filter((p) => !failed.has(p._id));
  if (photos && shown.length === 0) return null;
  const rotations = compact ? MOBILE_ROTATIONS : ROTATIONS;
  const tiles = photos ? shown : Array.from({ length: 5 }, (_, i) => ({ _id: `s${i}` }));

  return (
    <section className="nb-container flex flex-col gap-8 pt-24 sm:pt-28" aria-labelledby="home-fun">
      <div className="flex items-end justify-between gap-4">
        <h2
          id="home-fun"
          className="m-0 font-display font-bold uppercase tracking-[0.02em]"
          style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.5rem)" }}
        >
          And we have a lot of fun!
        </h2>
        <Link
          href="/Gallery"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-medium text-night-text no-underline transition-colors hover:border-white/30 hover:bg-white/10"
        >
          Explore more <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <ul className="m-0 grid list-none grid-cols-2 gap-3 overflow-hidden p-3 sm:grid-cols-3 sm:gap-5 sm:p-5 lg:grid-cols-5 lg:gap-6">
        {tiles.map((item, idx) => (
          <li
            key={item._id}
            className={idx >= MOBILE_PHOTOS ? "hidden sm:block" : ""}
            style={{ "--nb-tilt": `${rotations[idx % rotations.length]}deg` }}
          >
            {photos ? (
              <Link
                href="/Gallery"
                aria-label={item.title ? `${item.title} — open the gallery` : "Open the gallery"}
                className="relative block rounded-lg bg-white p-1 shadow-2xl shadow-black/60 transition-[rotate,scale,translate] duration-200 [rotate:var(--nb-tilt)] hover:z-10 hover:[rotate:0deg] hover:[scale:1.05] hover:[translate:0_-4px] focus-visible:[rotate:0deg] sm:rounded-xl"
              >
                <span className="relative block h-28 overflow-hidden rounded-md sm:h-36 md:h-40 lg:h-48 sm:rounded-lg">
                  <RemoteImage
                    src={photoUrl(item)}
                    displayWidth={360}
                    displayHeight={260}
                    alt={item.title || "NewtonBotics moment"}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={() => setFailed((prev) => new Set(prev).add(item._id))}
                  />
                </span>
              </Link>
            ) : (
              <span className="block rounded-lg bg-white p-1 shadow-2xl shadow-black/60 [rotate:var(--nb-tilt)] sm:rounded-xl">
                <span className="nb-skeleton block h-28 rounded-md sm:h-36 md:h-40 lg:h-48" style={{ animationDelay: `${idx * 80}ms` }} />
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
