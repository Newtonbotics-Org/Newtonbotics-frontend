// components/Navbar.js
"use client";
import { useState, useEffect, useRef } from "react";
import { FiMenu, FiX, FiChevronDown, FiUser, FiPackage, FiList, FiLogOut, FiSettings, FiFileText, FiShield, FiBookOpen } from "react-icons/fi";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import { NEWTONBOTICS_LOGO, NEWTONBOTICS_LOGO_WIDTH, NEWTONBOTICS_LOGO_HEIGHT } from "@/lib/branding";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isProjectLeader, setIsProjectLeader] = useState(false);
  const profileRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  
  const { user, isAuthenticated, logout, hasRole, hasPermission, hasSubrole } = useAuth();

  const toggleMenu = () => setIsOpen((s) => !s);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined") return;
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const onClickAway = (e) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  // Close mobile menu on scroll
  useEffect(() => {
    const handleScrollClose = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("scroll", handleScrollClose);
    return () => window.removeEventListener("scroll", handleScrollClose);
  }, [isOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Check if user is a project leader
  useEffect(() => {
    const checkIfProjectLeader = async () => {
      if (!isAuthenticated || !user) {
        setIsProjectLeader(false);
        return;
      }

      // Only check for team-members
      if (!hasRole('team_member')) {
        setIsProjectLeader(false);
        return;
      }

      try {
        const userId = user.id || user._id;
        
        if (!userId) {
          setIsProjectLeader(false);
          return;
        }

        // Fetch projects to check if user is a leader
        const response = await fetch(`${API_BASE_URL}/projects?limit=100`, { 
          cache: 'no-store' 
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.projects) {
            const projects = data.data.projects || [];
            // Check if user is a leader of any project
            const isLeader = projects.some(project => {
              if (!project.teamLeaderId) return false;
              // Handle both populated object and ID string
              const leaderId = typeof project.teamLeaderId === 'object' 
                ? (project.teamLeaderId.id || project.teamLeaderId._id)
                : project.teamLeaderId;
              return leaderId === userId || leaderId?.toString() === userId?.toString();
            });
            setIsProjectLeader(isLeader);
          } else {
            setIsProjectLeader(false);
          }
        } else {
          setIsProjectLeader(false);
        }
      } catch (error) {
        console.error('Error checking project leader status:', error);
        setIsProjectLeader(false);
      }
    };

    checkIfProjectLeader();
  }, [isAuthenticated, user, hasRole]);

  const isLoggedIn = isAuthenticated && user;
  // Full admin: role-based or project leaders
  const isAdmin = isLoggedIn && (
    hasRole('admin') || 
    hasRole('mentor') || 
    hasRole('researcher') || 
    hasPermission('admin:access') ||
    (hasRole('team_member') && isProjectLeader)
  );
  // Scoped admin panel access (e.g. Event Manager can open the panel for events)
  const canOpenAdminPanel = isLoggedIn && (
    isAdmin ||
    hasSubrole('event_manager')
  );

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfile(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => {
    if (path === "/DashBoard" || path === "/") {
      return pathname === "/DashBoard" || pathname === "/";
    }
    return pathname === path;
  };

  const getActiveStyles = (path) =>
    isActive(path)
      ? "text-red-500 font-semibold border-b-2 border-red-500"
      : "text-white hover:text-red-500 transition";

  const getMobileActiveStyles = (path) =>
    isActive(path)
      ? "block py-2 px-4 text-red-500 font-semibold bg-red-900/50 border-l-4 border-red-500 transition"
      : "block py-2 px-4 text-white hover:bg-red-900 transition";

  const avatarLabel = user ? (user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()) : "U";
  const displayName = user ? (user.firstName ? `${user.firstName} ${user.lastName}` : user.email) : "User";
  const userRole = user ? user.role : "Member";
  const userSubroles = user?.subroles || [];
  const userRoleDisplay = userRole?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Member';
  const userAvatarUrl = user && user.profileImageUrl && /^https?:\/\//i.test(user.profileImageUrl) ? user.profileImageUrl : null;

  return (
    <nav
      className={`sticky top-0 z-[100] w-full transition-all duration-300 ${
        isScrolled ? "bg-black backdrop-blur-lg" : "bg-black"
      }`}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative">
        {/* Logo */}
        <div className="flex items-center">
          <Link
            href="/DashBoard"
            className="flex items-center gap-3 hover:opacity-90 transition"
          >
            <Image
              src={NEWTONBOTICS_LOGO}
              alt="NewtonBotics"
              width={NEWTONBOTICS_LOGO_WIDTH}
              height={NEWTONBOTICS_LOGO_HEIGHT}
              className="w-44 sm:w-52 h-auto object-contain"
              priority
              fetchPriority="high"
              unoptimized
              sizes="(max-width: 640px) 11rem, 13rem"
            />
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link href="/DashBoard" className={`${getActiveStyles("/DashBoard")} pb-1`}>
            Home
          </Link>
          <Link href="/aboutus" className={`${getActiveStyles("/aboutus")} pb-1`}>
            About Us
          </Link>
          <Link href="/Projects" className={`${getActiveStyles("/Projects")} pb-1`}>
            Projects
          </Link>
          {/* <Link href="/Workshops" className={`${getActiveStyles("/Workshops")} pb-1`}>
            Workshops
          </Link> */}
          <Link href="/Events" className={`${getActiveStyles("/Events")} pb-1`}>
            Events
          </Link>
          <Link href="/News" className={`${getActiveStyles("/News")} pb-1`}>
            News
          </Link>
          <Link href="/ourTeam" className={`${getActiveStyles("/ourTeam")} pb-1`}>
            Team
          </Link>
          <Link href="/Gallery" className={`${getActiveStyles("/Gallery")} pb-1`}>
            Gallery
          </Link>
          <Link href="/contact" className={`${getActiveStyles("/contact")} pb-1`}>
            Contact Us
          </Link>

          {/* Auth area */}
          {!isLoggedIn ? (
            <Link
              href="/auth"
              className="inline-block px-4 py-2 bg-red-600 text-white nb-chamfer hover:bg-red-700 transition"
            >
              Sign in
            </Link>
          ) : (
            <div
              className="relative group"
              ref={profileRef}
              onMouseEnter={() => setShowProfile(true)}
              onMouseLeave={() => setShowProfile(false)}
            >
              <button
                className="flex items-center gap-2 px-3 py-2 bg-white/10 text-white nb-chamfer border border-white/20 hover:bg-white/20 transition"
                aria-haspopup="menu"
                aria-expanded={showProfile}
              >
                {userAvatarUrl ? (
                  <span className="w-7 h-7 rounded-full overflow-hidden border border-white/20 bg-white/10">
                    <img src={userAvatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </span>
                ) : (
                  <span className="w-7 h-7 rounded-full bg-red-600 grid place-items-center text-sm font-bold">
                    {avatarLabel}
                  </span>
                )}
                <span className="hidden lg:inline text-sm">Profile</span>
                <FiChevronDown className={`hidden lg:inline transition-transform ${showProfile ? "rotate-180" : "rotate-0"}`} />
              </button>

              {/* Dropdown */}
              <div
                className={`invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 absolute right-0 mt-3 w-64 rounded-md border border-white/10 bg-black shadow-2xl ring-1 ring-white/10 ${showProfile ? "visible opacity-100 translate-y-0" : ""}`}
                role="menu"
              >
                {/* Arrow */}
                <div className="absolute -top-2 right-6 w-3 h-3 rotate-45 bg-neutral-900 border-t border-l border-white/10"></div>

                <div className="px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    {userAvatarUrl ? (
                      <span className="w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-white/10">
                        <img src={userAvatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </span>
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-red-600 grid place-items-center text-sm font-bold"><FiUser /></span>
                    )}
                    <div className="text-sm">
                      <div className="text-white/90 font-medium truncate max-w-[12rem]">{displayName}</div>
                      <div className="text-white/50 text-xs">
                        <span className="capitalize">{userRoleDisplay}</span>
                        {userSubroles.length > 0 && (
                          <>
                            <span className="text-white/30 mx-1">•</span>
                            <span className="text-white/40">
                              {userSubroles.slice(0, 1).map(subrole => 
                                subrole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                              ).join(', ')}
                              {userSubroles.length > 1 && ` +${userSubroles.length - 1}`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {canOpenAdminPanel && (
                  <div className="py-1">
                    <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-white/40">Admin Tools</div>
                    <a
                      href="https://newtonbotics-admin-pannel.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 text-white/90 hover:bg-white/10"
                      onClick={() => setShowProfile(false)}
                    >
                      <FiShield /> Admin Panel
                    </a>
                  </div>
                )}

                {(isAdmin || hasRole('team_member') || hasSubrole('inventory_manager') || hasSubrole('inventory_management')) && (
                  <div className="py-1">
                    <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-white/40">Tools</div>
                    <Link
                      href="/Inventory"
                      className="flex items-center gap-2 px-4 py-2 text-white/90 hover:bg-white/10"
                      onClick={() => setShowProfile(false)}
                    >
                      <FiPackage /> Inventory
                    </Link>
                  </div>
                )}

                <div className="border-t border-white/10">
                  <Link
                    href="/Resources"
                    className="flex items-center gap-2 px-4 py-2 text-white/90 hover:bg-white/10"
                    onClick={() => setShowProfile(false)}
                  >
                    <FiBookOpen /> Resources
                  </Link>
                  <Link
                    href="/my-activity"
                    className="flex items-center gap-2 px-4 py-2 text-white/90 hover:bg-white/10"
                    onClick={() => setShowProfile(false)}
                  >
                    <FiList /> My Activity
                  </Link>
                  <Link
                    href="/projectRequest"
                    className="flex items-center gap-2 px-4 py-2 text-white/90 hover:bg-white/10"
                    onClick={() => setShowProfile(false)}
                  >
                    <FiFileText /> Project Request
                  </Link>
                  {/* <Link
                    href="/ChatRoom"
                    className="flex items-center gap-2 px-4 py-2 text-white/90 hover:bg-white/10"
                    onClick={() => setShowProfile(false)}
                  >
                    <FiList /> Chat Room
                  </Link> */}
                  <Link
                    href="/ProfileCompletion"
                    className="flex items-center gap-2 px-4 py-2 text-white/90 hover:bg-white/10"
                    onClick={() => setShowProfile(false)}
                  >
                    <FiSettings /> Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-white/80 hover:bg-white/10"
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-2xl text-white focus:outline-none"
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute w-full transition-all duration-300 ease-in-out bg-black/95 backdrop-blur-lg shadow-2xl mobile-menu-scroll ${
          isOpen ? "max-h-[calc(100vh-5rem)] overflow-y-auto" : "max-h-0 overflow-hidden"
        }`}
        style={{ 
          zIndex: 90,
          scrollbarWidth: 'thin',
          scrollbarColor: '#ef4444 transparent'
        }}
      >
        <div className="py-2 min-h-0">
          <Link href="/DashBoard" className={getMobileActiveStyles("/DashBoard")} onClick={() => setIsOpen(false)}>Home</Link>
          <Link href="/aboutus" className={getMobileActiveStyles("/aboutus")} onClick={() => setIsOpen(false)}>About Us</Link>
          <Link href="/Projects" className={getMobileActiveStyles("/Projects")} onClick={() => setIsOpen(false)}>Projects</Link>
          {/* <Link href="/Workshops" className={getMobileActiveStyles("/Workshops")} onClick={() => setIsOpen(false)}>Workshops</Link> */}
          <Link href="/Events" className={getMobileActiveStyles("/Events")} onClick={() => setIsOpen(false)}>Events</Link>
          <Link href="/News" className={getMobileActiveStyles("/News")} onClick={() => setIsOpen(false)}>News</Link>
          <Link href="/ourTeam" className={getMobileActiveStyles("/ourTeam")} onClick={() => setIsOpen(false)}>Team</Link>
          <Link href="/Gallery" className={getMobileActiveStyles("/Gallery")} onClick={() => setIsOpen(false)}>Gallery</Link>
          <Link href="/contact" className={getMobileActiveStyles("/contact")} onClick={() => setIsOpen(false)}>Contact Us</Link>

          {/* Mobile Profile Section */}
          {!isLoggedIn ? (
            <Link
              href="/auth"
              className="block mx-4 my-3 py-2 bg-red-600 text-white text-center nb-chamfer hover:bg-red-700 transition"
              onClick={() => setIsOpen(false)}
            >
              Sign in
            </Link>
          ) : (
            <div className="mx-2 my-2 rounded-lg border border-white/10 bg-black/40">
              <div className="px-4 py-3 text-white/80 text-sm border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  {userAvatarUrl ? (
                    <span className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-white/10 flex-shrink-0">
                      <img src={userAvatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </span>
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-red-600 grid place-items-center text-sm font-bold flex-shrink-0">
                      {avatarLabel}
                    </span>
                  )}
                  <div>
                    <div className="font-medium text-white">{displayName}</div>
                    <div className="text-white/60 text-xs">
                      <span className="capitalize">{userRoleDisplay}</span>
                      {userSubroles.length > 0 && (
                        <>
                          <span className="text-white/40 mx-1">•</span>
                          <span className="text-white/50">
                            {userSubroles.slice(0, 1).map(subrole => 
                              subrole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                            ).join(', ')}
                            {userSubroles.length > 1 && ` +${userSubroles.length - 1}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {canOpenAdminPanel && (
                <>
                  <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-white/40 bg-white/5">Admin Tools</div>
                  <a
                    href="https://newtonbotics-admin-pannel.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 py-2 px-4 text-white hover:bg-red-900 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    <FiShield className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </a>
                </>
              )}

              {(isAdmin || hasRole('team_member') || hasSubrole('inventory_manager') || hasSubrole('inventory_management')) && (
                <>
                  <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-white/40 bg-white/5">Tools</div>
                  <Link 
                    href="/Inventory" 
                    className="flex items-center gap-3 py-2 px-4 text-white hover:bg-red-900 transition" 
                    onClick={() => setIsOpen(false)}
                  >
                    <FiPackage className="w-4 h-4" />
                    <span>Inventory</span>
                  </Link>
                </>
              )}
              
              <div className="border-t border-white/10">
                <Link
                  href="/Resources"
                  className="flex items-center gap-3 py-2 px-4 text-white hover:bg-red-900 transition"
                  onClick={() => setIsOpen(false)}
                >
                  <FiBookOpen className="w-4 h-4" />
                  <span>Resources</span>
                </Link>
                <Link
                  href="/my-activity"
                  className="flex items-center gap-3 py-2 px-4 text-white hover:bg-red-900 transition" 
                  onClick={() => setIsOpen(false)}
                >
                  <FiList className="w-4 h-4" />
                  <span>My Activity</span>
                </Link>
                <Link 
                  href="/projectRequest" 
                  className="flex items-center gap-3 py-2 px-4 text-white hover:bg-red-900 transition" 
                  onClick={() => setIsOpen(false)}
                >
                  <FiFileText className="w-4 h-4" />
                  <span>Project Request</span>
                </Link>
                <Link 
                  href="/ProfileCompletion" 
                  className="flex items-center gap-3 py-2 px-4 text-white hover:bg-red-900 transition" 
                  onClick={() => setIsOpen(false)}
                >
                  <FiSettings className="w-4 h-4" />
                  <span>Profile Settings</span>
                </Link>
              </div>
              
              <button
                onClick={() => { handleLogout(); setIsOpen(false); }}
                className="flex items-center justify-center gap-2 w-[calc(100%-2rem)] mx-4 my-3 py-2 bg-white/10 text-white text-center rounded-lg hover:bg-white/20 transition border border-white/20"
              >
                <FiLogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
