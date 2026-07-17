"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Users, 
  Award, 
  Star, 
  Filter, 
  Search, 
  User, 
  GraduationCap, 
  Briefcase,
  Linkedin,
  Github,
  Globe,
  MapPin,
  Clock,
  Zap,
  Mail,
  X,
  Building2
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

// Fallback images array for team members
const fallbackImages = [
  "/servilancerobot.jpeg",
  "/humanoidRobotHealthcare.webp", 
  "/bgImageforroboticslab.jpg"
];

// Function to get a fallback image for team members
const getPlaceholderImage = (index) => {
  return fallbackImages[index % fallbackImages.length];
};

const TeamPage = () => {
  const [searchTerm, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Team data state
  const [leadershipTeam, setLeadershipTeam] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [researchers, setResearchers] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Image modal state
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchAllTeamData();
  }, []);

  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedImage]);

  // Handler to open image modal
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  // Handler to close image modal
  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const fetchAllTeamData = async () => {
    try {
      setLoading(true);
      setError(null);

      const requestInit = { cache: 'no-store' };

      // Use a high limit so that all members are shown on a single page
      const teamLimit = 100;

      // Fetch all team data in parallel; don't fail whole page if one endpoint fails
      const [leadershipRes, teamRes, mentorsRes, researchersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/public/leadership-team`, requestInit),
        fetch(`${API_BASE_URL}/public/team-members?limit=${teamLimit}`, requestInit),
        fetch(`${API_BASE_URL}/public/mentors`, requestInit),
        fetch(`${API_BASE_URL}/public/researchers`, requestInit)
      ]);

      // Collect any failing endpoints to improve error clarity (but continue rendering with partial data)
      const failing = [
        leadershipRes.ok ? null : 'leadership-team',
        teamRes.ok ? null : 'team-members',
        mentorsRes.ok ? null : 'mentors',
        researchersRes.ok ? null : 'researchers'
      ].filter(Boolean);

      // Parse all responses (ensure correct order)
      const [leadershipData, teamData, mentorsData, researchersData] = await Promise.all([
        leadershipRes.ok ? leadershipRes.json() : Promise.resolve({ success: false, data: { items: [] } }),
        teamRes.ok ? teamRes.json() : Promise.resolve({ success: false, data: { items: [] } }),
        mentorsRes.ok ? mentorsRes.json() : Promise.resolve({ success: false, data: { items: [] } }),
        researchersRes.ok ? researchersRes.json() : Promise.resolve({ success: false, data: { items: [] } })
      ]);

      // Set data if successful
      if (leadershipData.success) setLeadershipTeam(leadershipData.data.items || []);
      if (teamData.success) setTeamMembers(teamData.data.items || []);
      if (mentorsData.success) setMentors(mentorsData.data.items || []);
      if (researchersData.success) setResearchers(researchersData.data.items || []);

      // If some endpoints failed, surface a concise error (but don't block UI)
      if (failing.length > 0) {
        setError(`Some team sections failed to load: ${failing.join(', ')}`);
      }

      // Extract unique departments
      const allPeople = [
        ...(leadershipData.success ? leadershipData.data.items : []),
        ...(teamData.success ? teamData.data.items : []),
        ...(mentorsData.success ? mentorsData.data.items : []),
        ...(researchersData.success ? researchersData.data.items : [])
      ];
      
      const uniqueDepartments = [...new Set(allPeople.map(person => person.department).filter(Boolean))];
      setDepartments(uniqueDepartments);

      // Console log all fetched team data
      console.log('=== Team Page Data Loaded ===');
      console.log('Leadership Team:', leadershipData.success ? leadershipData.data.items : []);
      console.log('Team Members:', teamData.success ? teamData.data.items : []);
      console.log('Mentors:', mentorsData.success ? mentorsData.data.items : []);
      console.log('Researchers:', researchersData.success ? researchersData.data.items : []);
      
      // Check email availability
      const membersWithEmail = allPeople.filter(p => p.email);
      const membersWithoutEmail = allPeople.filter(p => !p.email);
      
      console.log('Summary:', {
        leadershipCount: leadershipData.success ? leadershipData.data.items.length : 0,
        teamMembersCount: teamData.success
          ? (teamData.data.pagination?.total ?? teamData.data.items.length)
          : 0,
        mentorsCount: mentorsData.success ? mentorsData.data.items.length : 0,
        researchersCount: researchersData.success ? researchersData.data.items.length : 0,
        departments: uniqueDepartments,
        totalMembers: allPeople.length,
        membersWithEmail: membersWithEmail.length,
        membersWithoutEmail: membersWithoutEmail.length
      });
      
      if (membersWithEmail.length > 0) {
        console.log('📧 Members with email:', membersWithEmail.map(m => ({ name: m.fullName, email: m.email })));
      }
      if (membersWithoutEmail.length > 0) {
        console.log('⚠️ Members without email:', membersWithoutEmail.map(m => ({ name: m.fullName, id: m.id || m._id })));
      }

    } catch (err) {
      console.error('Error fetching team data:', err);
      setError(err.message || 'Failed to fetch team data');
    } finally {
      setLoading(false);
    }
  };

  // Filter people based on search, role, and department
  const getFilteredPeople = (people) => {
    return people.filter(person => {
      const matchesSearch = !searchTerm || 
        person.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = filterRole === 'all' || person.role === filterRole;
      const matchesDepartment = filterDepartment === 'all' || person.department === filterDepartment;
      
      return matchesSearch && matchesRole && matchesDepartment;
    });
  };

  const filteredLeadership = getFilteredPeople(leadershipTeam);
  const filteredTeamMembers = getFilteredPeople(teamMembers);
  const filteredMentors = getFilteredPeople(mentors);
  const filteredResearchers = getFilteredPeople(researchers);

  const totalMembers = leadershipTeam.length + teamMembers.length + mentors.length + researchers.length;
  const filteredTotal = filteredLeadership.length + filteredTeamMembers.length + filteredMentors.length + filteredResearchers.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto mb-8"></div>
          <h2 className="text-2xl font-bold text-white">Loading Team Data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Team Data</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button 
            onClick={fetchAllTeamData}
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
        className="max-w-7xl mx-auto mb-12 text-center"
        initial={{ opacity: 0, y: -50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-600">
          Our Robotics Team
        </h1>
        <p className="text-lg text-white/80">Innovators, creators, and problem solvers powering NewtonBotics.</p>
        <div className="mt-4 text-white/60">
          <span className="text-2xl font-bold text-red-500">{teamMembers.length}</span> team members
        </div>
      </motion.div>

      {/* Search and Filter Section */}
      <section className="py-8 bg-white/5 backdrop-blur-lg rounded-2xl max-w-7xl mx-auto mb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, skills, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/10 text-white placeholder:text-white/80"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80 w-5 h-5" />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/10 text-white"
              >
                <option value="all">All Roles</option>
                <option value="team_member">Team Members</option>
                <option value="mentor">Mentors</option>
                <option value="researcher">Researchers</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 w-5 h-5" />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/10 text-white"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 w-5 h-5" />
            </div>
          </div>
          
          {/* Results count and Clear Filters */}
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-white/60">
              Showing {filteredTotal} of {totalMembers} members
            </div>
            
            {/* Clear Filters Button */}
            {(searchTerm || filterRole !== 'all' || filterDepartment !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterRole('all');
                  setFilterDepartment('all');
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Leadership Team Section */}
      {filteredLeadership.length > 0 && (
        <section className="py-16 relative max-w-7xl mx-auto">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center mb-8"
            >
              <Award className="w-12 h-12 text-red-500 mr-4" />
              <h2 className="text-3xl font-bold text-white font-display">
                Leadership Team
              </h2>
              <span className="ml-4 text-white/60">({filteredLeadership.length})</span>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLeadership.map((leader, index) => (
                <PersonCard key={leader.id} person={leader} index={index} onImageClick={handleImageClick} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Researchers Section */}
      {filteredResearchers.length > 0 && (
        <section className="py-16 relative max-w-7xl mx-auto">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center mb-8"
            >
              <GraduationCap className="w-12 h-12 text-red-500 mr-4" />
              <h2 className="text-3xl font-bold text-white font-display">
                Research Team
              </h2>
              <span className="ml-4 text-white/60">({filteredResearchers.length})</span>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResearchers.map((researcher, index) => (
                <PersonCard key={researcher.id} person={researcher} index={index} onImageClick={handleImageClick} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mentors Section */}
      {filteredMentors.length > 0 && (
        <section className="py-16 relative max-w-7xl mx-auto">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center mb-8"
            >
              <Star className="w-12 h-12 text-red-500 mr-4" />
              <h2 className="text-3xl font-bold text-white font-display">
                Mentors & Advisors
              </h2>
              <span className="ml-4 text-white/60">({filteredMentors.length})</span>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors.map((mentor, index) => (
                <PersonCard key={mentor.id} person={mentor} index={index} onImageClick={handleImageClick} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team Members Section */}
      {filteredTeamMembers.length > 0 && (
        <section className="py-16 relative max-w-7xl mx-auto">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center mb-8"
            >
              <Users className="w-12 h-12 text-red-500 mr-4" />
              <h2 className="text-3xl font-bold text-white font-display">Team Members</h2>
              <span className="ml-4 text-white/60">({filteredTeamMembers.length})</span>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTeamMembers.map((member, index) => (
                <PersonCard key={member.id} person={member} index={index} compact onImageClick={handleImageClick} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team Statistics */}
      <section className="py-16 relative max-w-7xl mx-auto">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="flex items-center mb-8"
          >
            <Zap className="w-12 h-12 text-red-500 mr-4" />
            <h2 className="text-3xl font-bold text-white font-display">
              Team Overview
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 text-center border border-white/10"
            >
              <h3 className="text-4xl font-bold text-red-500 font-display">
                {leadershipTeam.length}
              </h3>
              <p className="text-white/80">Leadership</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 text-center border border-white/10"
            >
              <h3 className="text-4xl font-bold text-red-500 font-display">
                {researchers.length}
              </h3>
              <p className="text-white/80">Researchers</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 text-center border border-white/10"
            >
              <h3 className="text-4xl font-bold text-red-500 font-display">
                {mentors.length}
              </h3>
              <p className="text-white/80">Mentors</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 text-center border border-white/10"
            >
              <h3 className="text-4xl font-bold text-red-500 font-display">
                {teamMembers.length}
              </h3>
              <p className="text-white/80">Team Members</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 text-white hover:text-red-500 transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="w-8 h-8" />
          </button>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative max-w-2xl max-h-[80vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage}
              alt="Team member profile"
              width={600}
              height={600}
              className="w-full h-auto rounded-lg object-contain max-h-[80vh]"
              unoptimized
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// Person Card Component
const PersonCard = ({ person, index, compact = false, onImageClick }) => {
  const [imageError, setImageError] = useState(false);
  
  const getRoleColor = (role) => {
    switch (role) {
      case 'researcher': return 'text-blue-400';
      case 'mentor': return 'text-green-400';
      case 'team_member': return 'text-yellow-400';
      default: return 'text-white/80';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'researcher': return <GraduationCap className="w-4 h-4" />;
      case 'mentor': return <Star className="w-4 h-4" />;
      case 'team_member': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  // Generate initials for fallback avatar
  const getInitials = () => {
    if (!person.firstName && !person.lastName) return '?';
    const first = person.firstName ? person.firstName.charAt(0) : '';
    const last = person.lastName ? person.lastName.charAt(0) : '';
    return (first + last).toUpperCase();
  };

  // Generate a consistent color based on the person's name
  const getAvatarColor = () => {
    const colors = [
      'from-red-500 to-red-600',
      'from-blue-500 to-blue-600', 
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-yellow-500 to-yellow-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600'
    ];
    const colorIndex = (person.firstName?.charCodeAt(0) || 0) % colors.length;
    return colors[colorIndex];
  };

  // Format subroles for display
  const formatSubroles = (subroles) => {
    if (!subroles || subroles.length === 0) return null;
    
    // Convert snake_case to Title Case and join with commas
    return subroles
      .map(subrole => subrole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
      .join(', ');
  };

  // Get the display role text
  const getDisplayRole = () => {
    // For leadership team, show subroles if available
    if (person.subroles && person.subroles.length > 0) {
      return formatSubroles(person.subroles);
    }
    
    // Fallback to formatted role
    return person.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02, y: -5 }}
      className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer ${
        compact ? 'text-center' : ''
      }`}
    >
      {/* Profile Image */}
      <div 
        className={`mx-auto mb-4 rounded-full overflow-hidden cursor-pointer transition-transform hover:scale-105 ${
          compact ? 'w-24 h-24' : 'w-32 h-32'
        }`}
        onClick={() => {
          if (onImageClick && !imageError && person.profileImageUrl) {
            onImageClick(person.profileImageUrl);
          }
        }}
      >
        {imageError || !person.profileImageUrl ? (
          // Fallback avatar with initials
          <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor()} flex items-center justify-center text-white font-bold ${
            compact ? 'text-2xl' : 'text-3xl'
          }`}>
            {getInitials()}
          </div>
        ) : (
          <Image
            src={person.profileImageUrl}
            alt={person.fullName}
            width={compact ? 96 : 128}
            height={compact ? 96 : 128}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
        )}
      </div>

      {/* Basic Info */}
      <div className={compact ? 'text-center' : ''}>
        <h3 className={`font-semibold text-white font-display ${
          compact ? 'text-lg' : 'text-xl'
        }`}>
          {person.fullName}
        </h3>
        
        <div className="flex items-center justify-center gap-2 mt-2">
          {getRoleIcon(person.role)}
          <span className={`text-sm font-medium ${getRoleColor(person.role)}`}>
            {getDisplayRole()}
          </span>
        </div>

        {person.specialization && (
          <p className="text-white/70 text-sm mt-2 line-clamp-2">
            {person.specialization}
          </p>
        )}

        {/* Department and Email row */}
        {(person.department || person.email) && (
          <div className="flex items-center justify-between mt-3">
            {/* Department on the left */}
            {person.department ? (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Building2 className="w-4 h-4" />
                <span>{person.department}</span>
              </div>
            ) : (
              <div></div>
            )}
            
            {/* Email icon on the right */}
            {person.email && (
              <a 
                href={`mailto:${person.email}`}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors text-red-400 hover:text-red-300"
                title={`Email ${person.fullName}: ${person.email}`}
              >
                <Mail className="w-5 h-5" />
              </a>
            )}
          </div>
        )}

        {person.experienceYears && (
          <div className="flex items-center gap-2 mt-2 text-white/60 text-sm">
            <Clock className="w-4 h-4" />
            <span>{person.experienceYears} years experience</span>
          </div>
        )}

        {/* Skills (only show for non-compact cards) */}
        {!compact && person.skills && person.skills.length > 0 && (
          <div className="mt-4">
            <p className="text-white/60 text-sm mb-2">Skills:</p>
            <div className="flex flex-wrap gap-2">
              {person.skills.slice(0, 4).map((skill, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
              {person.skills.length > 4 && (
                <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">
                  +{person.skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Social Links */}
        {person.socialLinks && Object.keys(person.socialLinks).length > 0 && (
          <div className="flex justify-center gap-3 mt-4">
            {person.socialLinks.linkedin && (
              <a 
                href={person.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {person.socialLinks.github && (
              <a 
                href={person.socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            )}
            {person.socialLinks.portfolio && (
              <a 
                href={person.socialLinks.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                <Globe className="w-5 h-5" />
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TeamPage;

