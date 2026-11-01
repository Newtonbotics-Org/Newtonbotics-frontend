"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import newsService, { isValidObjectId } from "../../../lib/news";
import RemoteImage from "@/components/RemoteImage";
import CropFrame from "@/components/lab/CropFrame";
import { ArticleDetailSkeleton } from "@/components/PageSkeletons";
import { formatDate } from "@/lib/labUi";
import NotFoundState from "@/components/lab/NotFoundState";

const getAuthor = (item) => {
  const a = item.author;
  if (!a) return "NewtonBotics Team";
  if (typeof a === "string") return a;
  return a.name || [a.firstName, a.lastName].filter(Boolean).join(" ") || "NewtonBotics Team";
};

// Typography for CMS-provided HTML (no typography plugin in this project).
const ARTICLE_BODY =
  "text-[17px] leading-[1.75] text-ink-body break-words " +
  "[&_p]:my-0 [&_p+p]:mt-5 " +
  "[&_h2]:mb-3 [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-[28px] [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:tracking-[-0.02em] [&_h2]:text-ink " +
  "[&_h3]:mb-2 [&_h3]:mt-10 [&_h3]:font-display [&_h3]:text-[22px] [&_h3]:font-semibold [&_h3]:text-ink " +
  "[&_h4]:mb-2 [&_h4]:mt-8 [&_h4]:font-semibold [&_h4]:text-ink " +
  "[&_a]:text-signal-text [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-signal-hover " +
  "[&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-1.5 " +
  "[&_blockquote]:my-8 [&_blockquote]:border-l-2 [&_blockquote]:border-signal [&_blockquote]:pl-5 [&_blockquote]:font-display [&_blockquote]:text-[22px] [&_blockquote]:leading-snug [&_blockquote]:text-ink " +
  "[&_img]:my-8 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md " +
  "[&_code]:rounded [&_code]:bg-[#ECEDE8] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] " +
  "[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-ink [&_pre]:p-4 [&_pre]:text-paper [&_pre_code]:bg-transparent [&_pre_code]:p-0 " +
  "[&_hr]:my-10 [&_hr]:border-line [&_strong]:font-semibold [&_strong]:text-ink";

export default function NewsDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (!isValidObjectId(String(id || ""))) {
          if (isMounted) {
            setItem(null);
            setError("This news item is unavailable.");
          }
          return;
        }

        const data = await newsService.getNews(String(id));
        if (!isMounted) return;
        setItem(data);
        if (!data) {
          setError("News article not found.");
        }
      } catch (e) {
        if (!isMounted) return;
        setError(e.message || "Failed to load news item");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    if (id) load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) return <ArticleDetailSkeleton className="nb-dark" />;

  if (error || !item) {
    return (
      <NotFoundState
        title="Article not found"
        message={error || "The article you're looking for doesn't exist."}
        gameLabel="Article not found"
        actions={
          <Link href="/News" className="nb-btn nb-btn-primary">
            Back to news
          </Link>
        }
      />
    );
  }

  const date = formatDate(item.publishedAt || item.createdAt, { day: "numeric", month: "long", year: "numeric" });
  const meta = [item.category?.name, date, item.readTime].filter(Boolean);
  const image = item.featuredImageUrl || item.image || "";
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const isPlainText = !/<[a-z][\s\S]*>/i.test(item.content || "");

  return (
    <main className="nb-dark bg-paper text-ink">
      <div className="nb-container flex flex-col gap-10 pb-28 pt-10">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap gap-2 font-mono text-xs uppercase tracking-[0.04em] text-ink-muted"
        >
          <Link href="/News" className="text-ink-muted no-underline hover:text-ink">
            News
          </Link>
          <span aria-hidden="true">/</span>
          <span className="line-clamp-1 text-ink">{item.title}</span>
        </nav>

        <header className="mx-auto flex w-full max-w-[680px] flex-col gap-5">
          {meta.length > 0 && (
            <p className="m-0 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
              {meta.map((m, i) => (
                <span key={i} className={i === 0 && item.category?.name ? "text-signal-text" : undefined}>
                  {i > 0 && <span aria-hidden="true" className="mr-3">·</span>}
                  {m}
                </span>
              ))}
            </p>
          )}
          <h1 className="m-0 font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[48px]">
            {item.title}
          </h1>
          {item.excerpt && <p className="m-0 text-xl leading-relaxed text-ink-muted">{item.excerpt}</p>}
          <p className="m-0 border-t border-line pt-4 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
            By {getAuthor(item)}
          </p>
        </header>

        {image && !imageFailed && (
          <CropFrame className="mx-auto w-full max-w-[1040px]" caption={`Fig. 01 — ${item.title}`} captionRight={date || undefined}>
            <RemoteImage
              src={image}
              alt={item.title}
              className="block max-h-[560px] w-full rounded object-cover"
              onError={() => setImageFailed(true)}
            />
          </CropFrame>
        )}

        <article className="mx-auto flex w-full max-w-[680px] flex-col gap-10">
          {/* Content (may contain HTML) */}
          <div
            className={`${ARTICLE_BODY} ${isPlainText ? "whitespace-pre-line" : ""}`}
            dangerouslySetInnerHTML={{ __html: item.content || "" }}
          />

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-line pt-6">
              {tags.map((tag, i) => (
                <span key={`${tag}-${i}`} className="rounded border border-line px-2 py-1 font-mono text-[11px] text-ink-muted">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <Link href="/News" className="nb-btn nb-btn-secondary self-start">
            <ArrowLeft size={16} aria-hidden="true" /> All news
          </Link>
        </article>
      </div>
    </main>
  );
}
