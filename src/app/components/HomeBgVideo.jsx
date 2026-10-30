"use client";

import { useEffect, useRef, useState } from "react";

export const HOME_BG_VIDEO = "/bg%20video%20test01.mp4";

/**
 * Defers loading the background video until after first paint / idle
 * so the hero image can win the network and become LCP sooner.
 */
export default function HomeBgVideo({ videoOpacity = 0.22, overlayOpacity = 0.62 }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId;
    let timeoutId;
    const motionPreference = window.matchMedia(
      "(max-width: 767px), (prefers-reduced-motion: reduce)"
    );

    const start = () => {
      if (!cancelled && !document.hidden && !motionPreference.matches) {
        setShouldLoad(true);
      }
    };

    const cancelScheduledLoad = () => {
      if (idleId != null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
        idleId = undefined;
      }
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };
    const schedule = () => {
      cancelScheduledLoad();
      if (document.hidden) return;
      if (motionPreference.matches) {
        setShouldLoad(false);
        return;
      }
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(start, { timeout: 1800 });
      } else {
        timeoutId = window.setTimeout(start, 1200);
      }
    };
    const onMotionPreferenceChange = () => {
      if (motionPreference.matches) {
        cancelScheduledLoad();
        setShouldLoad(false);
        videoRef.current?.pause();
      } else {
        schedule();
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelScheduledLoad();
        videoRef.current?.pause();
      } else {
        schedule();
      }
    };

    motionPreference.addEventListener("change", onMotionPreferenceChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    schedule();
    return () => {
      cancelled = true;
      motionPreference.removeEventListener("change", onMotionPreferenceChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      cancelScheduledLoad();
    };
  }, []);

  useEffect(() => {
    if (!shouldLoad || !videoRef.current || !containerRef.current) return;
    const video = videoRef.current;
    const motionPreference = window.matchMedia(
      "(max-width: 767px), (prefers-reduced-motion: reduce)"
    );
    let isVisible = false;
    const syncPlayback = () => {
      if (isVisible && !document.hidden && !motionPreference.matches) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
          isVisible = entry.isIntersecting;
          syncPlayback();
        });
    const onVisibilityChange = () => syncPlayback();
    const onMotionPreferenceChange = () => syncPlayback();
    observer?.observe(containerRef.current);
    document.addEventListener("visibilitychange", onVisibilityChange);
    motionPreference.addEventListener("change", onMotionPreferenceChange);
    if (!observer) {
      isVisible = true;
      syncPlayback();
    }

    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionPreference.removeEventListener("change", onMotionPreferenceChange);
      video.pause();
    };
  }, [shouldLoad]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
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
