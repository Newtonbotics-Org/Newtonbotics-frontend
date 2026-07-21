"use client";

import { useEffect, useRef, useState } from "react";

export const HOME_BG_VIDEO = "/bg%20video%20test01.mp4";

/**
 * Defers loading the background video until after first paint / idle
 * so the hero image can win the network and become LCP sooner.
 */
export default function HomeBgVideo({ videoOpacity = 0.22, overlayOpacity = 0.62 }) {
  const videoRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId;
    let timeoutId;

    const start = () => {
      if (!cancelled) setShouldLoad(true);
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(start, { timeout: 1800 });
    } else {
      timeoutId = window.setTimeout(start, 1200);
    }

    return () => {
      cancelled = true;
      if (idleId != null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!shouldLoad || !videoRef.current) return;
    const video = videoRef.current;
    const play = () => {
      video.play().catch(() => {});
    };
    if (video.readyState >= 2) play();
    else video.addEventListener("canplay", play, { once: true });
  }, [shouldLoad]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      {shouldLoad ? (
        <video
          ref={videoRef}
          src={HOME_BG_VIDEO}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: videoOpacity }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: 1 }}
        />
      )}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
}
