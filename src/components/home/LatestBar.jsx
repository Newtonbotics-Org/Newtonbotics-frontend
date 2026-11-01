"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { newsService } from "@/lib/news";

/** One-line "LATEST" strip above the nav, fed by the newest published story. */
export default function LatestBar() {
  const [story, setStory] = useState(null);

  useEffect(() => {
    let alive = true;
    newsService.listNews({ limit: 1 }).then((data) => {
      if (alive && data?.items?.length) setStory(data.items[0]);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!story) return null;

  return (
    <Link href={`/News/${story._id}`} className="block bg-ink text-night-text no-underline">
      <div className="nb-container flex flex-wrap items-center gap-3 py-2.5 text-[13px]">
        <span className="rounded-[3px] bg-signal px-[7px] py-[3px] font-mono text-[11px] tracking-[0.08em] text-ink">
          LATEST
        </span>
        <span className="min-w-0 flex-1 truncate">{story.title}</span>
        <span className="hidden text-signal-light sm:inline">Read the update →</span>
      </div>
    </Link>
  );
}
