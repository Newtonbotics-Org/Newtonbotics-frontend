"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  User, 
  Clock, 
  Search, 
  Filter, 
  ArrowRight, 
  Tag,
  BookOpen,
  TrendingUp
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import newsService from "../../lib/news";
import { subscribeToNewsletter } from "../../lib/newsletter";

const NewsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [allNews, setAllNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [categories, setCategories] = useState([]); // [{id,name}]
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  
  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterFirstName, setNewsletterFirstName] = useState("");
  const [newsletterLastName, setNewsletterLastName] = useState("");
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterMessageType, setNewsletterMessageType] = useState(""); // "success" or "error"
  const [newsletterStep, setNewsletterStep] = useState(1); // 1: email, 2: name, 3: success

  // Initial fetch from public API
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError("");
        
        // Fetch news first
        let items = [];
        try {
          const res = await newsService.listNews({ isPublished: true, limit: 50, skip: 0 });
          items = res?.items || [];
          if (isMounted) {
            setAllNews(items);
            setFilteredNews(items);
          }
        } catch (e) {
          console.error('Error loading news:', e);
          if (isMounted) {
            setError(e.message || "Failed to load news");
            // Set empty arrays to prevent further errors
            setAllNews([]);
            setFilteredNews([]);
          }
        }
        
        // Fetch categories separately; do not block the news list if this fails
        try {
          const cats = await newsService.listCategories();
          if (isMounted) {
            setCategories([{ id: "All", name: "All" }, ...cats.map((c) => ({ id: c._id || c.id, name: c.name }))]);
          }
        } catch (catError) {
          console.error('Error loading categories:', catError);
          if (isMounted) {
            // Ignore category error if news loaded; keep default "All"
            setCategories([{ id: "All", name: "All" }]);
            if (items.length > 0) {
              setError(""); // Clear error if news loaded successfully
            }
          }
        }
      } catch (e) {
        if (!isMounted) return;
        console.error('General error:', e);
        setError(e.message || "Failed to load news");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // Filter news based on category and search query
  useEffect(() => {
    let filtered = allNews;
    
    // Filter by category id (news.categoryId)
    if (selectedCategory !== "All") {
      filtered = filtered.filter(news => (news.categoryId || news.category?._id || "") === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(news => {
        const title = (news.title || '').toLowerCase();
        const excerpt = (news.excerpt || '').toLowerCase();
        const content = (news.content || '').toLowerCase();
        const tags = (news.tags || []).map(t => String(t).toLowerCase());
        return title.includes(q) || excerpt.includes(q) || content.includes(q) || tags.some(t => t.includes(q));
      });
    }

    // Filter by featured only
    if (showFeaturedOnly) {
      filtered = filtered.filter(news => news.isFeatured);
    }
    
    setFilteredNews(filtered);
  }, [selectedCategory, searchQuery, allNews, showFeaturedOnly]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Achievement': 'bg-green-500/80',
      'Workshop': 'bg-blue-500/80',
      'Project Update': 'bg-purple-500/80',
      'Partnership': 'bg-orange-500/80',
      'Event': 'bg-pink-500/80',
      'Publication': 'bg-indigo-500/80',
      'Announcement': 'bg-red-500/80'
    };
    return colors[category] || 'bg-gray-500/80';
  };

  const getCategoryName = (news) => {
    return news.category?.name || news.categoryId || 'News';
  };

  const getImageUrl = (news) => {
    return news.featuredImageUrl || news.image || "/white logo.png";
  };

  const getReadTime = (news) => {
    return news.readTime || '5 min read';
  };

  const getAuthor = (news) => {
    return news.author || 'NewtonBotics Team';
  };

  const clearFilters = () => {
    setSelectedCategory("All");
    setSearchQuery("");
    setShowFeaturedOnly(false);
  };

  const hasActiveFilters = selectedCategory !== "All" || searchQuery || showFeaturedOnly;

  // Newsletter step handlers
  const handleEmailContinue = (e) => {
    e.preventDefault();
    
    if (!newsletterEmail.trim()) {
      setNewsletterMessage("Please enter your email address");
      setNewsletterMessageType("error");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail.trim())) {
      setNewsletterMessage("Please enter a valid email address");
      setNewsletterMessageType("error");
      return;
    }

    setNewsletterMessage("");
    setNewsletterStep(2);
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    setIsNewsletterSubmitting(true);
    setNewsletterMessage("");

    try {
      const subscriptionData = {
        email: newsletterEmail.trim(),
        ...(newsletterFirstName.trim() && { firstName: newsletterFirstName.trim() }),
        ...(newsletterLastName.trim() && { lastName: newsletterLastName.trim() })
      };

      await subscribeToNewsletter(subscriptionData);
      setNewsletterStep(3);
      setNewsletterMessage("Successfully subscribed to our newsletter!");
      setNewsletterMessageType("success");
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setNewsletterEmail("");
        setNewsletterFirstName("");
        setNewsletterLastName("");
        setNewsletterStep(1);
        setNewsletterMessage("");
      }, 3000);
    } catch (error) {
      setNewsletterMessage(error.message || "Failed to subscribe. Please try again.");
      setNewsletterMessageType("error");
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };

  const handleBackToEmail = () => {
    setNewsletterStep(1);
    setNewsletterMessage("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto mb-8"></div>
          <h2 className="text-2xl font-bold text-white">Loading Latest News...</h2>
        </div>
      </div>
    );
  }

  if (error && allNews.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading News</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mb-12 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-600">
          Latest News & Updates
        </h1>
        <p className="text-lg text-white/80 max-w-3xl mx-auto">
          Stay informed about our latest achievements, events, workshops, and groundbreaking projects in robotics and technology.
        </p>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-4 text-white">Filters & Search</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-blur-lg"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none cursor-pointer"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 pointer-events-none" />
            </div>

            {/* Featured Filter */}
            <div className="flex items-center justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFeaturedOnly}
                  onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                  className="w-4 h-4 text-red-500 bg-white/10 border-white/20 rounded focus:ring-red-500 focus:ring-2"
                />
                <span className="text-white/80">Featured Only</span>
              </label>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
          
          {/* Results count */}
          <div className="mt-4 text-center text-white/60">
            Showing {filteredNews.length} of {allNews.length} articles
          </div>
        </div>
      </motion.div>

      {/* News Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mb-12"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 text-center">
            <div className="text-2xl font-bold text-red-400">{filteredNews?.length || 0}</div>
            <div className="text-sm text-white/60">Total Articles</div>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 text-center">
            <div className="text-2xl font-bold text-red-400">
              {filteredNews?.filter(news => news.isFeatured).length || 0}
            </div>
            <div className="text-sm text-white/60">Featured</div>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 text-center">
            <div className="text-2xl font-bold text-red-400">
              {new Set(filteredNews?.map(news => getCategoryName(news))).size || 0}
            </div>
            <div className="text-sm text-white/60">Categories</div>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 text-center">
            <div className="text-2xl font-bold text-red-400">
              {filteredNews?.filter(news => 
                new Date(news.publishedAt || news.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ).length || 0}
            </div>
            <div className="text-sm text-white/60">This Month</div>
          </div>
        </div>
      </motion.div>

      {/* Featured News Section */}
      {filteredNews.filter(news => news.isFeatured).length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 flex items-center font-display">
            <TrendingUp className="mr-3 text-red-500" /> Featured Stories
          </h2>
          <div className="grid lg:grid-cols-2 gap-8">
            {filteredNews.filter(news => news.isFeatured).slice(0, 2).map((news, index) => (
              <motion.div
                key={news._id || news.id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-red-500/10 group hover:bg-white/10 transition-all"
              >
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={getImageUrl(news)}
                    alt={news.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(getCategoryName(news))} text-white`}>
                      {getCategoryName(news)}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-lg">
                      {getReadTime(news)}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(news.publishedAt || news.createdAt)}</span>
                    <span>•</span>
                    <User className="w-4 h-4" />
                    <span>{getAuthor(news)}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-red-400 transition-colors">
                    {news.title}
                  </h3>
                  <p className="text-white/80 mb-4 leading-relaxed">
                    {news.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(news.tags || []).slice(0, 3).map((tag, tagIndex) => (
                      <span key={tagIndex} className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/80">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link href={`/News/${news._id || news.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 rounded-lg font-semibold text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all flex items-center gap-2 group"
                    >
                      Read Full Article
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto text-center py-8 text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* All News Grid */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto"
      >
        <h2 className="text-3xl font-bold mb-8 flex items-center font-display">
          <BookOpen className="mr-3 text-red-500" /> All News
        </h2>
        
        {filteredNews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-xl font-bold text-white mb-2">No news found</h3>
            <p className="text-white/60">
              {searchQuery || selectedCategory !== "All" || showFeaturedOnly
                ? "Try adjusting your search or filter criteria."
                : "No news articles are currently available."
              }
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((news, index) => (
              <motion.div
                key={news._id || news.id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/5 backdrop-blur-lg rounded-xl overflow-hidden border border-white/10 shadow-lg shadow-red-500/10 group hover:bg-white/10 transition-all"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={getImageUrl(news)}
                    alt={news.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(getCategoryName(news))} text-white`}>
                      {getCategoryName(news)}
                    </span>
                  </div>
                  {news.isFeatured && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/80 text-white">
                        Featured
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(news.publishedAt || news.createdAt)}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{getReadTime(news)}</span>
                  </div>
                  <h4 className="text-lg font-bold mb-2 text-white group-hover:text-red-400 transition-colors line-clamp-2">
                    {news.title}
                  </h4>
                  <p className="text-white/80 text-sm mb-3 line-clamp-3">
                    {news.excerpt || ''}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(news.tags || []).slice(0, 2).map((tag, tagIndex) => (
                      <span key={tagIndex} className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/80">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {getAuthor(news)}
                    </span>
                    <Link href={`/News/${news._id || news.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        Read More
                        <ArrowRight className="w-3 h-3" />
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Enhanced Newsletter Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mt-16 relative overflow-hidden"
      >
        {/* Subtle Red Texture Background */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/2 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-red-500/2 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5,
            }}
          />
        </div>
        
        <div className="relative z-20">
          <motion.div
            className="bg-white/5 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-center backdrop-blur-xl border border-white/10 shadow-2xl shadow-white/10 relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 sm:top-10 left-4 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-4 sm:bottom-10 right-4 sm:right-10 w-20 h-20 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-24 sm:h-24 bg-red-500/10 rounded-full blur-xl"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-red-400 to-white">
                Stay Connected
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4">
                Join our newsletter to receive updates on breakthrough research,
                upcoming events, and innovations in robotics. Be the first to know about our latest projects!
              </p>
              <div className="max-w-lg mx-auto px-4">
                {/* Step 1: Email Input */}
                {newsletterStep === 1 && (
                  <form onSubmit={handleEmailContinue}>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white placeholder-white/60 backdrop-blur-lg text-sm sm:text-base"
                        required
                      />
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(239, 68, 68, 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2 group text-sm sm:text-base"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </div>
                  </form>
                )}

                {/* Step 2: Name Fields */}
                {newsletterStep === 2 && (
                  <form onSubmit={handleNewsletterSubmit}>
                    <div className="mb-4">
                      <p className="text-white/70 text-sm mb-4">
                        Great! We have your email: <span className="text-red-400 font-medium">{newsletterEmail}</span>
                      </p>
                      <p className="text-white/60 text-sm mb-4">
                        Add your name (optional) to personalize your newsletter experience.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <input
                          type="text"
                          placeholder="First name (optional)"
                          value={newsletterFirstName}
                          onChange={(e) => setNewsletterFirstName(e.target.value)}
                          className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white placeholder-white/60 backdrop-blur-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Last name (optional)"
                          value={newsletterLastName}
                          onChange={(e) => setNewsletterLastName(e.target.value)}
                          className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white placeholder-white/60 backdrop-blur-lg text-sm"
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <motion.button
                          type="button"
                          onClick={handleBackToEmail}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                          ← Back
                        </motion.button>
                        <motion.button
                          type="submit"
                          disabled={isNewsletterSubmitting}
                          whileHover={!isNewsletterSubmitting ? { scale: 1.05, boxShadow: "0 20px 40px rgba(239, 68, 68, 0.3)" } : {}}
                          whileTap={!isNewsletterSubmitting ? { scale: 0.95 } : {}}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 disabled:from-red-800 disabled:to-red-900 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2 group"
                        >
                          {isNewsletterSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              Subscribe
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Step 3: Success Message */}
                {newsletterStep === 3 && (
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-green-400 mb-2">Welcome to our newsletter!</h3>
                      <p className="text-white/80">
                        You're all set! We'll keep you updated with our latest projects and innovations.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Error Message */}
                {newsletterMessage && newsletterMessageType === "error" && (
                  <div className="mb-4 p-3 rounded-lg text-sm bg-red-900/50 text-red-300 border border-red-700/50">
                    {newsletterMessage}
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-white/60 mt-4">
                🔒 We respect your privacy. Unsubscribe at any time.
              </p>
          </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default NewsPage; 