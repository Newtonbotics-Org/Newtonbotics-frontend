import GalleryClient from "./GalleryClient";
import { Suspense } from "react";

export const metadata = {
  title: "Gallery | NewtonBotics",
  description: "Raw photos and videos from our lab and events.",
};

function GalleryFallback() {
  return (
    <div className="nb-dark bg-paper text-ink" role="status" aria-label="Loading gallery">
      <div className="nb-blueprint border-b border-line">
        <div className="nb-container flex flex-col gap-5 pb-14 pt-16 sm:pt-20">
          <span className="nb-eyebrow">
            <span className="nb-eyebrow-num">[08]</span> Gallery
          </span>
          <p className="nb-h1 m-0">Field notes, in pictures.</p>
        </div>
      </div>
      <div className="nb-container min-h-[50vh] pb-28 pt-10" />
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<GalleryFallback />}>
      <GalleryClient />
    </Suspense>
  );
}
