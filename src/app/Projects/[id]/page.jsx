"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  Users, 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle, 
  Target,
  TrendingUp,
  DollarSign,
  Tag,
  User,
  Award,
  Rocket,
  Star,
  Zap,
  MapPin,
  CalendarDays,
  Boxes
} from "lucide-react";
import Link from "next/link";
import RemoteImage from "@/components/RemoteImage";
import { DetailPageSkeleton } from "@/components/PageSkeletons";
import { mediaService } from "@/lib/media";
import { API_BASE_URL } from "@/lib/api";
import { getPersonDisplayName } from "@/lib/publicTeam";

const getUserId = (user) => {
  if (!user) return null;
  if (typeof user === "string") return user;
  return user._id || user.id || null;
};

const ProjectDetail = () => {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [galleryCategoryId, setGalleryCategoryId] = useState(null);
  const videoRef = useRef(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = `${API_BASE_URL}/projects/${params.id}`;
        console.log('Fetching project from:', url);
        
        const res = await fetch(url, { cache: 'no-store' });
        console.log('Response status:', res.status);
        
        if (!res.ok) throw new Error('Failed to fetch project');
        
        const data = await res.json();
        console.log('API Response:', data);
        
        if (data.success) {
          console.log('Project data:', data.data.project);
          setProject(data.data.project);
        } else {
          throw new Error(data.message || 'Failed to fetch project');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProject();
    }
  }, [params.id, API_BASE_URL]);

  // Load project-related gallery items (images only)
  useEffect(() => {
    const loadGallery = async () => {
      if (!project) return;
      try {
        setGalleryLoading(true);
        let categoryId = project.galleryCategoryId || project.mediaCategoryId || project.categoryId || undefined;

        // If categoryId is not present on project, try to resolve it by matching media categories
        if (!categoryId) {
          try {
            const categories = await mediaService.listCategories();
            const title = (project.title || '').toLowerCase();
            const projCategory = (project.category || '').toLowerCase();
            const match = categories.find(c => {
              const name = (c.name || '').toLowerCase();
              return name === title || name === projCategory || name.includes(title) || name.includes(projCategory);
            });
            if (match?._id) {
              categoryId = match._id;
            }
          } catch (e) {
            console.log('[ProjectDetail] Failed to resolve media category by name:', e);
          }
        }

        // Prefer filtering by categoryId when available
        const params = categoryId ? { categoryId, limit: 50, skip: 0 } : { q: project.title || undefined, limit: 50, skip: 0 };
        console.log('[ProjectDetail] Loading gallery with params:', params);
        const { items } = await mediaService.listMedia(params);
        console.log('[ProjectDetail] Gallery items returned:', items?.length || 0, items);
        const supported = Array.isArray(items)
          ? items.filter(it => {
              const t = (it.fileType || '').toLowerCase();
              return t === 'image' || t === 'video';
            })
          : [];
        setGalleryItems(supported);
        setGalleryCategoryId(categoryId || null);
        setCurrentSlide(0);
      } catch (e) {
        console.error('Error loading gallery for project:', e);
        setGalleryItems([]);
      } finally {
        setGalleryLoading(false);
      }
    };
    loadGallery();
  }, [project]);

  // Auto-advance slideshow: 3s for images, 5s for videos
  useEffect(() => {
    if (!galleryItems || galleryItems.length <= 1) return;
    const current = galleryItems[currentSlide] || {};
    const type = (current.fileType || '').toLowerCase();
    const delay = type === 'video' ? 5000 : 3000;
    const timerId = setTimeout(() => {
      setCurrentSlide(prev => (prev + 1) % galleryItems.length);
    }, delay);
    return () => clearTimeout(timerId);
  }, [galleryItems, currentSlide]);

  // Ensure video starts playing when slide is a video
  useEffect(() => {
    const current = galleryItems[currentSlide];
    if (current && (current.fileType || '').toLowerCase() === 'video' && videoRef.current) {
      // attempt play; some browsers require muted (already set)
      videoRef.current.play().catch(() => {});
    }
  }, [currentSlide, galleryItems]);

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

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

  const getMilestoneStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'overdue':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-white/10 text-white/80 border-white/20';
    }
  };

  const getMilestoneStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <Target className="w-4 h-4" />;
      case 'overdue':
        return <Zap className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const calculateProgress = (milestones) => {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.status === 'completed').length;
    return Math.round((completed / milestones.length) * 100);
  };

  const getDisplayProgress = (proj) =>
    proj?.status === 'completed' ? 100 : (proj?.progress ?? calculateProgress(proj?.milestones));

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'from-green-500 to-green-600';
    if (progress >= 60) return 'from-blue-500 to-blue-600';
    if (progress >= 40) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-white/60 mb-6">{error || 'The project you are looking for does not exist.'}</p>
          <Link href="/Projects">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Projects
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  // Fallback images array
  const fallbackImages = [
    "/servilancerobot.jpeg",
    "/humanoidRobotHealthcare.webp",
    "/bgImageforroboticslab.jpg"
  ];

  const getFallbackImage = (index = 0) => {
    return fallbackImages[index % fallbackImages.length];
  };

  const teamLeaderUserId = getUserId(project?.teamLeaderId);
  const displayedTeamMembers = Array.isArray(project?.teamMembers)
    ? project.teamMembers
    : [];
  const teamLeaderInMembers = teamLeaderUserId
    ? displayedTeamMembers.some(
        (member) => getUserId(member.userId)?.toString() === teamLeaderUserId.toString()
      )
    : false;
  const hasTeamSection =
    project.teamLeaderId || displayedTeamMembers.length > 0;

  const displayProgress = getDisplayProgress(project);
  const milestoneTotal =
    project.totalMilestonesCount || project.milestones?.length || 0;
  const milestoneCompleted =
    project.completedMilestonesCount ||
    project.milestones?.filter((m) => m.status === "completed").length ||
    0;
  const heroImage = project.imageUrl || getFallbackImage(0);

  const scrollToTeam = () => {
    document.getElementById("project-team")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="nb-project-hero border-b border-white/10">
        <div className="container mx-auto px-4 py-5 md:py-8">
          <Link href="/Projects">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 nb-hero-back text-sm transition-colors p-2 -ml-2 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </motion.button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-4 grid lg:grid-cols-5 gap-6 lg:gap-8 items-start"
          >
            <div className="lg:col-span-3 space-y-4 md:space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getProjectStatusColor(project.status)}`}>
                  {getProjectStatusIcon(project.status)}
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace("_", " ")}
                </span>
                {project.isFeatured && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Featured
                  </span>
                )}
                {project.category && (
                  <span className="nb-hero-category inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium">
                    <Tag className="w-4 h-4" />
                    {project.category}
                  </span>
                )}
              </div>

              <h1 className="nb-project-hero-title text-3xl sm:text-4xl lg:text-5xl font-bold font-display leading-tight">
                {project.title}
              </h1>

              {project.description && (
                <p className="nb-project-hero-muted text-base sm:text-lg leading-relaxed max-w-3xl">
                  {project.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3 text-sm">
                {project.startDate && (
                  <span className="nb-hero-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                    <Calendar className="w-4 h-4 text-red-400" />
                    {formatDate(project.startDate)}
                  </span>
                )}
                {(project.teamSize || displayedTeamMembers.length) > 0 && (
                  <button
                    type="button"
                    onClick={scrollToTeam}
                    className="nb-hero-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Users className="w-4 h-4 text-red-400" />
                    {project.teamSize || displayedTeamMembers.length} team members
                  </button>
                )}
                {typeof project.viewCount === "number" && (
                  <span className="nb-hero-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-red-400" />
                    {project.viewCount} views
                  </span>
                )}
              </div>

              <div className="nb-hero-panel rounded-xl p-4 max-w-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm nb-hero-panel-label">Overall progress</span>
                  <span className="text-lg font-bold text-red-400">{displayProgress}%</span>
                </div>
                <div className="nb-hero-progress-track w-full rounded-full h-2.5">
                  <motion.div
                    className={`bg-gradient-to-r ${getProgressColor(displayProgress)} h-2.5 rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${displayProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                {milestoneTotal > 0 && (
                  <p className="text-xs nb-hero-panel-label mt-2">
                    {milestoneCompleted} of {milestoneTotal} milestones completed
                  </p>
                )}
              </div>

              {/* View Project Components CTA */}
              <Link
                href={`/Inventory/projects/${encodeURIComponent(params.id)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-900/30 self-start"
                id="project-components-link"
              >
                <Boxes className="w-4 h-4" />
                View Project Components
              </Link>
            </div>

            <div className="lg:col-span-2">
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-white/15 bg-white/5 shadow-2xl shadow-black/40">
                <RemoteImage
                  src={heroImage}
                  alt={project.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.target.src = getFallbackImage(0);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-2xl font-bold mb-6 text-white">Project Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-white">Start Date</div>
                      <div className="text-white/80">
                        {formatDate(project.startDate)}
                      </div>
                    </div>
                  </div>

                  {project.endDate && (
                    <div className="flex items-start gap-3">
                      <CalendarDays className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">End Date</div>
                        <div className="text-white/80">
                          {formatDate(project.endDate)}
                        </div>
                      </div>
                    </div>
                  )}

                  {project.budget && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">Budget</div>
                        <div className="text-white/80">
                          ${project.budget.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                  {project.priority && (
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">Priority</div>
                        <div className="text-white/80">{project.priority}</div>
                      </div>
                    </div>
                  )}
                  {project.difficulty && (
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">Difficulty</div>
                        <div className="text-white/80">{project.difficulty}</div>
                      </div>
                    </div>
                  )}
                  {(project.duration || project.duration === 0) && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">Duration</div>
                        <div className="text-white/80">{project.duration} days</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Team Info */}
                <div className="space-y-4">
                  {project.teamMembers && project.teamMembers.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">Team Members</div>
                        <div className="text-white/80">
                          {project.teamMembers.length} members
                        </div>
                      </div>
                    </div>
                  )}

                  {project.mentorId && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">Mentor</div>
                        <div className="text-white/80">{getPersonDisplayName(project.mentorId)}</div>
                        {project.mentorId.email && (
                          <div className="text-white/50 text-sm">{project.mentorId.email}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {project.teamLeaderId && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">Team Leader</div>
                        <div className="text-white/80">{getPersonDisplayName(project.teamLeaderId)}</div>
                        {project.teamLeaderId.email && (
                          <div className="text-white/50 text-sm">{project.teamLeaderId.email}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {project.documentationUrl && (
                    <div className="flex items-start gap-3">
                      <ExternalLink className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">Documentation</div>
                        <a href={project.documentationUrl} target="_blank" rel="noreferrer" className="text-red-300 hover:text-red-200 underline break-all">
                          {project.documentationUrl}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Milestones */}
            {project.milestones && project.milestones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Project Milestones</h2>
                  <div className="text-right">
                    <div className="text-sm text-white/60">Overall Progress</div>
                    <div className="text-2xl font-bold text-red-400">{calculateProgress(project.milestones)}%</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/20 rounded-full h-3 mb-6">
                  <motion.div
                    className={`bg-gradient-to-r ${getProgressColor(calculateProgress(project.milestones))} h-3 rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${calculateProgress(project.milestones)}%` }}
                    transition={{ duration: 1.5 }}
                  />
                </div>

                <div className="space-y-4">
                  {project.milestones.map((milestone, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.8 }}
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className={`p-2 rounded-full ${getMilestoneStatusColor(milestone.status)}`}>
                        {getMilestoneStatusIcon(milestone.status)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{milestone.title}</h3>
                        <p className="text-white/70 text-sm">{milestone.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-white/60">
                          <span>Due: {formatDate(milestone.dueDate)}</span>
                          {milestone.completedAt && (
                            <span>Completed: {formatDate(milestone.completedAt)}</span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getMilestoneStatusColor(milestone.status)}`}>
                        {milestone.status.replace('_', ' ')}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Team Members */
            }
            {hasTeamSection && (
              <motion.div
                id="project-team"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-2xl font-bold mb-2 text-white">Team Members</h2>
                {project.teamLeaderId && (
                  <p className="text-white/70 text-sm mb-6">
                    Team Leader:{" "}
                    <span className="text-white font-semibold">
                      {getPersonDisplayName(project.teamLeaderId)}
                    </span>
                  </p>
                )}
                {!project.teamLeaderId && <div className="mb-6" />}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.teamLeaderId && !teamLeaderInMembers && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      className="p-4 bg-red-500/10 rounded-lg border border-red-500/30"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                          <Star className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {getPersonDisplayName(project.teamLeaderId)}
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                            <Star className="w-3 h-3" />
                            Team Leader
                          </span>
                          {project.teamLeaderId.email && (
                            <a
                              href={`mailto:${project.teamLeaderId.email}`}
                              className="text-white/60 text-xs hover:text-white/80 break-all block mt-1"
                            >
                              {project.teamLeaderId.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {displayedTeamMembers.map((member, index) => {
                    const memberUserId = getUserId(member.userId);
                    const isTeamLeader =
                      teamLeaderUserId &&
                      memberUserId?.toString() === teamLeaderUserId.toString();

                    return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.8 }}
                      className={`p-4 rounded-lg border ${
                        isTeamLeader
                          ? "bg-red-500/10 border-red-500/30"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        { (member?.userId?.profileImageUrl || member?.profileImageUrl) ? (
                          <RemoteImage
                            src={member.userId?.profileImageUrl || member.profileImageUrl}
                            alt={getPersonDisplayName(member.userId || { userName: member.userName }) + " avatar"}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-red-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white">
                            {getPersonDisplayName(member.userId) || member.userName || "Team Member"}
                          </div>
                          {isTeamLeader && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                              <Star className="w-3 h-3" />
                              Team Leader
                            </span>
                          )}
                          {member.role && (
                            <div className="text-white/60 text-sm">{member.role}</div>
                          )}
                          {(member.userId?.email || member.email) && (
                            <a
                              href={`mailto:${member.userId?.email || member.email}`}
                              className="text-white/60 text-xs hover:text-white/80 break-all"
                            >
                              {member.userId?.email || member.email}
                            </a>
                          )}
                        </div>
                      </div>
                      {member.skills && member.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {member.skills.map((skill, skillIndex) => (
                            <span key={skillIndex} className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      {member.responsibilities && member.responsibilities.length > 0 && (
                        <div className="mt-3">
                          <div className="text-white/60 text-xs mb-1">Responsibilities</div>
                          <div className="flex flex-wrap gap-2">
                            {member.responsibilities.map((resp, rIndex) => (
                              <span key={rIndex} className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">
                                {resp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {member.joinedAt && (
                        <div className="text-white/40 text-xs mt-3">Joined {formatDate(member.joinedAt)}</div>
                      )}
                    </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Achievements */}
            {project.achievements && project.achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-400" />
                  Achievements
                </h2>
                <div className="space-y-3">
                  {project.achievements.map((achievement, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.8 }}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-white/80">{achievement}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Removed separate All Team Members section as requested */}

            {project.comments && project.comments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-2xl font-bold mb-6 text-white">Comments</h2>
                <div className="space-y-4">
                  {project.comments.map((cmt, idx) => (
                    <div key={idx} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-white/80">{cmt.text || String(cmt)}</div>
                      {cmt.createdAt && (
                        <div className="text-white/40 text-xs mt-2">{formatDate(cmt.createdAt)} {formatTime(cmt.createdAt)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-bold mb-5 text-white font-display">Quick Info</h3>
              <div className="divide-y divide-white/10">
                <div className="flex items-center justify-between py-3 gap-4">
                  <span className="text-white/60 text-sm">Status</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getProjectStatusColor(project.status)}`}>
                    {getProjectStatusIcon(project.status)}
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 gap-4">
                  <span className="text-white/60 text-sm">Category</span>
                  <span className="text-white font-medium text-sm text-right">
                    {project.category || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 gap-4">
                  <span className="text-white/60 text-sm">Team size</span>
                  {hasTeamSection ? (
                    <button
                      type="button"
                      onClick={scrollToTeam}
                      className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors"
                    >
                      {project.teamSize || displayedTeamMembers.length + (project.teamLeaderId ? 1 : 0)} members →
                    </button>
                  ) : (
                    <span className="text-white font-medium text-sm">0 members</span>
                  )}
                </div>
                {project.teamLeaderId && (
                  <div className="flex items-center justify-between py-3 gap-4">
                    <span className="text-white/60 text-sm">Team leader</span>
                    <span className="text-white font-medium text-sm text-right">
                      {getPersonDisplayName(project.teamLeaderId)}
                    </span>
                  </div>
                )}
                {typeof project.isPublic === "boolean" && (
                  <div className="flex items-center justify-between py-3 gap-4">
                    <span className="text-white/60 text-sm">Visibility</span>
                    <span className="text-white font-medium text-sm">{project.isPublic ? "Public" : "Private"}</span>
                  </div>
                )}
                {typeof project.isOverdue === "boolean" && (
                  <div className="flex items-center justify-between py-3 gap-4">
                    <span className="text-white/60 text-sm">Overdue</span>
                    <span className={`text-sm font-medium ${project.isOverdue ? "text-red-400" : "text-green-400"}`}>
                      {project.isOverdue ? "Yes" : "No"}
                    </span>
                  </div>
                )}
                {typeof project.viewCount === "number" && (
                  <div className="flex items-center justify-between py-3 gap-4">
                    <span className="text-white/60 text-sm">Views</span>
                    <span className="text-white font-medium text-sm">{project.viewCount}</span>
                  </div>
                )}
                {milestoneTotal > 0 && (
                  <div className="py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 text-sm">Milestones</span>
                      <span className="text-white font-medium text-sm">
                        {milestoneCompleted} / {milestoneTotal}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: milestoneTotal }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${
                            i < milestoneCompleted ? "bg-red-500" : "bg-white/15"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Progress</span>
                  <span className="text-red-400 font-bold">{displayProgress}%</span>
                </div>
                <div className="w-full bg-white/15 rounded-full h-2.5">
                  <div
                    className={`bg-gradient-to-r ${getProgressColor(displayProgress)} h-2.5 rounded-full transition-all duration-700`}
                    style={{ width: `${displayProgress}%` }}
                  />
                </div>
              </div>

              {project.isFeatured && (
                <div className="mt-4 flex items-center gap-2 text-yellow-400 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  Featured project
                </div>
              )}
            </motion.div>

            {/* Project Components / Inventory Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <Boxes className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Project Components</h3>
              </div>
              <p className="text-white/60 text-sm mb-4 leading-relaxed">
                Browse and manage the parts and equipment dedicated to this project. General Lab components are tracked separately.
              </p>
              <Link
                href={`/Inventory/projects/${encodeURIComponent(params.id)}`}
                id="sidebar-project-components-link"
                className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
              >
                <Boxes className="w-4 h-4" />
                View Project Components
              </Link>
            </motion.div>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h3 className="text-xl font-bold mb-4 text-white">Tag List</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                      className="px-3 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-sm font-medium"
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Project Gallery</h3>
                <Link
                  href={galleryCategoryId ? `/Gallery?categoryId=${galleryCategoryId}` : `/Gallery`}
                  className="text-sm px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  View All
                </Link>
              </div>
              {galleryLoading && (
                <div className="space-y-3">
                  <div className="nb-skeleton h-64 w-full rounded-lg" />
                  <div className="flex justify-between">
                    <div className="nb-skeleton h-8 w-16 rounded" />
                    <div className="nb-skeleton h-4 w-12 rounded" />
                    <div className="nb-skeleton h-8 w-16 rounded" />
                  </div>
                </div>
              )}
              {!galleryLoading && galleryItems.length === 0 && (
                <div className="text-white/60">No images found for this project.</div>
              )}
              {!galleryLoading && galleryItems.length > 0 && (
                <div className="relative">
                  <div className="relative w-full h-64 rounded-lg overflow-hidden bg-white/10">
                    {(() => {
                      const current = galleryItems[currentSlide];
                      const t = (current?.fileType || '').toLowerCase();
                      if (t === 'video') {
                        return (
                          <video
                            src={current?.fileUrl}
                            poster={current?.thumbnailUrl}
                            className="w-full h-full object-cover"
                            controls
                            playsInline
                            preload="metadata"
                            muted
                            autoPlay
                            ref={videoRef}
                            key={current?.fileUrl}
                          />
                        );
                      }
                      return (
                        <RemoteImage
                          src={current?.fileUrl || current?.thumbnailUrl}
                          alt={current?.title || 'Project media'}
                          fill
                          className="object-cover"
                        />
                      );
                    })()}
                    {galleryItems[currentSlide]?.title && (
                      <div className="absolute inset-x-0 bottom-0 nb-media-gradient-caption p-3">
                        <div className="nb-media-gradient-text text-sm font-medium truncate">
                          {galleryItems[currentSlide]?.title}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => setCurrentSlide((prev) => (prev - 1 + galleryItems.length) % galleryItems.length)}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded"
                    >
                      Prev
                    </button>
                    <div className="text-white/60 text-sm">
                      {currentSlide + 1} / {galleryItems.length}
                    </div>
                    <button
                      onClick={() => setCurrentSlide((prev) => (prev + 1) % galleryItems.length)}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
            {/* Share Project */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-bold mb-4 text-white">Share Project</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigator.share && navigator.share({
                    title: project.title,
                    text: project.description,
                    url: window.location.href
                  })}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Share Project
                </button>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    } catch (e) {
                      setLinkCopied(false);
                    }
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Copy Link
                </button>
                <div aria-live="polite" className="h-5 text-sm text-green-300 mt-1">
                  {linkCopied ? 'Link copied' : ''}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
