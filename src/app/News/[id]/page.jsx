"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import newsService, { isValidObjectId } from "../../../lib/news";
import Image from "next/image";
import { Calendar, ArrowLeft } from "lucide-react";

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

  if (isLoading) return <div className="min-h-screen bg-black text-white grid place-items-center">Loading…</div>;
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
      <div className="container mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-white/10 mb-6">
          <Image src={item.featuredImageUrl || "/white logo.png"} alt={item.title} fill className="object-cover" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-2">{item.title}</h1>
        <div className="flex items-center gap-2 text-white/60 mb-6">
          <Calendar className="w-4 h-4" />
          <span>{new Date(item.publishedAt || item.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Excerpt */}
        {item.excerpt && (
          <p className="text-white/80 text-lg mb-6">{item.excerpt}</p>
        )}

        {/* Content (may contain HTML/markdown) */}
        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: item.content || "" }} />
      </div>
    </div>
  );
}


