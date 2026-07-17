"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Box, Layout, Search, Filter, ArrowRight, Users, Calendar, Award } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

const ResearchAreasPage = () => {
  const [researchAreas, setResearchAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  // Fetch all research areas
  useEffect(() => {
    const fetchResearchAreas = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/research-areas?isActive=true&limit=100`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch research areas');
        const data = await res.json();
        if (data.success) {
          setResearchAreas(data.data.items || []);
        }
      } catch (error) {
        console.error('Error fetching research areas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResearchAreas();
  }, [API_BASE_URL]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/research-areas/categories`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setCategories(data.data.categories || []);
            console.log('Categories fetched:', data.data.categories);
          } else {
            console.error('Failed to fetch categories:', data.message);
          }
        } else {
          console.error('Categories API error:', res.status);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [API_BASE_URL]);

  // Filter research areas based on search and category
  const filteredResearchAreas = researchAreas.filter(area => {
    const matchesSearch = area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         area.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (area.keywords && area.keywords.some(keyword => 
                           keyword.toLowerCase().includes(searchQuery.toLowerCase())
                         ));
    
    const matchesCategory = selectedCategory === "all" || area.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'AI/ML':
        return <Brain className="w-8 h-8 text-white" />;
      case 'Mechanics':
        return <Box className="w-8 h-8 text-white" />;
      default:
        return <Layout className="w-8 h-8 text-white" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading research areas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-black border-b border-white/10">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-red-400 to-white">
              Research Areas
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Explore our comprehensive research areas in robotics, AI, and automation. 
              Discover cutting-edge projects and collaboration opportunities.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Filters & Search</h2>
            <div className="flex items-center gap-2 text-white/60">
              <Filter className="w-5 h-5" />
              <span className="text-sm">Filter Options</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-white/60 w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search research areas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="text-white/60 w-5 h-5" />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))
                ) : (
                  <>
                    <option value="AI/ML">AI/ML</option>
                    <option value="Mechanics">Mechanics</option>
                    <option value="Robotics">Robotics</option>
                  </>
                )}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-white/40 mt-1">Using default categories</p>
              )}
            </div>
          </div>

          {/* Results Count and Clear Filters */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <p className="text-white/60">
              Showing {filteredResearchAreas.length} of {researchAreas.length} research areas
            </p>
            {(searchQuery || selectedCategory !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </motion.div>

        {/* Research Areas Grid */}
        {filteredResearchAreas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResearchAreas.map((area, index) => (
              <motion.div
                key={area._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-red-500/20 transition-all group cursor-pointer"
              >
                <Link href={`/research-areas/${area._id}`}>
                  <div className="space-y-4">
                    {/* Icon and Category */}
                    <div className="flex items-center justify-between">
                      <div className="bg-gradient-to-br from-white/10 to-red-500/10 p-3 rounded-xl">
                        {getCategoryIcon(area.category)}
                      </div>
                      <span className="text-sm text-white/60 bg-white/10 px-3 py-1 rounded-full">
                        {area.category}
                      </span>
                    </div>

                    {/* Title and Description */}
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                        {area.name}
                      </h3>
                      <p className="text-white/80 text-sm leading-relaxed line-clamp-3">
                        {area.description}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                      {/* <div className="text-center">
                        <div className="text-lg font-bold text-red-400">{area.projectCount || 0}</div>
                        <div className="text-xs text-white/60">Projects</div>
                      </div> */}
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-400">{area.publicationCount || 0}</div>
                        <div className="text-xs text-white/60">Publications</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-400">{area.memberCount || 0}</div>
                        <div className="text-xs text-white/60">Members</div>
                      </div>
                    </div>

                    {/* Keywords */}
                    {area.keywords && area.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {area.keywords.slice(0, 3).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-white/10 text-white/60 rounded-full text-xs"
                          >
                            {keyword}
                          </span>
                        ))}
                        {area.keywords.length > 3 && (
                          <span className="px-2 py-1 bg-white/10 text-white/60 rounded-full text-xs">
                            +{area.keywords.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* View Details Button */}
                    <div className="flex items-center justify-between pt-4">
                      <span className="text-red-400 text-sm font-medium group-hover:text-red-300 transition-colors">
                        View Details
                      </span>
                      <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-red-500 text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2">No Research Areas Found</h3>
            <p className="text-white/60 mb-6">
              Try adjusting your search terms or category filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ResearchAreasPage;
