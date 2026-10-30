"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Play, 
  FileText,
  Music,
  Image as ImageIcon,
  Video,
  Star,
  Calendar,
  Eye,
  Tag,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import mediaService, { canViewLabOnlyMedia, resolveGalleryViewer } from "../../lib/media";
import { CardSkeletonGrid, FilterBarSkeleton } from "@/components/PageSkeletons";
import { useAuth } from "../../contexts/AuthContext";

// Video Player Component that handles play/pause based on hover
const VideoPlayer = ({ src, isPlaying, itemId }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(err => console.log('Video play error:', err));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <video
      ref={videoRef}
      src={src}
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
        isPlaying ? 'opacity-100 z-10' : 'opacity-0 z-0'
      }`}
      muted
      loop
      playsInline
    />
  );
};

export default function GalleryClient() {
  const searchParams = useSearchParams();
  const initialCategoryFromUrl = searchParams?.get('categoryId') || 'all';
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const viewerCanViewLabOnly =
    canViewLabOnlyMedia(user) || resolveGalleryViewer().canViewLabOnly;
  const [mediaItems, setMediaItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null);
  const [loadedVideos, setLoadedVideos] = useState(new Set());
  const [playingVideos, setPlayingVideos] = useState(new Set());
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryFromUrl);
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [isClearing, setIsClearing] = useState(false);
  
  // Pagination
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    skip: 0,
    hasMore: false
  });

  // Fetch categories/collections once on mount
  useEffect(() => {
    fetchCategoriesAndCollections();
  }, []);

  // If URL query changes later (client nav), update category filter
  useEffect(() => {
    if (isClearing) return; // ignore URL sync while clearing
    const categoryIdFromUrl = searchParams?.get('categoryId');
    if (categoryIdFromUrl && categoryIdFromUrl !== selectedCategory) {
      setSelectedCategory(categoryIdFromUrl);
    }
  }, [searchParams, selectedCategory, isClearing]);

  // Fetch media after auth is ready so lab-only items work for signed-in staff
  useEffect(() => {
    if (authLoading) return;
    fetchFilteredMedia();
  }, [
    authLoading,
    searchQuery,
    selectedFileType,
    selectedCategory,
    selectedCollection,
    showFeaturedOnly,
    isAuthenticated,
    user?.role,
  ]);

  const fetchCategoriesAndCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesData, collectionsData] = await Promise.all([
        mediaService.listCategories(),
        mediaService.listCollections()
      ]);

      setCategories(categoriesData);
      setCollections(collectionsData);
    } catch (err) {
      console.error('Error fetching gallery metadata:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredMedia = async () => {
    try {
      const params = {
        limit: 50,
        skip: 0
      };

      if (searchQuery) params.q = searchQuery;
      if (selectedFileType !== "all") params.fileType = selectedFileType;
      if (selectedCategory !== "all") params.categoryId = selectedCategory;
      if (showFeaturedOnly) params.isFeatured = true;

      console.log('[Gallery] listMedia params', params);
      const result = await mediaService.listMedia(params);
      console.log('[Gallery] listMedia result', result);
      let items = result.items || [];
      // Safety: enforce filters client-side in case backend ignores them
      if (selectedCategory !== 'all') {
        const selectedCatName = (categories.find(c => String(c._id) === String(selectedCategory))?.name || '').toLowerCase();
        items = items.filter(it => {
          const raw = it.categoryId ?? it.category ?? it.category_id;
          const cid = (raw && (raw._id || raw.id)) || (typeof raw === 'string' ? raw : null);
          const cname = (it.categoryName || it.category_label || it.category?.name || '').toLowerCase();
          if (cid) {
            return String(cid) === String(selectedCategory);
          }
          if (selectedCatName && cname) {
            return cname === selectedCatName;
          }
          return false;
        });
      }
      if (selectedFileType !== 'all') {
        items = items.filter(it => (it.fileType || '').toLowerCase() === selectedFileType.toLowerCase());
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        items = items.filter(it => {
          const title = (it.title || '').toLowerCase();
          const desc = (it.description || '').toLowerCase();
          const tags = Array.isArray(it.tags) ? it.tags.map(t => String(t).toLowerCase()) : [];
          return title.includes(q) || desc.includes(q) || tags.some(t => t.includes(q));
        });
      }
      if (showFeaturedOnly) {
        items = items.filter(it => it.isFeatured === true);
      }
      // Only hide lab-only media for guests / students once auth state is known
      const canViewLabOnly = viewerCanViewLabOnly;
      if (!authLoading && !canViewLabOnly) {
        items = items.filter(it => !it.labMembersOnly);
      }
      setMediaItems(items);
      const serverPagination = result.pagination || {};
      const effectiveTotal = (showFeaturedOnly || selectedCategory !== 'all' || selectedFileType !== 'all' || searchQuery)
        ? items.length
        : (serverPagination.total ?? items.length);
      setPagination({ ...serverPagination, total: effectiveTotal });
    } catch (err) {
      console.error('Error fetching filtered media:', err);
      setError(err.message);
    }
  };

  const clearFilters = () => {
    setIsClearing(true);
    setSearchQuery("");
    setSelectedFileType("all");
    setSelectedCategory("all");
    setSelectedCollection("all");
    setShowFeaturedOnly(false);
    // Clear query params in URL so effect doesn't re-apply categoryId
    try {
      router.replace('/Gallery', { scroll: false });
    } catch {}
    // allow state update cycle to complete, then re-enable URL sync
    setTimeout(() => setIsClearing(false), 0);
  };

  const hasActiveFilters = searchQuery || selectedFileType !== "all" || selectedCategory !== "all" || selectedCollection !== "all" || showFeaturedOnly;

  // Function to handle video loading
  const handleVideoLoad = (itemId) => {
    setLoadedVideos(prev => new Set([...prev, itemId]));
  };

  // Function to check if video is loaded
  const isVideoLoaded = (itemId) => {
    return loadedVideos.has(itemId);
  };

  // Function to handle video hover (start playing)
  const handleVideoHover = (itemId) => {
    setPlayingVideos(prev => new Set([...prev, itemId]));
    if (!isVideoLoaded(itemId)) {
      handleVideoLoad(itemId);
    }
  };

  // Function to handle video unhover (pause playing)
  const handleVideoUnhover = (itemId) => {
    setPlayingVideos(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  // Function to check if video is playing
  const isVideoPlaying = (itemId) => {
    return playingVideos.has(itemId);
  };

  // Function to handle media view tracking
  const handleMediaView = async (item) => {
    try {
      // Increment view count when media is opened
      await mediaService.incrementViewCount(item._id);
      
      // Update local state to reflect new view count
      setMediaItems(prevItems => 
        prevItems.map(mediaItem => 
          mediaItem._id === item._id 
            ? { ...mediaItem, viewCount: (mediaItem.viewCount || 0) + 1 }
            : mediaItem
        )
      );
    } catch (error) {
      console.error('Error tracking media view:', error);
      // Don't show error to user, just log it
    }
  };

  const navigateLightbox = (direction) => {
    if (!active || mediaItems.length <= 1) return;
    const currentIndex = mediaItems.findIndex((item) => item._id === active._id);
    if (currentIndex === -1) return;
    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % mediaItems.length
        : (currentIndex - 1 + mediaItems.length) % mediaItems.length;
    const nextItem = mediaItems[nextIndex];
    setActive(nextItem);
    handleMediaView(nextItem);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateLightbox("prev");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateLightbox("next");
      } else if (e.key === "Escape") {
        setActive(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, mediaItems]);

  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  const activeIndex = active
    ? mediaItems.findIndex((item) => item._id === active._id)
    : -1;

  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Fallback images like on the Project page
  const fallbackImages = [
    "/servilancerobot.jpeg",
    "/humanoidRobotHealthcare.webp",
    "/bgImageforroboticslab.jpg"
  ];
  const getFallbackImage = (index = 0) => fallbackImages[index % fallbackImages.length];

  // Normalize remote image URLs (e.g., Cloudinary) to web-friendly formats
  const isCloudinaryUrl = (url) => typeof url === 'string' && /https?:\/\/res\.cloudinary\.com\//.test(url);

  const sanitizeCloudinaryExtension = (url) => {
    if (!url) return url;
    // Replace problematic TIFF extension with jpg to ensure browser display
    return url.replace(/\.(tif|tiff)(\?|#|$)/i, '.jpg$2');
  };

  const transformCloudinaryUrl = (url, { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = {}) => {
    if (!isCloudinaryUrl(url)) return url;
    const safeUrl = sanitizeCloudinaryExtension(url);
    const transforms = [
      `f_${format}`,
      `q_${quality}`,
      (width || height) ? `c_${crop}` : null,
      width ? `w_${width}` : null,
      height ? `h_${height}` : null,
    ].filter(Boolean).join(',');
    // Inject transforms right after /image/upload/
    return safeUrl.replace('/image/upload/', `/image/upload/${transforms}/`);
  };

  // Robust URL resolution to support different backend shapes (Cloudinary, etc.)
  const getPrimaryUrl = (item) => {
    const url = (
      item?.fileUrl ||
      item?.secure_url ||
      item?.url ||
      item?.sourceUrl ||
      ''
    );
    const normalized = transformCloudinaryUrl(url, {});
    return normalized || getFallbackImage(0);
  };

  const getThumbnailUrl = (item) => {
    const url = (
      item?.thumbnailUrl ||
      item?.thumbnail ||
      item?.previewUrl ||
      getPrimaryUrl(item)
    );
    const normalized = transformCloudinaryUrl(url, { width: 600, height: 600, crop: 'fill' });
    return normalized || getFallbackImage(1);
  };

  const getFileTypeColor = (fileType) => {
    switch (fileType) {
      case 'image': return 'text-blue-400';
      case 'video': return 'text-green-400';
      case 'audio': return 'text-purple-400';
      case 'document': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="text-center mb-10 sm:mb-12">
            <p className="nb-page-eyebrow justify-center">NEWTONBOTICS / ARCHIVE</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-600">
              Our Gallery
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Unfiltered moments from our builds, events, and club fun.
            </p>
          </div>
          <FilterBarSkeleton fields={4} />
          <CardSkeletonGrid
            count={10}
            variant="gallery"
            cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            gap="gap-4"
          />
        </div>
      </div>
    );
  }

  if (error && mediaItems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-6 py-16 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Gallery</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button 
            onClick={fetchMediaData}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <p className="nb-page-eyebrow justify-center">NEWTONBOTICS / ARCHIVE</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-600">
            Our Gallery
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Unfiltered moments from our builds, events, and club fun.
          </p>
        </div>

      {/* Filters and Search */}
      <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-8">
          <h3 className="text-xl font-bold mb-4 text-white">Filters & Search</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-blur-lg"
              />
            </div>

            {/* File Type Filter */}
            <div className="relative">
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="document">Documents</option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 pointer-events-none" />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 pointer-events-none" />
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center justify-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFeaturedOnly}
                  onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                  className="w-4 h-4 text-red-500 bg-white/10 border-white/20 rounded focus:ring-red-500 focus:ring-2"
                />
                <span className="text-white/80">Featured Only</span>
              </label>
              
              {/* View Mode Toggle */}
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${viewMode === "grid" ? "bg-red-500 text-white" : "text-white/60 hover:text-white"}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${viewMode === "list" ? "bg-red-500 text-white" : "text-white/60 hover:text-white"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters ? (
            <div className="flex justify-between items-center">
              <button
                onClick={clearFilters}
                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
              >
                Clear All Filters
              </button>
              <span className="text-white/60 text-sm">
                Showing {mediaItems.length} items
              </span>
            </div>
          ) : (
            <div className="flex justify-end items-center">
              <span className="text-white/60 text-sm">
                Showing {mediaItems.length} of {pagination.total} items
              </span>
            </div>
          )}
      </section>

      {/* Media Grid/List */}
      <main className="pb-24">
        {mediaItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-bold text-white mb-2">No media found</h3>
            <p className="text-white/60">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search terms.' 
                : 'No media items are currently available.'
              }
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {mediaItems.map((item, index) => (
              <motion.button
                key={item._id}
                onClick={() => {
                  setActive(item);
                  handleMediaView(item);
                }}
                onMouseEnter={() => {
                  if (item.fileType === "video") {
                    handleVideoHover(item._id);
                  }
                }}
                onMouseLeave={() => {
                  if (item.fileType === "video") {
                    handleVideoUnhover(item._id);
                  }
                }}
                className="nb-item-card relative group bg-white/5 border border-white/10 overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500 aspect-square"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative w-full h-full">
                  {item.fileType === "image" ? (
                    <img
                      src={getThumbnailUrl(item)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = getFallbackImage(0);
                      }}
                    />
                  ) : item.fileType === "video" ? (
                    <div className="relative w-full h-full bg-gray-800 overflow-hidden">
                      {/* Thumbnail - shown when video is not playing */}
                      <img
                        src={getThumbnailUrl(item)}
                        alt={item.title}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          isVideoPlaying(item._id) ? 'opacity-0' : 'opacity-100'
                        }`}
                        onError={(e) => {
                          e.target.src = getFallbackImage(1);
                        }}
                      />
                      
                      {/* Video overlay with play button - shown when not playing */}
                      {!isVideoPlaying(item._id) && (
                        <div className="absolute inset-0 nb-media-play-overlay flex items-center justify-center">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                      )}
                      
                      {/* Video element - shown when loaded and playing */}
                      {isVideoLoaded(item._id) && (
                        <VideoPlayer
                          src={getPrimaryUrl(item)}
                          isPlaying={isVideoPlaying(item._id)}
                          itemId={item._id}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      {getFileTypeIcon(item.fileType)}
                    </div>
                  )}
                  
                  {/* File Type Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="p-1.5 rounded-full nb-media-badge flex items-center" title={item.fileType}>
                      {getFileTypeIcon(item.fileType)}
                    </span>
                  </div>
                  
                  {/* Featured Badge */}
                  {item.isFeatured && (
                    <div className="absolute top-2 right-2" title="Featured">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow" />
                    </div>
                  )}
                  
                  {/* Overlay Info */}
                  <div className="absolute inset-0 nb-hover-overlay flex items-end">
                    <div className="p-3 w-full transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="nb-hover-overlay-text text-sm font-semibold truncate">{item.title}</h3>
                      <div className="nb-hover-overlay-muted flex items-center gap-2 text-xs mt-1">
                        <Eye className="w-3 h-3" />
                        {item.viewCount || 0}
                        {item.duration && (
                          <>
                            <span>•</span>
                            <span>{mediaService.formatDuration(item.duration)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {mediaItems.map((item, index) => (
              <motion.div
                key={item._id}
                className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => {
                  setActive(item);
                  handleMediaView(item);
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                    {item.fileType === "image" ? (
                      <img
                      src={getThumbnailUrl(item)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : item.fileType === "video" ? (
                      <div className="relative w-full h-full">
                        {/* Show thumbnail for videos */}
                        <img
                          src={getThumbnailUrl(item)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Play button overlay */}
                        <div className="absolute inset-0 nb-media-play-overlay flex items-center justify-center">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getFileTypeIcon(item.fileType)}
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white truncate">{item.title}</h3>
                      {item.isFeatured && (
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 shrink-0" title="Featured" />
                      )}
                    </div>
                    <p className="text-white/70 text-sm mb-2 line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span className={`${getFileTypeColor(item.fileType)}`} title={item.fileType}>
                        {getFileTypeIcon(item.fileType)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.viewCount || 0}
                      </span>
                      {item.duration && (
                        <span>{mediaService.formatDuration(item.duration)}</span>
                      )}
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/80">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="nb-gallery-lightbox flex flex-col cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            {/* Stage — below site navbar; no duplicate lightbox header */}
            <div
              className="relative flex flex-1 flex-col min-h-0 px-2 pt-3 pb-2 sm:px-8 sm:pt-5 sm:pb-6"
            >
              {/* Mobile toolbar */}
              <div
                className="nb-lightbox-toolbar flex sm:hidden items-center justify-between gap-3 pt-1 pb-2 cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {mediaItems.length > 1 && activeIndex >= 0 ? (
                  <p
                    className="nb-lightbox-counter text-xs font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/50 border border-white/15"
                    aria-live="polite"
                  >
                    {activeIndex + 1} / {mediaItems.length}
                  </p>
                ) : (
                  <span className="text-xs font-medium uppercase tracking-wider text-white/50 px-1">
                    Gallery
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="nb-lightbox-close flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
                  aria-label="Close gallery view"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Desktop close + counter */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(null);
                }}
                className="nb-lightbox-close absolute top-5 right-3 md:top-6 md:right-6 z-40 hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors"
                aria-label="Close gallery view"
              >
                <X className="h-5 w-5" />
              </button>
              {mediaItems.length > 1 && activeIndex >= 0 && (
                <p
                  className="nb-lightbox-counter absolute top-5 left-3 md:top-6 md:left-6 z-40 hidden sm:block text-xs font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/50 border border-white/15"
                  aria-live="polite"
                >
                  {activeIndex + 1} / {mediaItems.length}
                </p>
              )}

              <div className="relative flex flex-1 min-h-0 items-stretch justify-center">
              {mediaItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateLightbox("prev");
                    }}
                    className="nb-lightbox-nav nb-lightbox-nav--edge absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-30 flex"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateLightbox("next");
                    }}
                    className="nb-lightbox-nav nb-lightbox-nav--edge absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-30 flex"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </>
              )}

              <motion.div
                key={active._id}
                className="nb-lightbox-frame relative w-full max-w-6xl flex flex-col flex-1 min-h-0 max-h-full cursor-default"
                initial={{ scale: 0.96, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 8 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="nb-lightbox-media-stage relative flex flex-1 items-center justify-center bg-black/50 min-h-[min(36vh,240px)] sm:min-h-[min(50vh,320px)] max-h-[calc(100dvh-var(--nb-nav-height)-10rem)] sm:max-h-[calc(100vh-var(--nb-nav-height)-5rem)] cursor-pointer"
                  onClick={() => setActive(null)}
                >
                  {active.fileType === "image" ? (
                    <img
                      src={getPrimaryUrl(active)}
                      alt={active.title}
                      className="max-h-full max-w-full w-auto h-auto object-contain cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : active.fileType === "video" ? (
                    <div
                      className="relative w-full aspect-video max-h-full cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <video
                        src={getPrimaryUrl(active)}
                        className="absolute inset-0 w-full h-full object-contain bg-black"
                        controls
                        autoPlay
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                      {getFileTypeIcon(active.fileType)}
                      <p className="nb-lightbox-muted mt-3 text-sm">Preview not available</p>
                    </div>
                  )}

                  {/* Desktop caption overlay on media */}
                  <div
                    className="nb-lightbox-caption absolute inset-x-0 bottom-0 pointer-events-none hidden sm:block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-end justify-between gap-3 p-4 md:p-5 pointer-events-auto">
                      <div className="min-w-0 pointer-events-auto">
                        <h3 className="nb-lightbox-heading text-lg md:text-xl font-bold font-display leading-tight truncate">
                          {active.title}
                        </h3>
                        <div className="nb-lightbox-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm mt-1.5">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {active.viewCount || 0} views
                          </span>
                          {active.duration && (
                            <span>{mediaService.formatDuration(active.duration)}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(active.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pointer-events-auto">
                        {active.isFeatured && (
                          <Star
                            className="w-5 h-5 text-yellow-400 fill-yellow-400"
                            title="Featured"
                          />
                        )}
                        <span
                          className={`p-1.5 rounded-full ${getFileTypeColor(active.fileType)}`}
                          title={active.fileType}
                        >
                          {getFileTypeIcon(active.fileType)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile meta panel — below image, not overlapping */}
                <div
                  className="nb-lightbox-caption-panel sm:hidden shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="nb-lightbox-heading text-base font-bold font-display leading-snug">
                        {active.title}
                      </h3>
                      <div className="nb-lightbox-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1.5">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {active.viewCount || 0} views
                        </span>
                        {active.duration && (
                          <span>{mediaService.formatDuration(active.duration)}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(active.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {active.isFeatured && (
                        <Star
                          className="w-4 h-4 text-yellow-400 fill-yellow-400"
                          title="Featured"
                        />
                      )}
                      <span
                        className={`p-1 rounded-full ${getFileTypeColor(active.fileType)}`}
                        title={active.fileType}
                      >
                        {getFileTypeIcon(active.fileType)}
                      </span>
                    </div>
                  </div>
                </div>

                {(active.description || (active.tags && active.tags.length > 0)) && (
                  <div
                    className="nb-lightbox-footer nb-lightbox-footer-scroll px-3 py-2.5 sm:px-5 sm:py-4 space-y-2 sm:space-y-3 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {active.description && (
                      <p className="nb-lightbox-muted text-sm leading-relaxed">{active.description}</p>
                    )}
                    {active.tags && active.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {active.tags.map((tag, idx) => (
                          <span key={idx} className="nb-lightbox-tag px-2.5 py-1 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 