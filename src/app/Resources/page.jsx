"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Search,
  ExternalLink,
  Link2,
  ImageIcon,
  Video,
  FileText,
  X,
  Loader2,
} from "lucide-react";
import ProtectedRoute from "../../components/ProtectedRoute";
import resourcesService, { RESOURCE_CATEGORIES, RESOURCE_TYPES } from "../../lib/resources";
import { getResourceOpenUrl, getResourcePreviewUrl, isCloudinaryUrl } from "../../lib/cloudinaryMedia";

const TYPE_ICONS = {
  link: Link2,
  image: ImageIcon,
  video: Video,
  document: FileText,
};

function categoryLabel(id) {
  return RESOURCE_CATEGORIES.find((c) => c.id === id)?.label || id;
}

function typeLabel(id) {
  return RESOURCE_TYPES.find((t) => t.id === id)?.label || id;
}

function ResourceCard({ resource, onOpen }) {
  const TypeIcon = TYPE_ICONS[resource.resourceType] || FileText;
  const previewUrl = getResourcePreviewUrl(resource);

  return (
    <article className="group rounded-2xl border border-white/10 bg-white/[0.05] overflow-hidden hover:border-red-500/30 hover:bg-white/[0.08] transition-all duration-300">
      <div className="relative aspect-[16/10] bg-black/40 overflow-hidden">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={resource.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized={isCloudinaryUrl(previewUrl)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/30">
            <TypeIcon className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white/90 backdrop-blur-sm">
            {categoryLabel(resource.category)}
          </span>
          <span className="rounded-full bg-red-600/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white backdrop-blur-sm">
            {typeLabel(resource.resourceType)}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{resource.title}</h3>
        {resource.description && (
          <p className="text-sm text-white/65 leading-relaxed mb-4 line-clamp-3">{resource.description}</p>
        )}

        {resource.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {resource.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => onOpen(resource)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          {resource.resourceType === "link" ? "Open link" : "View resource"}
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}

function ResourcesContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [viewer, setViewer] = useState(null);

  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await resourcesService.list({
        q: search || undefined,
        category: category || undefined,
        resourceType: resourceType || undefined,
        limit: 100,
      });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, [search, category, resourceType]);

  useEffect(() => {
    const timer = setTimeout(loadResources, 250);
    return () => clearTimeout(timer);
  }, [loadResources]);

  const handleOpen = (resource) => {
    const url = getResourceOpenUrl(resource);
    if (!url) return;
    if (resource.resourceType === "link") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    setViewer(resource);
  };

  const filteredCount = useMemo(() => items.length, [items]);

  return (
    <div className="min-h-screen bg-[#070b12] text-white">
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <p className="text-red-400 text-sm font-medium uppercase tracking-wider mb-2">Member library</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Lab Resources</h1>
          <p className="text-white/70 max-w-2xl">
            Shared robotics materials for signed-in members — drone guides, motor specs, reference links,
            photos, and Cloudinary-hosted videos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drones, motors, guides..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/45 focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            <option value="">All categories</option>
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id} className="bg-gray-900">
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            <option value="">All types</option>
            {RESOURCE_TYPES.map((t) => (
              <option key={t.id} value={t.id} className="bg-gray-900">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-white/60 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading resources...
          </div>
        ) : filteredCount === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
            <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No resources yet</h2>
            <p className="text-white/60 max-w-md mx-auto">
              Check back soon — admins will publish shared lab materials from the admin panel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((resource) => (
              <ResourceCard key={resource._id} resource={resource} onOpen={handleOpen} />
            ))}
          </div>
        )}
      </div>

      {viewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setViewer(null)}>
          <div
            className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0b1018] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h3 className="font-bold text-lg">{viewer.title}</h3>
                <p className="text-sm text-white/50">
                  {categoryLabel(viewer.category)} · {typeLabel(viewer.resourceType)}
                </p>
              </div>
              <button type="button" onClick={() => setViewer(null)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {viewer.resourceType === "video" && viewer.fileUrl && (
                <video src={viewer.fileUrl} controls className="w-full max-h-[60vh] rounded-xl bg-black" />
              )}
              {viewer.resourceType === "image" && viewer.fileUrl && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
                  <Image
                    src={getResourcePreviewUrl(viewer) || viewer.fileUrl}
                    alt={viewer.title}
                    fill
                    className="object-contain"
                    unoptimized={isCloudinaryUrl(viewer.fileUrl)}
                  />
                </div>
              )}
              {(viewer.resourceType === "document" || viewer.resourceType === "link") && (
                <a
                  href={getResourceOpenUrl(viewer)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-3 font-semibold"
                >
                  Open in new tab
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {viewer.description && <p className="mt-4 text-white/70 leading-relaxed">{viewer.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <ProtectedRoute>
      <ResourcesContent />
    </ProtectedRoute>
  );
}
