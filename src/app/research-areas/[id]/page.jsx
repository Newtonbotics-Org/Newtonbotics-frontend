"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Brain, Box, Layout, ArrowLeft, Users, Calendar, Award, ExternalLink, User, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { API_BASE_URL } from "@/lib/api";

const ResearchAreaDetail = () => {
  const params = useParams();
  const router = useRouter();
  const [researchArea, setResearchArea] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const fetchResearchArea = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/research-areas/${params.id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch research area');
        const data = await res.json();
        if (data.success) {
          setResearchArea(data.data.item);
        } else {
          throw new Error(data.message || 'Failed to fetch research area');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchResearchArea();
    }
  }, [params.id, API_BASE_URL]);

  // Fetch team members when studentIds are available
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!researchArea || !researchArea.studentIds || researchArea.studentIds.length === 0) {
        setTeamMembers([]);
        setLoadingMembers(false);
        return;
      }

      try {
        setLoadingMembers(true);
        console.log('Fetching team members for studentIds:', researchArea.studentIds);
        
        // Fetch user details for each student ID using the public team-members endpoint
        const memberPromises = researchArea.studentIds.map(async (studentId) => {
          try {
            const url = `${API_BASE_URL}/public/team-members/${studentId}`;
            console.log(`Fetching from: ${url}`);
            
            const res = await fetch(url, { 
              cache: 'no-store'
            });
            
            console.log(`Response status for ${studentId}:`, res.status, res.statusText);
            
            if (res.ok) {
              const data = await res.json();
              console.log(`Full response data for ${studentId}:`, JSON.stringify(data, null, 2));
              
              // Try different response structures
              const userData = data.data?.item || data.data?.user || data.item || data.user || (data.success && data.data);
              
              if (userData) {
                console.log(`Successfully extracted user data for ${studentId}:`, userData);
                console.log(`Email field in userData:`, userData.email, 'Full userData keys:', Object.keys(userData));
                return userData;
              } else {
                console.warn(`No user data found in response for ${studentId}. Response structure:`, data);
              }
            } else {
              // Try to get error message from response
              let errorMessage = res.statusText;
              try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorData.error || res.statusText;
                console.error(`Error response for ${studentId}:`, errorData);
              } catch (e) {
                console.error(`Failed to parse error response for ${studentId}:`, e);
              }
              console.warn(`Failed to fetch user ${studentId}: ${res.status} - ${errorMessage}`);
            }
            return null;
          } catch (err) {
            console.error(`Error fetching user ${studentId}:`, err);
            return null;
          }
        });

        const members = await Promise.all(memberPromises);
        const validMembers = members.filter(member => member !== null && member !== undefined);
        console.log('Fetched team members:', validMembers);
        console.log('Total valid members:', validMembers.length);
        setTeamMembers(validMembers);
      } catch (err) {
        console.error('Error fetching team members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchTeamMembers();
  }, [researchArea, API_BASE_URL]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading research area...</p>
        </div>
      </div>
    );
  }

  if (error || !researchArea) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Research Area Not Found</h1>
          <p className="text-white/60 mb-6">{error || 'The research area you are looking for does not exist.'}</p>
          <Link href="/research-areas">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

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
console.log(researchArea,'researchArea');
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-black border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/research-areas">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </motion.button>
            </Link>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-6"
          >
            <div className="bg-gradient-to-br from-white/10 to-red-500/10 p-4 rounded-2xl">
              {getCategoryIcon(researchArea.category)}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{researchArea.name}</h1>
              <p className="text-xl text-white/60">{researchArea.category}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-2xl font-bold mb-4 text-white">Description</h2>
              <p className="text-white/80 leading-relaxed text-lg">{researchArea.description}</p>
            </motion.div>

            {/* Focus Areas */}
            {researchArea.focusAreas && researchArea.focusAreas.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-2xl font-bold mb-4 text-white">Focus Areas</h2>
                <div className="flex flex-wrap gap-3">
                  {researchArea.focusAreas.map((focus, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-sm border border-red-500/30 font-medium"
                    >
                      {focus}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Keywords */}
            {researchArea.keywords && researchArea.keywords.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-2xl font-bold mb-4 text-white">Keywords</h2>
                <div className="flex flex-wrap gap-3">
                  {researchArea.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-white/10 text-white/80 rounded-full text-sm border border-white/20"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Required Equipment */}
            {researchArea.requiredEquipment && researchArea.requiredEquipment.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-2xl font-bold mb-4 text-white">Required Equipment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {researchArea.requiredEquipment.map((equipment, index) => (
                    <div key={index} className="flex items-center gap-3 text-white/80 p-3 bg-white/5 rounded-lg">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span className="font-medium">{equipment}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Required Skills */}
            {researchArea.requiredSkills && researchArea.requiredSkills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-2xl font-bold mb-4 text-white">Required Skills</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {researchArea.requiredSkills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-3 text-white/80 p-3 bg-white/5 rounded-lg">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="font-medium">{skill}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Collaboration Opportunities */}
            {researchArea.collaborationOpportunities && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-2xl font-bold mb-4 text-white">Collaboration Opportunities</h2>
                <p className="text-white/80 leading-relaxed text-lg">{researchArea.collaborationOpportunities}</p>
              </motion.div>
            )}

            {/* Funding Information */}
            {researchArea.fundingInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-2xl font-bold mb-4 text-white">Funding Information</h2>
                <p className="text-white/80 leading-relaxed text-lg">{researchArea.fundingInfo}</p>
              </motion.div>
            )}

            {/* External Links */}
            {researchArea.externalLinks && researchArea.externalLinks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                  <ExternalLink className="w-6 h-6 text-red-400" />
                  External Links
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {researchArea.externalLinks.map((link, index) => {
                    // Extract domain from URL for display
                    const getDomain = (url) => {
                      try {
                        const urlObj = new URL(url);
                        return urlObj.hostname.replace('www.', '');
                      } catch {
                        return url;
                      }
                    };

                    return (
                    <a
                        key={link._id || index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                        className="group block p-5 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl border border-white/10 hover:border-red-400/30 hover:from-white/10 hover:to-white/5 transition-all duration-300 hover:shadow-lg hover:shadow-red-400/10"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-red-400/10 group-hover:bg-red-400/20 flex items-center justify-center transition-colors group-hover:scale-110">
                              <ExternalLink className="w-6 h-6 text-red-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors mb-2 text-lg">
                              {link.title || 'External Link'}
                            </h3>
                            {link.description && (
                              <p className="text-white/60 text-sm mb-3 line-clamp-2">
                                {link.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white/40 text-xs font-mono truncate max-w-[200px]">
                                {getDomain(link.url)}
                              </span>
                              <span className="text-white/20 text-xs">•</span>
                              <span className="text-red-400/60 text-xs font-medium group-hover:text-red-400 transition-colors flex items-center gap-1">
                                Open link
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-bold mb-4 text-white">Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-red-400" />
                    <span className="text-white/80">Team Members</span>
                  </div>
                  <span className="text-2xl font-bold text-red-400">{researchArea.memberCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-red-400" />
                    <span className="text-white/80">Publications</span>
                  </div>
                  <span className="text-2xl font-bold text-red-400">{researchArea.publicationCount || 0}</span>
                </div>
                {/* <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-red-400" />
                    <span className="text-white/80">Active Projects</span>
                  </div>
                  <span className="text-2xl font-bold text-red-400">{researchArea.projectCount || 0}</span>
                </div> */}
              </div>
            </motion.div>

            {/* Team Members */}
            {researchArea.studentIds && researchArea.studentIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-400" />
                  Team Members
                  <span className="text-base font-normal text-white/60 ml-1">
                    ({researchArea.memberCount !== undefined ? researchArea.memberCount : researchArea.studentIds.length})
                  </span>
                </h3>
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                    <span className="ml-2 text-white/60 text-sm">Loading...</span>
                  </div>
                ) : teamMembers.length > 0 ? (
                  <div className="space-y-3">
                    {teamMembers.map((member, index) => {
                      // Get display name - handle various field names
                      const displayName = member.fullName || 
                                        `${member.firstName || ''} ${member.lastName || ''}`.trim() || 
                                        member.displayName ||
                                        member.userName ||
                                        member.email || 
                                        'Team Member';
                      
                      // Get role/department - format role for display, prioritize specialization/department
                      let roleOrDept = member.specialization || member.department;
                      if (!roleOrDept && member.role) {
                        // Format role: "team_member" -> "Team Member", "project_manager" -> "Project Manager"
                        roleOrDept = member.role
                          .split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                      }
                      // Also check subroles
                      if (!roleOrDept && member.subroles && member.subroles.length > 0) {
                        roleOrDept = member.subroles[0]
                          .split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                      }
                      
                      // Get profile image
                      const profileImage = member.profileImageUrl || member.avatar || member.profileImage;
                      
                      // Get email - try multiple field names and nested structures
                      const email = member.email || 
                                   member.userId?.email || 
                                   member.contactEmail ||
                                   member.publicEmail ||
                                   member.contact?.email ||
                                   (member.profile && member.profile.email) ||
                                   (member.user && member.user.email);
                      
                      // Debug: Log member data to see what fields are available
                      if (!email) {
                        console.log(`No email found for member ${displayName}:`, member);
                        console.log(`Available fields:`, Object.keys(member));
                      } else {
                        console.log(`Email found for ${displayName}:`, email);
                      }
                      
                      return (
                        <div
                          key={member._id || member.id || index}
                          className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            {profileImage ? (
                              <Image
                                src={profileImage}
                                alt={displayName + ' avatar'}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-red-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white text-sm">{displayName}</div>
                              {roleOrDept && (
                                <div className="text-white/60 text-xs mt-0.5">{roleOrDept}</div>
                              )}
                              {email && (
                                <a
                                  href={`mailto:${email}`}
                                  className="text-white/60 text-xs hover:text-white/80 mt-1.5 flex items-center gap-1.5"
                                >
                                  <Mail className="w-3 h-3 flex-shrink-0" />
                                  <span className="break-all">{email}</span>
                                </a>
                              )}
                              {member.skills && member.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {member.skills.map((skill, skillIndex) => (
                                    <span key={skillIndex} className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white/80">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-white/60 text-sm">
                    <Users className="w-8 h-8 mx-auto mb-2 text-white/40" />
                    <p>Unable to load team member details</p>
                    <p className="text-xs text-white/40 mt-1">
                      {researchArea.studentIds.length} member{researchArea.studentIds.length !== 1 ? 's' : ''} assigned
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Timestamps */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-bold mb-4 text-white">Timeline</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-white/60">Created</div>
                  <div className="text-white font-medium">
                    {new Date(researchArea.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-white/60">Last Updated</div>
                  <div className="text-white font-medium">
                    {new Date(researchArea.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
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
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: researchArea.name,
                        text: researchArea.description,
                        url: window.location.href
                      });
                    }
                  }}
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

export default ResearchAreaDetail;
