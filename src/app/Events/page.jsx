"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Box, Layout, Search, Filter, ArrowRight, Calendar, Users, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    skip: 0,
    hasMore: false
  });

  // Event types from API specification
  const eventTypes = [
    'workshop', 'seminar', 'exhibition', 'training', 'networking', 
    'competition', 'technical', 'educational', 'showcase'
  ];

  // Event statuses from API specification
  const eventStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];

  useEffect(() => {
    fetchEvents();
  }, [selectedStatus, selectedType, selectedCategory, showFeaturedOnly, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (showFeaturedOnly) params.append('isFeatured', 'true');
      if (searchQuery) params.append('q', searchQuery);
      params.append('limit', '100'); // Get more events for better filtering
      
      const res = await fetch(`${API_BASE_URL}/events?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch events');
      
      const data = await res.json();
      if (data.success) {
        setEvents(data.data.items || []);
        setPagination(data.data.pagination || {});
      } else {
        throw new Error(data.message || 'Failed to fetch events');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Since the API doesn't provide categories endpoint, we'll extract unique categories from events
      const res = await fetch(`${API_BASE_URL}/events?limit=100`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data.items) {
          const uniqueCategories = [...new Set(data.data.items.map(event => event.category).filter(Boolean))];
          setCategories(uniqueCategories);
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Fallback categories
      setCategories(['Robotics', 'AI/ML', 'Mechanics', 'Electronics', 'Software']);
    }
  };

  const filteredEvents = events.filter(event => {
    // Additional client-side filtering if needed
    return true; // API handles most filtering
  });

  const getEventStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'ongoing':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'completed':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-white/10 text-white/80 border-white/20';
    }
  };

  const getEventTypeColor = (type) => {
    const typeColors = {
      'workshop': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'seminar': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'exhibition': 'bg-green-500/20 text-green-300 border-green-500/30',
      'training': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'networking': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      'competition': 'bg-red-500/20 text-red-300 border-red-500/30',
      'technical': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      'educational': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      'showcase': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    };
    return typeColors[type] || 'bg-white/10 text-white/80 border-white/20';
  };

  // Helper to combine date and time
  const combineDateTime = (dateString, timeString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (timeString) {
      const [hours, minutes] = timeString.split(':');
      date.setHours(parseInt(hours, 10), parseInt(minutes || 0, 10), 0, 0);
    }
    return date;
  };

  // Determine status from dates when possible so UI stays consistent
  const getDerivedStatus = (event) => {
    if (!event) return 'upcoming';
    if (event.status === 'cancelled') return 'cancelled';
    const now = new Date();
    // Combine date and time for accurate comparison
    const start = event.startDate ? combineDateTime(event.startDate, event.startTime) : null;
    const end = event.endDate ? combineDateTime(event.endDate, event.endTime) : null;
    if (start && end) {
      if (now < start) return 'upcoming';
      if (now >= start && now <= end) return 'ongoing';
      if (now > end) return 'completed';
    }
    if (start) {
      return now < start ? 'upcoming' : 'ongoing';
    }
    return event.status || 'upcoming';
  };

  // Compute available seats text
  const getAvailabilityText = (event) => {
    const max = typeof event?.maxCapacity === 'number' ? event.maxCapacity : null;
    const current = typeof event?.currentRegistrations === 'number' ? event.currentRegistrations : 0;
    if (max === null) return null; // no cap → omit
    const available = Math.max(0, max - current);
    return available === 0 ? 'Sold out' : `${available} available`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString, timeString = null) => {
    let date;
    if (timeString && dateString) {
      date = combineDateTime(dateString, timeString);
    } else {
      date = new Date(dateString);
    }
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const clearFilters = () => {
    setSelectedStatus('all');
    setSelectedType('all');
    setSelectedCategory('all');
    setShowFeaturedOnly(false);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedStatus !== 'all' || selectedType !== 'all' || selectedCategory !== 'all' || showFeaturedOnly || searchQuery;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Events</h1>
            <p className="text-xl text-white/60">Discover exciting robotics events and workshops</p>
          </div>
          
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 animate-pulse">
                <div className="h-4 bg-white/10 rounded mb-3"></div>
                <div className="h-3 bg-white/10 rounded mb-2"></div>
                <div className="h-3 bg-white/10 rounded mb-4"></div>
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
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Events
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-xl text-white/60"
          >
            Discover exciting robotics events and workshops
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
                placeholder="Search events..."
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
                {eventStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="text-white/60 w-5 h-5" />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
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
          </div>

          {/* Featured Toggle and Clear Filters */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className="w-4 h-4 text-red-500 bg-white/10 border-white/20 rounded focus:ring-red-500 focus:ring-2"
              />
              <span className="text-white/80">Show Featured Events Only</span>
            </label>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </motion.div>

        {/* Events Grid */}
        <div className="mb-8">
          {filteredEvents.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-white/40 text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
              <p className="text-white/60 mb-6">
                {hasActiveFilters 
                  ? 'Try adjusting your filters or search terms.' 
                  : 'No events are currently available.'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  className="group"
                >
                  <Link href={`/Events/${event._id}`}>
                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10 cursor-pointer h-full">
                      {/* Event Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-2 flex-wrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getEventTypeColor(event.type)}`}>
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getEventStatusColor(getDerivedStatus(event))}`}>
                            {getDerivedStatus(event).charAt(0).toUpperCase() + getDerivedStatus(event).slice(1)}
                          </span>
                          {event.isFeatured && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Event Title */}
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors">
                        {event.title}
                      </h3>

                      {/* Event Description */}
                      <p className="text-white/70 text-sm mb-4 line-clamp-3">
                        {event.description}
                      </p>

                      {/* Event Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(event.startDate, event.startTime)} - {formatTime(event.endDate, event.endTime)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {getAvailabilityText(event) && (
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <Users className="w-4 h-4" />
                            <span>{getAvailabilityText(event)}</span>
                          </div>
                        )}
                      </div>

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
              ))}
            </div>
          )}
        </div>

        {/* Pagination Info */}
        {pagination.total > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/60"
          >
            Showing {filteredEvents.length} of {pagination.total} events
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EventsPage; 