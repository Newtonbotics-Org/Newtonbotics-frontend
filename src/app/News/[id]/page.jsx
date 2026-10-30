"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import newsService, { isValidObjectId } from "../../../lib/news";
import Image from "next/image";
import { Calendar, ArrowLeft } from "lucide-react";
import { ArticleDetailSkeleton } from "@/components/PageSkeletons";

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
    return () => { isMounted = false; };
  }, [id]);

  if (isLoading) return <ArticleDetailSkeleton />;
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white grid place-items-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/News")}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            Back to News
          </button>
        </div>
      </div>
    );
  }
  if (!item) return <div className="min-h-screen bg-black text-white grid place-items-center">Not found</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-5xl">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="relative aspect-[16/8] min-h-48 max-h-[34rem] w-full rounded-xl overflow-hidden border border-white/10 mb-6 sm:mb-8">
          <Image src={item.featuredImageUrl || "/white logo.png"} alt={item.title} fill className="object-cover" />
        </div>

        <p className="nb-page-eyebrow">NEWTONBOTICS / NEWS</p>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">{item.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-white/60 mb-6">
          <Calendar className="w-4 h-4" />
          <span>{new Date(item.publishedAt || item.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Excerpt */}
        {item.excerpt && (
          <p className="text-white/75 text-base sm:text-lg leading-relaxed mb-6">{item.excerpt}</p>
        )}

        {/* Content (may contain HTML/markdown) */}
        <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:text-white prose-a:text-red-300 prose-a:underline-offset-4 prose-img:rounded-lg prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: item.content || "" }} />
      </div>
    </div>
  );
}


