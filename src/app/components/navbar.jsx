"use client";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  FileText,
  List,
  LogIn,
  LogOut,
  Menu,
  Package,
  Settings,
  Shield,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL, apiRequest } from "@/lib/api";
import { ADMIN_PANEL_URL } from "@/lib/site";
import { optimizeImageUrl } from "@/lib/cloudinaryMedia";

const NAV_LINKS = [
  { href: "/Projects", label: "Projects" },
  { href: "/research-areas", label: "Research" },
  { href: "/Events", label: "Events" },
  { href: "/ourTeam", label: "Team" },
  { href: "/News", label: "News" },
  { href: "/Gallery", label: "Gallery" },
  { href: "/aboutus", label: "About" },
  { href: "/contact", label: "Contact" },
];

const formatRole = (value) =>
  value?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isProjectLeader, setIsProjectLeader] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);
  const navRef = useRef(null);
  const pathname = usePathname();

  const { user, isAuthenticated, logout, hasRole, hasPermission, hasSubrole } = useAuth();

  useEffect(() => {
    const onClickAway = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowProfile(false);
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Sync real navbar height for overlays (gallery lightbox, etc.)
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const syncNavHeight = () => {
      document.documentElement.style.setProperty("--nb-nav-height", `${nav.offsetHeight}px`);
    };
    syncNavHeight();
    const observer = new ResizeObserver(syncNavHeight);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  // The glass gets a little denser once the page scrolls under it
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setIsOpen(false);
    setShowProfile(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Check if user is a project leader
  useEffect(() => {
    const checkIfProjectLeader = async () => {
      if (!isAuthenticated || !user || !hasRole("team_member")) {
        setIsProjectLeader(false);
        return;
      }
      try {
        const userId = user.id || user._id;
        if (!userId) {
          setIsProjectLeader(false);
          return;
        }
        const response = await apiRequest(`${API_BASE_URL}/projects?limit=100`, { cache: "no-store" });
        if (!response.ok) {
          setIsProjectLeader(false);
          return;
        }
        const data = await response.json();
        const projects = (data.success && data.data?.projects) || [];
        const isLeader = projects.some((project) => {
          if (!project.teamLeaderId) return false;
          const leaderId =
            typeof project.teamLeaderId === "object"
              ? project.teamLeaderId.id || project.teamLeaderId._id
              : project.teamLeaderId;
          return leaderId === userId || leaderId?.toString() === userId?.toString();
        });
        setIsProjectLeader(isLeader);
      } catch (error) {
        console.error("Error checking project leader status:", error);
        setIsProjectLeader(false);
      }
    };
    checkIfProjectLeader();
  }, [isAuthenticated, user, hasRole]);

  const isLoggedIn = isAuthenticated && user;
  // Full admin: role-based or project leaders
  const isAdmin =
    isLoggedIn &&
    (hasRole("admin") ||
      hasRole("mentor") ||
      hasRole("researcher") ||
      hasPermission("admin:access") ||
      (hasRole("team_member") && isProjectLeader));
  // Scoped admin panel access (e.g. Event Manager can open the panel for events)
  const canOpenAdminPanel = isLoggedIn && (isAdmin || hasSubrole("event_manager"));
  const canUseInventory =
    isAdmin ||
    hasRole("team_member") ||
    hasSubrole("inventory_manager") ||
    hasSubrole("inventory_management");

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfile(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isActive = (path) => pathname === path || pathname?.startsWith(`${path}/`);

  const avatarLabel = user
    ? (user.firstName || user.email || "U").charAt(0).toUpperCase()
    : "U";
  const displayName = user
    ? user.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : user.email
    : "User";
  const userSubroles = user?.subroles || [];
  const userRoleDisplay = formatRole(user?.role) || "Member";
  const subroleSummary =
    userSubroles.length > 0
      ? `${formatRole(userSubroles[0])}${userSubroles.length > 1 ? ` +${userSubroles.length - 1}` : ""}`
      : null;
  const userAvatarUrl =
    user && user.profileImageUrl && /^https?:\/\//i.test(user.profileImageUrl)
      ? user.profileImageUrl
      : null;

  const memberLinks = [
    ...(canUseInventory ? [{ href: "/Inventory", label: "Lab inventory", icon: Package }] : []),
    { href: "/Resources", label: "Resources", icon: BookOpen },
    { href: "/my-activity", label: "My activity", icon: List },
    { href: "/projectRequest", label: "Pitch a project", icon: FileText },
    { href: "/ProfileCompletion", label: "Profile settings", icon: Settings },
  ];

  const Avatar = ({ size = "h-8 w-8" }) =>
    userAvatarUrl ? (
      <span className={`${size} shrink-0 overflow-hidden rounded-full border border-white/20`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic Cloudinary avatar URL; next/image requires explicit remote domains */}
        <img
          src={optimizeImageUrl(userAvatarUrl, { width: 40, height: 40, crop: "fill" })}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </span>
    ) : (
      <span
        className={`${size} grid shrink-0 place-items-center rounded-full bg-signal text-sm font-semibold text-ink`}
      >
        {avatarLabel}
      </span>
    );

  return (
    <header
      ref={navRef}
      className="pointer-events-none sticky top-0 z-[100] w-full px-3 pt-3 sm:px-4"
    >
      {/* Floating crystal bar: the page shows through, blurred, as it scrolls underneath */}
      <div
        className={`nb-glass pointer-events-auto relative mx-auto flex min-h-[60px] max-w-[1280px] items-center justify-between gap-6 rounded-2xl py-2 pl-4 pr-2.5 ${
          scrolled ? "nb-glass-scrolled" : ""
        }`}
      >
        <Link href="/" aria-label="NewtonBotics home" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static logo, sized explicitly */}
          <img
            src="/brand/newtonbotics-logo-red.webp"
            alt="NewtonBotics"
            width={420}
            height={111}
            className="block h-8 w-auto sm:h-9"
          />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-night-text shadow-[inset_0_-2px_0_#FF5A1F]"
                    : "text-night-muted hover:bg-white/5 hover:text-night-text"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {!isLoggedIn ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setShowProfile((s) => !s)}
                className="nb-btn nb-btn-sm nb-btn-accent rounded-xl shadow-[0_0_24px_rgba(255,90,31,0.35)]"
                aria-haspopup="menu"
                aria-expanded={showProfile}
              >
                Join the lab
                <ChevronDown size="1em"
                  aria-hidden="true"
                  className={`transition-transform ${showProfile ? "rotate-180" : ""}`}
                />
              </button>
              {showProfile && (
                <div
                  role="menu"
                  className="nb-glass-menu absolute right-0 mt-3 w-72 overflow-hidden rounded-xl p-1.5"
                >
                  <Link
                    role="menuitem"
                    href="/auth?tab=signup"
                    className="flex items-start gap-3 rounded-lg px-3 py-3 text-night-text no-underline hover:bg-white/5"
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-signal text-ink">
                      <ArrowRight size="1em" aria-hidden="true" />
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">Create an account</span>
                      <span className="text-[13px] text-night-muted">New here? Join with your university email.</span>
                    </span>
                  </Link>
                  <Link
                    role="menuitem"
                    href="/auth?tab=signin"
                    className="flex items-start gap-3 rounded-lg px-3 py-3 text-night-text no-underline hover:bg-white/5"
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/15 text-night-text">
                      <LogIn size="1em" aria-hidden="true" />
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">Sign in</span>
                      <span className="text-[13px] text-night-muted">Already a member? Welcome back.</span>
                    </span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setShowProfile((s) => !s)}
                className="flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 pl-1.5 pr-3 text-sm font-medium text-night-text transition-colors hover:border-white/40"
                aria-haspopup="menu"
                aria-expanded={showProfile}
              >
                <Avatar />
                <span className="max-w-[9rem] truncate">{user.firstName || "Account"}</span>
                <ChevronDown size="1em"
                  aria-hidden="true"
                  className={`transition-transform ${showProfile ? "rotate-180" : ""}`}
                />
              </button>

              {showProfile && (
                <div
                  role="menu"
                  className="nb-glass-menu absolute right-0 mt-3 w-72 overflow-hidden rounded-xl"
                >
                  <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
                    <Avatar size="h-10 w-10" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-night-text">{displayName}</div>
                      <div className="truncate font-mono text-[11px] uppercase tracking-[0.04em] text-night-muted">
                        {userRoleDisplay}
                        {subroleSummary && ` · ${subroleSummary}`}
                      </div>
                    </div>
                  </div>

                  {canOpenAdminPanel && ADMIN_PANEL_URL && (
                    <a
                      role="menuitem"
                      href={ADMIN_PANEL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5 text-sm font-medium text-night-text hover:bg-white/5"
                    >
                      <Shield size="1em" aria-hidden="true" className="text-signal-light" /> Admin panel
                    </a>
                  )}

                  <div className="py-1">
                    {memberLinks.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        role="menuitem"
                        href={href}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-night-text hover:bg-white/5"
                      >
                        <Icon size="1em" aria-hidden="true" className="text-night-muted" /> {label}
                      </Link>
                    ))}
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-sm text-night-muted hover:bg-white/5 hover:text-night-text"
                  >
                    <LogOut size="1em" aria-hidden="true" /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-xl text-night-text lg:hidden"
          onClick={() => setIsOpen((s) => !s)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="nb-mobile-menu"
        >
          {isOpen ? <X size="1em" /> : <Menu size="1em" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div
          id="nb-mobile-menu"
          className="nb-glass-menu pointer-events-auto absolute inset-x-3 top-full mt-2 max-h-[calc(100vh-var(--nb-nav-height)-16px)] overflow-y-auto rounded-2xl sm:inset-x-4 lg:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col px-5 py-2">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-between border-b border-white/10 py-3.5 font-display text-lg font-semibold ${
                    active ? "text-signal-light" : "text-night-text"
                  }`}
                >
                  {link.label}
                  <ArrowRight size="1em" aria-hidden="true" className="text-base text-night-muted" />
                </Link>
              );
            })}
          </nav>

          <div className="px-5 pb-5 pt-3 text-night-text">
            {!isLoggedIn ? (
              <div className="flex flex-col gap-2.5">
                <span className="font-mono text-xs uppercase tracking-[0.08em] text-night-muted">Join the lab</span>
                <Link href="/auth?tab=signup" className="nb-btn nb-btn-accent w-full rounded-xl">
                  Create an account
                </Link>
                <Link href="/auth?tab=signin" className="nb-btn w-full rounded-xl border border-white/15 bg-white/5 text-night-text">
                  Sign in
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
                  <Avatar size="h-10 w-10" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{displayName}</div>
                    <div className="truncate font-mono text-[11px] uppercase tracking-[0.04em] text-night-muted">
                      {userRoleDisplay}
                      {subroleSummary && ` · ${subroleSummary}`}
                    </div>
                  </div>
                </div>
                {canOpenAdminPanel && ADMIN_PANEL_URL && (
                  <a
                    href={ADMIN_PANEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 border-b border-white/10 px-4 py-3 text-sm font-medium"
                  >
                    <Shield size="1em" aria-hidden="true" className="text-signal-light" /> Admin panel
                  </a>
                )}
                {memberLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 border-b border-white/10 px-4 py-3 text-sm"
                  >
                    <Icon size="1em" aria-hidden="true" className="text-night-muted" /> {label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-night-muted"
                >
                  <LogOut size="1em" aria-hidden="true" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
