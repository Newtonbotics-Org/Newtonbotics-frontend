"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Mail, Linkedin, Github, Globe, ArrowRight } from "lucide-react";
import RemoteImage from "@/components/RemoteImage";
import clubData from "../AllDatas/data.json";
import { sortLeadershipTeam } from "@/lib/publicTeam";

const AVATAR_FILLS = [
  "bg-ink text-paper",
  "bg-signal text-ink",
  "bg-[#E6E7E1] text-ink",
  "bg-ink-muted text-white",
];

function getInitials(person) {
  const first = person.firstName?.charAt(0) || "";
  const last = person.lastName?.charAt(0) || "";
  const fromParts = (first + last).toUpperCase();
  if (fromParts) return fromParts;
  const words = (person.fullName || "").trim().split(/\s+/).filter(Boolean);
  return words.map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function avatarFill(person) {
  return AVATAR_FILLS[(person.firstName?.charCodeAt(0) || 0) % AVATAR_FILLS.length];
}

function formatSubroles(subroles) {
  if (!subroles || subroles.length === 0) return null;
  return subroles
    .map((subrole) => subrole.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()))
    .join(", ");
}

function getDisplayRole(person) {
  if (person.subroles && person.subroles.length > 0) return formatSubroles(person.subroles);
  return person.role?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function TeamPageClient({
  leadershipTeam = [],
  teamMembers = [],
  mentors = [],
  researchers = [],
}) {
  const [searchTerm, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && selectedImage) {
        setSelectedImage(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedImage]);

  const departments = useMemo(() => {
    const allPeople = [...leadershipTeam, ...teamMembers, ...mentors, ...researchers];
    return [...new Set(allPeople.map((person) => person.department).filter(Boolean))];
  }, [leadershipTeam, teamMembers, mentors, researchers]);

  const getFilteredPeople = (people) => {
    return people.filter((person) => {
      const matchesSearch =
        !searchTerm ||
        person.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.skills?.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = filterRole === "all" || person.role === filterRole;
      const matchesDepartment = filterDepartment === "all" || person.department === filterDepartment;

      return matchesSearch && matchesRole && matchesDepartment;
    });
  };

  const sortedLeadership = useMemo(() => sortLeadershipTeam(leadershipTeam), [leadershipTeam]);
  const filteredLeadership = getFilteredPeople(sortedLeadership);
  const filteredTeamMembers = getFilteredPeople(teamMembers);
  const filteredMentors = getFilteredPeople(mentors);
  const filteredResearchers = getFilteredPeople(researchers);

  const totalMembers =
    leadershipTeam.length + teamMembers.length + mentors.length + researchers.length;
  const filteredTotal =
    filteredLeadership.length +
    filteredTeamMembers.length +
    filteredMentors.length +
    filteredResearchers.length;

  const hasActiveFilters = searchTerm || filterRole !== "all" || filterDepartment !== "all";
  const clearFilters = () => {
    setSearchQuery("");
    setFilterRole("all");
    setFilterDepartment("all");
  };

  const founders = clubData?.founders || [];
  const foundedYear = clubData?.clubInfo?.founded;

  const counts = [
    { value: leadershipTeam.length, label: "leadership" },
    { value: researchers.length, label: "researchers" },
    { value: mentors.length, label: mentors.length === 1 ? "mentor" : "mentors" },
    { value: teamMembers.length, label: "team members" },
  ].filter((c) => c.value > 0);

  // Number the visible sections in order: [01], [02], ...
  let sectionNo = 0;
  const nextIndex = () => String(++sectionNo).padStart(2, "0");

  return (
    <main className="nb-dark bg-paper text-ink">
      <header className="nb-blueprint border-b border-line">
        <div className="nb-container flex flex-col gap-5 pb-14 pt-16 sm:pt-20">
          <span className="nb-eyebrow">
            <span className="nb-eyebrow-num">[06]</span> Team
          </span>
          <h1 className="nb-h1 m-0 max-w-[860px]">The people behind the robots.</h1>
          <p className="m-0 max-w-[640px] text-lg leading-relaxed text-ink-muted">
            Innovators, creators and problem solvers powering NewtonBotics.
          </p>
          {counts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[13px] text-ink-muted">
              {counts.map((c) => (
                <span key={c.label}>
                  <strong className="font-medium text-ink">{c.value}</strong> {c.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="nb-container flex flex-col gap-20 pb-28 pt-10">
        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-0 flex-[1_1_280px]">
              <label htmlFor="team-search" className="nb-sr-only">
                Search team
              </label>
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
              />
              <input
                id="team-search"
                type="search"
                placeholder="Search by name, skills or specialization…"
                value={searchTerm}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nb-input h-11 pl-10 text-sm"
              />
            </div>
            <label htmlFor="team-role" className="nb-sr-only">
              Role
            </label>
            <select
              id="team-role"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="nb-input h-11 w-[180px] shrink-0 truncate pr-8 text-sm"
            >
              <option value="all">All roles</option>
              <option value="team_member">Team members</option>
              <option value="mentor">Mentors</option>
              <option value="researcher">Researchers</option>
            </select>
            <label htmlFor="team-department" className="nb-sr-only">
              Department
            </label>
            <select
              id="team-department"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="nb-input h-11 w-[200px] shrink-0 truncate pr-8 text-sm"
            >
              <option value="all">All departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
            <span aria-live="polite">
              Showing {filteredTotal} of {totalMembers} members
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-[44px] items-center gap-1 font-mono text-xs uppercase tracking-[0.06em] text-signal-text hover:text-signal-hover"
              >
                <X size={14} aria-hidden="true" /> Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Mentors: the one dark section on this page */}
        {filteredMentors.length > 0 && (
          <section aria-labelledby="team-mentors" className="flex flex-col gap-4">
            <h2 id="team-mentors" className="nb-sr-only">
              Mentors and advisors
            </h2>
            {filteredMentors.map((mentor) => (
              <MentorPanel
                key={mentor.id || mentor._id}
                person={mentor}
                onImageClick={setSelectedImage}
              />
            ))}
          </section>
        )}

        {filteredLeadership.length > 0 && (
          <PeopleSection index={nextIndex()} title="Leadership" count={filteredLeadership.length}>
            {filteredLeadership.map((leader) => (
              <PersonCard
                key={leader.id || leader._id}
                person={leader}
                onImageClick={setSelectedImage}
              />
            ))}
          </PeopleSection>
        )}

        {filteredResearchers.length > 0 && (
          <PeopleSection index={nextIndex()} title="Research team" count={filteredResearchers.length}>
            {filteredResearchers.map((researcher) => (
              <PersonCard
                key={researcher.id || researcher._id}
                person={researcher}
                onImageClick={setSelectedImage}
              />
            ))}
          </PeopleSection>
        )}

        {filteredTeamMembers.length > 0 && (
          <PeopleSection
            index={nextIndex()}
            title="Team members"
            count={filteredTeamMembers.length}
            gridClass="grid-cols-[repeat(auto-fill,minmax(220px,1fr))]"
          >
            {filteredTeamMembers.map((member) => (
              <PersonCard
                key={member.id || member._id}
                person={member}
                compact
                onImageClick={setSelectedImage}
              />
            ))}
          </PeopleSection>
        )}

        {filteredTotal === 0 && (
          <div className="nb-card flex flex-col items-start gap-4 p-10">
            <h2 className="m-0 font-display text-2xl font-semibold">
              {totalMembers === 0 ? "Team list unavailable" : "No one matches"}
            </h2>
            <p className="m-0 text-ink-muted">
              {totalMembers === 0
                ? "The team roster couldn't be loaded right now. Please check back soon."
                : "Try a different name, role or department."}
            </p>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="nb-btn nb-btn-secondary">
                Clear filters
              </button>
            )}
          </div>
        )}

        {founders.length > 0 && (
          <section className="flex flex-col gap-7">
            <SectionHeading index={nextIndex()}>
              Founding team{foundedYear ? ` · ${foundedYear}` : ""}
            </SectionHeading>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
              {founders.map((f) => (
                <article key={f.name} className="nb-card flex flex-col overflow-hidden">
                  <Image
                    src={f.image}
                    alt={`Portrait of ${f.name}`}
                    width={400}
                    height={300}
                    sizes="(max-width: 640px) 100vw, 300px"
                    className="block h-[300px] w-full object-cover grayscale contrast-[1.05]"
                  />
                  <div className="flex flex-col gap-2 px-6 pb-6 pt-5">
                    <h3 className="m-0 font-display text-xl font-semibold">{f.name}</h3>
                    <span className="font-mono text-xs uppercase tracking-[0.04em] text-ink-muted">
                      {[f.role?.trim(), f.batch?.replace(/^Batch,\s*/i, "Batch ")].filter(Boolean).join(" · ")}
                    </span>
                    {f.bio && <p className="m-0 text-sm leading-relaxed text-ink-muted">{f.bio}</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-wrap items-center justify-between gap-8 rounded-lg border border-dashed border-line-strong p-8 sm:p-10">
          <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-2">
            <h2 className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Want your name here?</h2>
            <p className="m-0 text-base text-ink-muted">
              Builders, coders and organisers across every batch. No experience needed to start.
            </p>
          </div>
          <Link href="/auth?tab=signup" className="nb-btn nb-btn-primary">
            Apply to join <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>

      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Profile photo"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-surface text-ink hover:bg-paper"
            aria-label="Close photo"
            autoFocus
          >
            <X size={18} aria-hidden="true" />
          </button>
          <div
            className="max-h-[80vh] max-w-2xl rounded-lg border border-line bg-surface p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <RemoteImage
              src={selectedImage}
              displayWidth={720}
              priority
              alt="Team member profile"
              className="block max-h-[calc(80vh-24px)] w-auto rounded object-contain"
            />
          </div>
        </div>
      )}
    </main>
  );
}

/** Mono section marker rendered as a real heading: "[01] Leadership ———". */
function SectionHeading({ index, children }) {
  return (
    <h2 className="m-0 flex items-center gap-3 font-mono text-xs font-normal uppercase tracking-[0.08em] text-ink-muted">
      <span className="text-signal-text">[{index}]</span>
      <span>{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </h2>
  );
}

function PeopleSection({
  index,
  title,
  count,
  gridClass = "grid-cols-[repeat(auto-fill,minmax(260px,1fr))]",
  children,
}) {
  return (
    <section className="flex flex-col gap-7">
      <SectionHeading index={index}>
        {title} · {count}
      </SectionHeading>
      <div className={`grid ${gridClass} gap-4`}>{children}</div>
    </section>
  );
}

function Avatar({ person, size = "md", onImageClick, tone = "light" }) {
  const [imageError, setImageError] = useState(false);
  const dims = {
    sm: "h-14 w-14 text-[17px]",
    md: "h-16 w-16 text-lg",
    lg: "h-[120px] w-[120px] text-[40px]",
  }[size];
  const shape = size === "lg" ? "rounded-lg" : "rounded-full";
  const px = { sm: 56, md: 64, lg: 120 }[size];
  const hasImage = person.profileImageUrl && !imageError;

  if (!hasImage) {
    const fill = tone === "dark" ? "bg-signal text-ink" : avatarFill(person);
    return (
      <span
        aria-hidden="true"
        className={`inline-flex flex-none items-center justify-center font-display font-semibold ${shape} ${dims} ${fill}`}
      >
        {getInitials(person)}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onImageClick?.(person.profileImageUrl)}
      aria-label={`View photo of ${person.fullName}`}
      className={`flex-none overflow-hidden ${shape} ${dims} min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-signal/50`}
    >
      <RemoteImage
        src={person.profileImageUrl}
        alt=""
        displayWidth={px}
        displayHeight={px}
        className="h-full w-full object-cover"
        onError={() => setImageError(true)}
      />
    </button>
  );
}

function SocialLinks({ person, tone = "light" }) {
  const links = person.socialLinks || {};
  const items = [
    links.linkedin && { href: links.linkedin, label: "LinkedIn", Icon: Linkedin },
    links.github && { href: links.github, label: "GitHub", Icon: Github },
    links.portfolio && { href: links.portfolio, label: "Portfolio", Icon: Globe },
  ].filter(Boolean);
  if (items.length === 0) return null;
  const color =
    tone === "dark" ? "text-night-muted hover:text-night-text" : "text-ink-muted hover:text-ink";
  return (
    <div className="flex gap-1">
      {items.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${person.fullName} on ${label}`}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-md ${color}`}
        >
          <Icon size={18} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

function MentorPanel({ person, onImageClick }) {
  const roleLabel = person.role === "mentor" ? "Club mentor" : getDisplayRole(person);
  return (
    <div className="nb-blueprint-dark flex flex-wrap items-center gap-8 rounded-lg p-8 text-night-text sm:p-10">
      <Avatar person={person} size="lg" tone="dark" onImageClick={onImageClick} />
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.08em] text-signal-light">{roleLabel}</span>
        <span className="font-display text-[32px] font-semibold leading-tight tracking-[-0.02em]">
          {person.fullName}
        </span>
        {(person.specialization || person.department) && (
          <span className="text-base text-night-muted">
            {[person.specialization, person.department].filter(Boolean).join(" · ")}
          </span>
        )}
        {person.experienceYears && (
          <span className="font-mono text-xs text-night-muted">
            {person.experienceYears} years experience
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SocialLinks person={person} tone="dark" />
        {person.email && (
          <a href={`mailto:${person.email}`} className="nb-btn nb-btn-dark-outline nb-btn-sm h-11">
            <Mail size={16} aria-hidden="true" /> Email mentor
          </a>
        )}
      </div>
    </div>
  );
}

function PersonCard({ person, compact = false, onImageClick }) {
  const role = getDisplayRole(person);
  const skills = person.skills || [];

  return (
    <article className={`nb-card flex flex-col gap-4 ${compact ? "p-5" : "p-6"}`}>
      <div className="flex items-center gap-4">
        <Avatar person={person} size={compact ? "sm" : "md"} onImageClick={onImageClick} />
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className={`m-0 font-display font-semibold leading-snug ${compact ? "text-lg" : "text-xl"}`}>
            {person.fullName}
          </h3>
          {role && (
            <span className="font-mono text-xs uppercase tracking-[0.04em] text-signal-text">{role}</span>
          )}
        </div>
      </div>

      {person.specialization && (
        <p className="m-0 line-clamp-2 text-sm leading-relaxed text-ink-muted">{person.specialization}</p>
      )}

      {(person.department || person.experienceYears) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink-muted">
          {person.department && <span>{person.department}</span>}
          {person.experienceYears && <span>{person.experienceYears} yrs experience</span>}
        </div>
      )}

      {!compact && skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, 4).map((skill, idx) => (
            <span key={idx} className="nb-chip nb-chip-outline">
              {skill}
            </span>
          ))}
          {skills.length > 4 && <span className="nb-chip nb-chip-outline">+{skills.length - 4} more</span>}
        </div>
      )}

      {(person.email || Object.keys(person.socialLinks || {}).length > 0) && (
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line-soft pt-2">
          {person.email ? (
            <a
              href={`mailto:${person.email}`}
              className="nb-link inline-flex min-h-[44px] items-center gap-1.5 text-sm"
              title={person.email}
            >
              Contact <span aria-hidden="true">→</span>
              <span className="nb-sr-only"> {person.fullName}</span>
            </a>
          ) : (
            <span />
          )}
          <SocialLinks person={person} />
        </div>
      )}
    </article>
  );
}
