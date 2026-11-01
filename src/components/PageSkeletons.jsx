/**
 * Shared card & page skeletons — mirrors real card layouts with nb-skeleton shimmer.
 */

function Bone({ className = "", delay = 0 }) {
  return (
    <div
      className={`nb-skeleton ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    />
  );
}

const cardShell =
  "bg-surface rounded-lg border border-line";

export function ProjectCardSkeleton({ delay = 0 }) {
  return (
    <div className={`${cardShell} rounded-2xl p-6 h-full`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex gap-2 mb-4">
        <Bone className="h-6 w-20 rounded" delay={delay} />
        <Bone className="h-6 w-16 rounded" delay={delay + 40} />
      </div>
      <Bone className="h-48 w-full rounded-lg mb-4" delay={delay + 80} />
      <Bone className="h-6 w-3/4 rounded mb-3" delay={delay + 120} />
      <Bone className="h-3.5 w-full rounded mb-2" delay={delay + 160} />
      <Bone className="h-3.5 w-5/6 rounded mb-2" delay={delay + 200} />
      <Bone className="h-3.5 w-2/3 rounded mb-4" delay={delay + 240} />
      <Bone className="h-4 w-40 rounded mb-2" delay={delay + 280} />
      <Bone className="h-4 w-28 rounded mb-4" delay={delay + 320} />
      <Bone className="h-2 w-full rounded mb-4" delay={delay + 360} />
      <Bone className="h-10 w-full rounded-lg" delay={delay + 400} />
    </div>
  );
}

export function EventCardSkeleton({ delay = 0 }) {
  return <ProjectCardSkeleton delay={delay} />;
}

export function NewsCardSkeleton({ delay = 0, featured = false }) {
  return (
    <div
      className={`${cardShell} overflow-hidden h-full`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Bone className={`w-full ${featured ? "h-64" : "h-48"} rounded-none`} delay={delay} />
      <div className="p-4 sm:p-6 space-y-3">
        <Bone className="h-3 w-32 rounded" delay={delay + 60} />
        <Bone className="h-6 w-full rounded" delay={delay + 120} />
        <Bone className="h-3.5 w-full rounded" delay={delay + 180} />
        <Bone className="h-3.5 w-5/6 rounded" delay={delay + 220} />
        <div className="flex gap-2 pt-1">
          <Bone className="h-5 w-16 rounded-full" delay={delay + 260} />
          <Bone className="h-5 w-20 rounded-full" delay={delay + 300} />
        </div>
        <Bone className="h-10 w-36 rounded-lg mt-2" delay={delay + 340} />
      </div>
    </div>
  );
}

export function GalleryTileSkeleton({ delay = 0 }) {
  return (
    <div className={`${cardShell} overflow-hidden`} style={{ animationDelay: `${delay}ms` }}>
      <Bone className="aspect-square w-full rounded-none" delay={delay} />
      <div className="p-3 space-y-2">
        <Bone className="h-3.5 w-3/4 rounded" delay={delay + 80} />
        <Bone className="h-3 w-1/2 rounded" delay={delay + 120} />
      </div>
    </div>
  );
}

export function InventoryCardSkeleton({ delay = 0 }) {
  return (
    <div className={`${cardShell} rounded-xl p-6 h-full relative`} style={{ animationDelay: `${delay}ms` }}>
      <Bone className="h-6 w-24 rounded-full absolute top-4 right-4" delay={delay} />
      <Bone className="h-56 w-full rounded-lg mb-4" delay={delay + 60} />
      <Bone className="h-6 w-2/3 rounded mb-2" delay={delay + 120} />
      <Bone className="h-4 w-full rounded mb-3" delay={delay + 160} />
      <div className="flex justify-between">
        <Bone className="h-4 w-24 rounded" delay={delay + 200} />
        <Bone className="h-4 w-20 rounded" delay={delay + 240} />
      </div>
      <div className="flex gap-2 mt-4">
        <Bone className="h-9 w-20 rounded-md" delay={delay + 280} />
        <Bone className="h-9 w-16 rounded-md" delay={delay + 320} />
      </div>
    </div>
  );
}

export function ResourceCardSkeleton({ delay = 0 }) {
  return (
    <div className={`${cardShell} overflow-hidden h-full`} style={{ animationDelay: `${delay}ms` }}>
      <Bone className="aspect-[16/10] w-full rounded-none" delay={delay} />
      <div className="p-5 space-y-3">
        <Bone className="h-5 w-3/4 rounded" delay={delay + 80} />
        <Bone className="h-3.5 w-full rounded" delay={delay + 120} />
        <Bone className="h-3.5 w-2/3 rounded" delay={delay + 160} />
        <Bone className="h-9 w-full rounded-lg mt-2" delay={delay + 200} />
      </div>
    </div>
  );
}

export function ResearchAreaCardSkeleton({ delay = 0, compact = false }) {
  return (
    <div
      className={`${cardShell} ${compact ? "rounded-xl p-4 lg:p-5" : "rounded-2xl p-6"} h-full`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <Bone className={`${compact ? "h-10 w-10" : "h-12 w-12"} rounded-xl`} delay={delay} />
        <Bone className="h-6 w-20 rounded-full" delay={delay + 60} />
      </div>
      <Bone className={`${compact ? "h-5" : "h-6"} w-3/4 rounded mb-2`} delay={delay + 100} />
      <Bone className="h-3.5 w-full rounded mb-2" delay={delay + 140} />
      <Bone className="h-3.5 w-5/6 rounded mb-4" delay={delay + 180} />
      {!compact && (
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-line">
          <Bone className="h-10 w-full rounded" delay={delay + 220} />
          <Bone className="h-10 w-full rounded" delay={delay + 260} />
        </div>
      )}
    </div>
  );
}

export function TeamMemberCardSkeleton({ delay = 0 }) {
  return (
    <div
      className={`${cardShell} rounded-xl p-6 text-center`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Bone className="h-24 w-24 rounded-full mx-auto mb-4" delay={delay} />
      <Bone className="h-5 w-32 rounded mx-auto mb-2" delay={delay + 80} />
      <Bone className="h-4 w-24 rounded mx-auto mb-3" delay={delay + 120} />
      <Bone className="h-3.5 w-full rounded mb-2" delay={delay + 160} />
      <Bone className="h-3.5 w-4/5 rounded mx-auto" delay={delay + 200} />
    </div>
  );
}

export function StatCardSkeleton({ delay = 0 }) {
  return (
    <div
      className={`${cardShell} rounded-2xl p-4 sm:p-6 text-center`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Bone className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl mx-auto mb-4" delay={delay} />
      <Bone className="h-8 w-16 rounded mx-auto mb-2" delay={delay + 80} />
      <Bone className="h-4 w-24 rounded mx-auto" delay={delay + 120} />
    </div>
  );
}

export function FilterBarSkeleton({ fields = 4 }) {
  return (
    <div className={`${cardShell} rounded-2xl p-6 mb-8`}>
      <Bone className="h-6 w-40 rounded mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: fields }).map((_, i) => (
          <Bone key={i} className="h-12 w-full rounded-lg" delay={i * 60} />
        ))}
      </div>
    </div>
  );
}

export function DetailPageSkeleton({ className = "" }) {
  return (
    <div className={`min-h-screen bg-paper text-ink ${className}`} role="status" aria-label="Loading content">
      <div className="container mx-auto px-4 py-8">
        <Bone className="h-10 w-36 rounded-lg mb-6" />
        <Bone className="h-64 md:h-80 w-full rounded-2xl mb-8" />
        <div className="flex flex-wrap gap-2 mb-6">
          <Bone className="h-7 w-24 rounded-full" />
          <Bone className="h-7 w-20 rounded-full" delay={40} />
          <Bone className="h-7 w-28 rounded-full" delay={80} />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Bone className="h-10 w-2/3 rounded" />
            <Bone className="h-4 w-full rounded" delay={60} />
            <Bone className="h-4 w-full rounded" delay={120} />
            <Bone className="h-4 w-5/6 rounded" delay={180} />
            <Bone className="h-4 w-full rounded" delay={240} />
            <Bone className="h-32 w-full rounded-xl mt-4" delay={300} />
            <Bone className="h-24 w-full rounded-xl" delay={360} />
          </div>
          <div className="space-y-4">
            <Bone className="h-48 w-full rounded-xl" />
            <Bone className="h-40 w-full rounded-xl" delay={80} />
            <Bone className="h-32 w-full rounded-xl" delay={160} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArticleDetailSkeleton({ className = "" }) {
  return (
    <div className={`min-h-screen bg-paper text-ink ${className}`} role="status" aria-label="Loading article">
      <div className="container mx-auto px-4 py-6">
        <Bone className="h-8 w-24 rounded-lg mb-4" />
        <Bone className="h-64 w-full rounded-2xl mb-6" />
        <Bone className="h-10 w-3/4 rounded mb-3" delay={80} />
        <Bone className="h-4 w-48 rounded mb-6" delay={120} />
        <div className="space-y-3 max-w-3xl">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bone key={i} className="h-4 w-full rounded" delay={i * 50} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ActivityDashboardSkeleton() {
  return (
    <div className="grid gap-6" role="status" aria-label="Loading activity">
      <div className={`${cardShell} rounded-2xl p-5`}>
        <Bone className="h-5 w-24 rounded mb-3" />
        <Bone className="h-4 w-48 rounded mb-2" />
        <Bone className="h-4 w-32 rounded mb-3" />
        <Bone className="h-2 w-full rounded-full" />
      </div>
      <div className={`${cardShell} rounded-2xl p-5`}>
        <Bone className="h-5 w-32 rounded mb-4" />
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-20 w-full rounded-xl" delay={i * 60} />
          ))}
        </div>
      </div>
      <div className={`${cardShell} rounded-2xl p-5`}>
        <Bone className="h-5 w-28 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bone key={i} className="h-14 w-full rounded-lg" delay={i * 70} />
          ))}
        </div>
      </div>
    </div>
  );
}

const SKELETON_MAP = {
  media: ProjectCardSkeleton,
  project: ProjectCardSkeleton,
  event: EventCardSkeleton,
  news: NewsCardSkeleton,
  gallery: GalleryTileSkeleton,
  inventory: InventoryCardSkeleton,
  resource: ResourceCardSkeleton,
  research: ResearchAreaCardSkeleton,
  team: TeamMemberCardSkeleton,
  stat: StatCardSkeleton,
};

export function CardSkeletonGrid({
  variant = "media",
  count = 6,
  cols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  gap = "gap-6",
  className = "",
  skeletonProps = {},
}) {
  const Skeleton = SKELETON_MAP[variant] || ProjectCardSkeleton;

  return (
    <div className={`grid ${cols} ${gap} ${className}`} role="status" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} delay={i * 80} {...skeletonProps} />
      ))}
    </div>
  );
}
