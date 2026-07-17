"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Star,
  User,
  CalendarDays,
  Tag,
  Link2
} from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

const EventDetail = () => {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);

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

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        console.log('Fetching event details...', { id: params.id, url: `${API_BASE_URL}/events/${params.id}` });
        const res = await fetch(`${API_BASE_URL}/events/${params.id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch event');
        const data = await res.json();
        console.log('Fetched event details response:', data);
        if (data.success) {
          setEvent(data.data.item);
          console.log('Event details set in state:', data.data.item);
        } else {
          throw new Error(data.message || 'Failed to fetch event');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchEvent();
    }
  }, [params.id, API_BASE_URL]);

  useEffect(() => {
    if (!event) return;
    
    // Determine target date - use registration deadline if available, otherwise start date with time
    let targetDate = null;
    if (event.registrationDeadline) {
      targetDate = new Date(event.registrationDeadline);
    } else if (event.startDate) {
      targetDate = combineDateTime(event.startDate, event.startTime);
    }
    
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return { diff, days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsImageOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

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
      case 'closed':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-white/10 text-white/80 border-white/20';
    }
  };

  const getEventStatusIcon = (status) => {
    switch (status) {
      case 'upcoming':
        return <Calendar className="w-4 h-4" />;
      case 'ongoing':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'closed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
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

  // Image URL helpers (align with Gallery handling)
  const isCloudinaryUrl = (url) => typeof url === 'string' && /https?:\/\/res\.cloudinary\.com\//.test(url);
  const sanitizeCloudinaryExtension = (url) => {
    if (!url) return url;
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
    return safeUrl.replace('/image/upload/', `/image/upload/${transforms}/`);
  };
  const getEventImageUrl = (url, opts = {}) => {
    if (!url) return '/bgImageforroboticslab.jpg';
    const transformed = transformCloudinaryUrl(url, opts);
    return transformed || '/bgImageforroboticslab.jpg';
  };

  const computeDerivedStatus = () => {
    if (!event) return 'unknown';
    if (event.status === 'cancelled') return 'cancelled';
    const now = new Date();
    // Combine date and time for accurate comparison
    const start = event.startDate ? combineDateTime(event.startDate, event.startTime) : null;
    const end = event.endDate ? combineDateTime(event.endDate, event.endTime) : null;
    if (start && now < start) return 'upcoming';
    if (start && end && now >= start && now <= end) return 'ongoing';
    if (end && now > end) return 'completed';
    // Fallbacks if dates missing
    if (start && !end && now >= start) return 'ongoing';
    return 'unknown';
  };

  const getEffectiveStatus = () => {
    const derived = computeDerivedStatus();
    if (derived === 'upcoming' && event?.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);
      if (deadline <= new Date()) return 'closed';
    }
    return derived;
  };

  const isRegistrationOpen = () => {
    if (!event) return false;
    if (event.status === 'cancelled' || event.status === 'completed') return false;
    if (event.registrationDeadline) {
      return new Date(event.registrationDeadline) > new Date();
    }
    return event.status === 'upcoming';
  };

  const isEventFull = () => {
    if (!event) return false;
    return event.maxCapacity && event.currentRegistrations >= event.maxCapacity;
  };

  const getRegistrationStatus = () => {
    if (!event) return 'unknown';
    const effective = getEffectiveStatus();
    if (effective === 'cancelled') return 'cancelled';
    if (effective === 'completed') return 'completed';
    if (isEventFull()) return 'full';
    if (!isRegistrationOpen()) return 'closed';
    return 'open';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="text-white/60 mb-6">{error || 'The event you are looking for does not exist.'}</p>
          <Link href="/Events">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Events
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-black border-b border-white/10">
        <div className="container mx-auto px-4 py-6 relative">
          {/* Back button and Countdown in same row */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            {/* Back Button - Left Side */}
            <Link href="/Events">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Events</span>
                <span className="sm:hidden">Back</span>
              </motion.button>
            </Link>

            {/* Countdown - Right Side */}
            {(event.registrationDeadline || event.startDate) && timeLeft && timeLeft.diff > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-shrink-0"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2 md:gap-3 bg-red-500/10 border border-red-500/20 rounded-lg sm:rounded-xl px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 backdrop-blur">
                  <span className="text-red-200 text-[10px] sm:text-xs md:text-sm whitespace-nowrap leading-tight">{event.registrationDeadline ? 'Registration closes in' : 'Starts in'}</span>
                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-wrap">
                    {[
                      { label: 'd', value: timeLeft.days },
                      { label: 'h', value: timeLeft.hours },
                      { label: 'm', value: timeLeft.minutes },
                      { label: 's', value: timeLeft.seconds },
                    ].map((unit, idx) => (
                      <div key={unit.label} className="flex items-end gap-0.5 sm:gap-1">
                        <motion.span
                          key={`${unit.label}-${unit.value}`}
                          initial={{ opacity: 0.4, scale: 0.95, y: -2 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className="text-red-300 font-semibold text-xs sm:text-sm md:text-base lg:text-lg tabular-nums"
                        >
                          {String(unit.value).padStart(2, '0')}
                        </motion.span>
                        <span className="text-red-200/80 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs uppercase leading-none pb-0.5">{unit.label}</span>
                        {idx < 3 && <span className="text-red-200/40 ml-0.5 sm:ml-1 text-[10px] sm:text-xs hidden sm:inline">:</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            {/* Event Type and Status */}
            <div className="flex items-center gap-2 sm:gap-3 flex-nowrap">
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border flex-shrink-0 whitespace-nowrap ${getEventTypeColor(event.type)}`}>
                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
              </span>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border flex items-center gap-1.5 sm:gap-2 flex-shrink-0 whitespace-nowrap ${getEventStatusColor(getEffectiveStatus())}`}>
                {getEventStatusIcon(getEffectiveStatus())}
                {getEffectiveStatus().charAt(0).toUpperCase() + getEffectiveStatus().slice(1)}
              </span>
              {event.isFeatured && (
                <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1.5 sm:gap-2 flex-shrink-0 whitespace-nowrap">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Featured
                </span>
              )}
            </div>

            {/* Event Title */}
            <h1 className="text-4xl md:text-5xl font-bold">{event.title}</h1>
            
            {/* Event Description */}
            <p className="text-xl text-white/80 max-w-4xl">
              {event.description}
            </p>

            {/* Countdown moved to top-right */}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-2xl font-bold mb-6 text-white">Event Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date and Time */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-white">Date & Time</div>
                      <div className="text-white/80">
                        <div>{formatDate(event.startDate)}</div>
                        <div className="text-sm text-white/60">
                          {formatTime(event.startDate, event.startTime)} - {formatTime(event.endDate, event.endTime)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">Location</div>
                        <div className="text-white/80">{event.location}</div>
                      </div>
                    </div>
                  )}

                  {/* Category */}
                  {event.category && (
                    <div className="flex items-start gap-3">
                      <Tag className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">Category</div>
                        <div className="text-white/80">{event.category}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Registration Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-white">Capacity</div>
                      <div className="text-white/80">
                        {event.maxCapacity || '∞'}
                      </div>
                    </div>
                  </div>

                  {/* Registration Deadline */}
                  {event.registrationDeadline && (
                    <div className="flex items-start gap-3">
                      <CalendarDays className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">Registration Deadline</div>
                        <div className="text-white/80">
                          {formatDateTime(event.registrationDeadline)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Organizer */}
                  {event.organizerId && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">Organizer</div>
                        <div className="text-white/80">NewtonBotics</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* External Support Links (Main section before Registration) */}
            {Array.isArray(event.sampleLinks) && event.sampleLinks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-2xl font-bold mb-6 text-white">External Support Links</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.sampleLinks.map((link, idx) => {
                    const href = typeof link?.url === 'string' && /^(https?:)?\/\//i.test(link.url)
                      ? link.url
                      : `https://${link?.url || ''}`;
                    const label = link?.label || `Link ${idx + 1}`;
                    return (
                      <a
                        key={`${label}-${idx}`}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="flex items-center justify-between w-full bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors group"
                      >
                        <span className="truncate mr-3 flex items-center gap-2">
                          <Link2 className="w-4 h-4 opacity-80 text-blue-400 group-hover:text-blue-300 group-hover:opacity-100" />
                          <span className="truncate">{label}</span>
                        </span>
                        <ExternalLink className="w-4 h-4 opacity-80 text-blue-400 group-hover:text-blue-300 group-hover:opacity-100" />
                      </a>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Registration Section - Only show if registration is required */}
            {event.requiresRegistration && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-2xl font-bold mb-6 text-white">Registration</h2>
                
                <div className="space-y-6">
                  {/* Registration Status */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        getRegistrationStatus() === 'open' ? 'bg-green-400' :
                        getRegistrationStatus() === 'full' ? 'bg-red-400' :
                        getRegistrationStatus() === 'closed' ? 'bg-yellow-400' :
                        'bg-gray-400'
                      }`}></div>
                      <span className="font-medium text-white">
                        Registration {getRegistrationStatus() === 'open' ? 'Open' :
                                    getRegistrationStatus() === 'full' ? 'Full' :
                                    getRegistrationStatus() === 'closed' ? 'Closed' :
                                    getRegistrationStatus() === 'cancelled' ? 'Cancelled' :
                                    'Completed'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-white/60">
                      Available slots: {event.maxCapacity || '∞'}
                    </div>
                  </div>

                  {/* Registration Button */}
                  {getRegistrationStatus() === 'open' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isRegistering}
                      onClick={() => {
                        if (event?.registrationFormLink) {
                          console.log('Opening registration form in new tab:', event.registrationFormLink);
                          window.open(event.registrationFormLink, '_blank', 'noopener,noreferrer');
                        } else {
                          console.warn('No registration form link available for this event');
                        }
                      }}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRegistering ? 'Processing...' : 'Register for Event'}
                    </motion.button>
                  )}

                  {/* Registration Messages */}
                  {getRegistrationStatus() === 'full' && (
                    <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-300 font-medium">Event is at full capacity</p>
                      <p className="text-red-300/80 text-sm mt-1">Check back later for cancellations</p>
                    </div>
                  )}

                  {getRegistrationStatus() === 'closed' && (
                    <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-yellow-300 font-medium">Registration is closed</p>
                      <p className="text-yellow-300/80 text-sm mt-1">The registration deadline has passed</p>
                    </div>
                  )}

                  {getRegistrationStatus() === 'cancelled' && (
                    <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-300 font-medium">Event Cancelled</p>
                      <p className="text-red-300/80 text-sm mt-1">This event has been cancelled</p>
                    </div>
                  )}

                  {getRegistrationStatus() === 'completed' && (
                    <div className="text-center p-4 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                      <p className="text-gray-300 font-medium">Event Completed</p>
                      <p className="text-gray-300/80 text-sm mt-1">This event has already taken place</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Cover Image (Sidebar) */}
            {event.imageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg"
              >
                <button
                  type="button"
                  onClick={() => setIsImageOpen(true)}
                  className="block w-full cursor-zoom-in"
                >
                  <img
                    src={getEventImageUrl(event.imageUrl, { width: 1200 })}
                    alt={event.title || 'Event image'}
                    className="w-full h-56 object-cover"
                    onError={(e) => { e.currentTarget.src = '/bgImageforroboticslab.jpg'; }}
                  />
                </button>
              </motion.div>
            )}

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-bold mb-4 text-white">Quick Info</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Status</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getEventStatusColor(getEffectiveStatus())}`}>
                    {getEffectiveStatus().charAt(0).toUpperCase() + getEffectiveStatus().slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Type</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Capacity</span>
                  <span className="text-white font-medium">
                    {event.maxCapacity || '∞'}
                  </span>
                </div>
                {event.isFeatured && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Featured</span>
                    <span className="text-yellow-400">⭐ Yes</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Share Event */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-bold mb-4 text-white">Share Event</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigator.share && navigator.share({
                    title: event.title,
                    text: event.description,
                    url: window.location.href
                  })}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Share Event
                </button>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    } catch (e) {
                      console.error('Failed to copy link:', e);
                    }
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Copy Link
                </button>
                {linkCopied && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-green-300 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 inline-block"
                  >
                    Link copied
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
    {isImageOpen && event?.imageUrl && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        onClick={() => setIsImageOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setIsImageOpen(false)}
            className="absolute -top-3 -right-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center"
            aria-label="Close image"
          >
            ×
          </button>
          <img
            src={getEventImageUrl(event.imageUrl)}
            alt={event.title || 'Event image full size'}
            className="max-h-[75vh] max-w-[80vw] object-contain rounded-lg shadow-2xl cursor-zoom-out"
            onClick={() => setIsImageOpen(false)}
            onError={(e) => { e.currentTarget.src = '/bgImageforroboticslab.jpg'; }}
          />
        </motion.div>
      </motion.div>
    )}
    </>
  );
};

export default EventDetail;
