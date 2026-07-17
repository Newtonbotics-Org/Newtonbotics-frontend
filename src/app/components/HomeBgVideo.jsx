"use client";

export const HOME_BG_VIDEO = "/bg%20video%20test01.mp4";

export default function HomeBgVideo({ videoOpacity = 0.22, overlayOpacity = 0.62 }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <video
        src={HOME_BG_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: videoOpacity }}
      />
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
}
