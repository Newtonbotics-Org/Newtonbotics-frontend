"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Rocket,
  CheckCircle,
  Clock,
  Star,
  Search,
  Filter,
  ArrowRight,
  Award,
  Target,
  Zap,
  DollarSign,
  Tag,
  User,
  TrendingUp
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

// Utility functions moved outside component for sharing
const getProjectStatusColor = (status) => {
  switch (status) {
    case 'upcoming':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'ongoing':
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'completed':
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    case 'on_hold':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    default:
      return 'bg-white/10 text-white/80 border-white/20';
  }
};

const getProjectStatusIcon = (status) => {
  switch (status) {
    case 'upcoming':
      return <Rocket className="w-4 h-4" />;
    case 'ongoing':
      return <Clock className="w-4 h-4" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'on_hold':
      return <Target className="w-4 h-4" />;
    default:
      return <TrendingUp className="w-4 h-4" />;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

const calculateProgress = (milestones) => {
  if (!milestones || milestones.length === 0) return 0;
  const completed = milestones.filter(m => m.status === 'completed').length;
  return Math.round((completed / milestones.length) * 100);
};

const getProgressColor = (progress) => {
  if (progress >= 80) return 'from-green-500 to-green-600';
  if (progress >= 60) return 'from-blue-500 to-blue-600';
  if (progress >= 40) return 'from-yellow-500 to-yellow-600';
  return 'from-red-500 to-red-600';
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    skip: 0,
    hasMore: false
  });

  // Project statuses from API specification
  const projectStatuses = ['upcoming', 'ongoing', 'completed', 'on_hold'];

  useEffect(() => {
    fetchProjects();
  }, [selectedStatus, selectedCategory, showFeaturedOnly, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (showFeaturedOnly) params.append('isFeatured', 'true');
      if (searchQuery) params.append('q', searchQuery);
      params.append('limit', '100'); // Get more projects for better filtering
      
      const url = `${API_BASE_URL}/projects?${params.toString()}`;
      console.log('Fetching projects from:', url);
      
      const res = await fetch(url, { cache: 'no-store' });
      console.log('Response status:', res.status);
      
      if (!res.ok) throw new Error('Failed to fetch projects');
      
      const data = await res.json();
      console.log('API Response:', data);
      
      if (data.success) {
        console.log('Projects data:', data.data);
        console.log('Projects items:', data.data.projects);
        console.log('Pagination:', data.data.pagination);
        setProjects(data.data.projects || []);
        setPagination(data.data.pagination || {});
      } else {
        throw new Error(data.message || 'Failed to fetch projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Extract unique categories from projects
      const res = await fetch(`${API_BASE_URL}/projects?limit=100`, { cache: 'no-store' });
      console.log('Categories fetch response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Categories API Response:', data);
        
        if (data.success && data.data.projects) {
          const uniqueCategories = [...new Set(data.data.projects.map(project => project.category).filter(Boolean))];
          console.log('Extracted categories:', uniqueCategories);
          setCategories(uniqueCategories);
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Fallback categories
      setCategories(['Robotics', 'AI/ML', 'Mechanics', 'Electronics', 'Software']);
    }
  };

  const clearFilters = () => {
    setSelectedStatus('all');
    setSelectedCategory('all');
    setShowFeaturedOnly(false);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedStatus !== 'all' || selectedCategory !== 'all' || showFeaturedOnly || searchQuery;

  // Group projects by status
  const groupedProjects = projects.reduce((acc, project) => {
    if (!acc[project.status]) acc[project.status] = [];
    acc[project.status].push(project);
    return acc;
  }, {});

  console.log('All projects:', projects);
  console.log('Grouped projects:', groupedProjects);
  console.log('Projects length:', projects.length);

  // Fallback images array
  const fallbackImages = [
    "/servilancerobot.jpeg",
    "/humanoidRobotHealthcare.webp",
    "/bgImageforroboticslab.jpg"
  ];

  const getFallbackImage = (index = 0) => {
    return fallbackImages[index % fallbackImages.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-600">
              Robotics Club Projects
            </h1>
            <p className="text-lg text-white/60">Showcasing our innovation, creativity, and technical expertise through impactful projects.</p>
          </div>
          
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 animate-pulse">
                <div className="h-48 bg-white/10 rounded-lg mb-4"></div>
                <div className="h-6 bg-white/10 rounded mb-3"></div>
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-4 bg-white/10 rounded mb-4"></div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 w-20 bg-white/10 rounded"></div>
                  <div className="h-6 w-16 bg-white/10 rounded"></div>
                </div>
                <div className="h-8 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-600"
          >
            Robotics Club Projects
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg text-white/60"
          >
            Showcasing our innovation, creativity, and technical expertise through impactful projects.
          </motion.p>
        </div>

        {/* Filters & Search */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-8"
        >
          <h3 className="text-xl font-bold mb-4 text-white">Filters & Search</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-white/60 w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="text-white/60 w-5 h-5" />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                {projectStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
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
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Toggle */}
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
        </motion.div>

        {/* Projects Display */}
        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-white/40 text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Projects Found</h3>
            <p className="text-white/60 mb-6">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search terms.' 
                : 'No projects are currently available.'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-12">
            {/* Featured Projects */}
            {groupedProjects.ongoing?.filter(p => p.isFeatured).length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold flex items-center text-white">
                  <Star className="mr-3 text-red-500" /> Featured Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedProjects.ongoing.filter(p => p.isFeatured).map((project, index) => (
                    <ProjectCard key={project._id} project={project} index={index} />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Ongoing Projects */}
            {groupedProjects.ongoing?.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold flex items-center text-white">
                  <Clock className="mr-3 text-red-500" /> Ongoing Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedProjects.ongoing.map((project, index) => (
                    <ProjectCard key={project._id} project={project} index={index} />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Upcoming Projects */}
            {groupedProjects.upcoming?.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold flex items-center text-white">
                  <Rocket className="mr-3 text-red-500" /> Upcoming Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedProjects.upcoming.map((project, index) => (
                    <ProjectCard key={project._id} project={project} index={index} />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Completed Projects */}
            {groupedProjects.completed?.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold flex items-center text-white">
                  <CheckCircle className="mr-3 text-red-500" /> Completed Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedProjects.completed.map((project, index) => (
                    <ProjectCard key={project._id} project={project} index={index} />
                  ))}
                </div>
              </motion.section>
            )}

            {/* On Hold Projects */}
            {groupedProjects.on_hold?.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold flex items-center text-white">
                  <Target className="mr-3 text-red-500" /> On Hold Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedProjects.on_hold.map((project, index) => (
                    <ProjectCard key={project._id} project={project} index={index} />
                  ))}
                </div>
              </motion.section>
            )}
          </div>
        )}

        {/* Pagination Info */}
        {pagination.total > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/60 mt-8"
          >
            Showing {projects.length} of {pagination.total} projects
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project, index }) => {
  const fallbackImages = [
    "/servilancerobot.jpeg",
    "/humanoidRobotHealthcare.webp",
    "/bgImageforroboticslab.jpg"
  ];

  const getFallbackImage = (index = 0) => {
    return fallbackImages[index % fallbackImages.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="group"
    >
      <Link href={`/Projects/${project._id}`}>
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10 cursor-pointer h-full">
          {/* Project Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getProjectStatusColor(project.status)}`}>
                {getProjectStatusIcon(project.status)}
                {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' ')}
              </span>
              {project.isFeatured && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  ⭐ Featured
                </span>
              )}
            </div>
          </div>

          {/* Project Image */}
          <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden bg-white/10">
            <Image
              src={project.imageUrl || getFallbackImage(index)}
              alt={project.title}
              fill
              className="object-cover"
              onError={(e) => {
                e.target.src = getFallbackImage(index);
              }}
            />
          </div>

          {/* Project Title */}
          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors">
            {project.title}
          </h3>

          {/* Project Description */}
          <p className="text-white/70 text-sm mb-4 line-clamp-3">
            {project.description}
          </p>

          {/* Project Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Calendar className="w-4 h-4" />
              <span>Started: {formatDate(project.startDate)}</span>
            </div>
            {project.category && (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Tag className="w-4 h-4" />
                <span>{project.category}</span>
              </div>
            )}
            {project.budget && (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <DollarSign className="w-4 h-4" />
                <span>Budget: ${project.budget.toLocaleString()}</span>
              </div>
            )}
            {project.teamMembers && project.teamMembers.length > 0 && (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Users className="w-4 h-4" />
                <span>{project.teamMembers.length} team members</span>
              </div>
            )}
          </div>

          {/* Progress Bar for Ongoing Projects */}
          {project.status === 'ongoing' && project.milestones && project.milestones.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                <span>Progress</span>
                <span>{calculateProgress(project.milestones)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <motion.div
                  className={`bg-gradient-to-r ${getProgressColor(calculateProgress(project.milestones))} h-2 rounded-full`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${calculateProgress(project.milestones)}%` }}
                  transition={{ duration: 1 }}
                  viewport={{ once: true }}
                />
              </div>
            </div>
          )}

          {/* View Details Button */}
          <div className="flex items-center justify-between">
            <span className="text-red-400 text-sm font-medium group-hover:text-red-300 transition-colors">
              View Details
            </span>
            <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProjectsPage;
