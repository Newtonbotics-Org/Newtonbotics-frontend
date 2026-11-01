"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, ExternalLink, Link2, Mail, Share2, Star } from "lucide-react";
import RemoteImage from "@/components/RemoteImage";
import CropFrame from "@/components/lab/CropFrame";
import BlueprintPlaceholder from "@/components/lab/BlueprintPlaceholder";
import { DetailPageSkeleton, TeamMemberCardSkeleton } from "@/components/PageSkeletons";
import { API_BASE_URL } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/labUi";
import NotFoundState from "@/components/lab/NotFoundState";

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};

function SectionHeading({ children }) {
  return <h2 className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">{children}</h2>;
}

function SpecRow({ label, children }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-line-soft py-3.5 last:border-b-0">
      <dt className="font-mono text-xs uppercase tracking-[0.04em] text-ink-muted">{label}</dt>
      <dd className="m-0 text-right text-sm font-semibold">{children}</dd>
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-8 border-t border-line p-0">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-3 border-b border-line py-3 text-[15px]">
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-ink" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function memberDetails(member) {
  const displayName =
    member.fullName ||
    `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
    member.displayName ||
    member.userName ||
    member.email ||
    "Team Member";

  let roleOrDept = member.specialization || member.department;
  if (!roleOrDept && member.role) roleOrDept = titleCase(member.role);
  if (!roleOrDept && member.subroles && member.subroles.length > 0) roleOrDept = titleCase(member.subroles[0]);

  const profileImage = member.profileImageUrl || member.avatar || member.profileImage;
  const email =
    member.email ||
    member.userId?.email ||
    member.contactEmail ||
    member.publicEmail ||
    member.contact?.email ||
    (member.profile && member.profile.email) ||
    (member.user && member.user.email);

  return { displayName, roleOrDept, profileImage, email };
}

const ResearchAreaDetail = () => {
  const params = useParams();
  const [researchArea, setResearchArea] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);

  useEffect(() => {
    const fetchResearchArea = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/research-areas/${params.id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch research area");
        const data = await res.json();
        if (data.success) {
          setResearchArea(data.data.item);
        } else {
          throw new Error(data.message || "Failed to fetch research area");
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
  }, [params.id]);

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
        const memberPromises = researchArea.studentIds.map(async (studentId) => {
          try {
            const res = await fetch(`${API_BASE_URL}/public/team-members/${studentId}`, { cache: "no-store" });
            if (res.ok) {
              const data = await res.json();
              const userData =
                data.data?.item || data.data?.user || data.item || data.user || (data.success && data.data);
              return userData || null;
            }
            try {
              const errorData = await res.json();
              console.error(`Error response for ${studentId}:`, errorData);
            } catch (e) {
              console.error(`Failed to parse error response for ${studentId}:`, e);
            }
            return null;
          } catch (err) {
            console.error(`Error fetching user ${studentId}:`, err);
            return null;
          }
        });

        const members = await Promise.all(memberPromises);
        setTeamMembers(members.filter((member) => member !== null && member !== undefined));
      } catch (err) {
        console.error("Error fetching team members:", err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchTeamMembers();
  }, [researchArea]);

  if (loading) {
    return <DetailPageSkeleton className="nb-dark" />;
  }

  if (error || !researchArea) {
    return (
      <NotFoundState
        title="Research area not found"
        message={error || "The research area you are looking for does not exist."}
        gameLabel="Research area not found"
        actions={
          <Link href="/research-areas" className="nb-btn nb-btn-primary">
            Back to research areas
          </Link>
        }
      />
    );
  }

  const area = researchArea;
  const studentIds = Array.isArray(area.studentIds) ? area.studentIds : [];
  const memberTotal = area.memberCount !== undefined ? area.memberCount : studentIds.length;
  const externalLinks = Array.isArray(area.externalLinks) ? area.externalLinks : [];

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: area.name, text: area.description, url });
        return;
      } catch (_) {
        // fall through to copy when the share sheet is dismissed
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (_) {
      setLinkCopied(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (_) {
      setLinkCopied(false);
    }
  };

  return (
    <main className="nb-dark bg-paper text-ink">
      <div className="nb-container flex flex-col gap-7 pt-10">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap gap-2 font-mono text-xs uppercase tracking-[0.04em] text-ink-muted"
        >
          <Link href="/research-areas" className="text-ink-muted no-underline hover:text-ink">
            Research areas
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">{area.name}</span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {area.category && <span className="nb-chip nb-chip-outline">{area.category}</span>}
              {area.isFeatured && (
                <span className="nb-chip nb-chip-signal inline-flex items-center gap-1">
                  <Star size={11} aria-hidden="true" /> Featured
                </span>
              )}
            </div>
            <h1 className="nb-h1 m-0">{area.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button type="button" onClick={copyLink} className="nb-btn nb-btn-secondary">
              <Link2 size={16} aria-hidden="true" /> Copy link
            </button>
            <button type="button" onClick={share} className="nb-btn nb-btn-primary">
              {linkCopied ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}
              {linkCopied ? "Link copied" : "Share"}
            </button>
            <span aria-live="polite" className="nb-sr-only">
              {linkCopied ? "Link copied" : ""}
            </span>
          </div>
        </div>

        <CropFrame
          caption={`Fig. 01 — ${area.name}`}
          captionRight={area.category ? area.category : undefined}
        >
          {area.featuredImageUrl && !heroFailed ? (
            <RemoteImage
              src={area.featuredImageUrl}
              alt={area.name}
              className="block h-[260px] w-full rounded object-cover sm:h-[460px]"
              onError={() => setHeroFailed(true)}
            />
          ) : (
            <BlueprintPlaceholder label={area.category || "Research area"} className="h-[240px] rounded sm:h-[360px]" />
          )}
        </CropFrame>
      </div>

      <div className="nb-container flex flex-wrap items-start gap-16 pb-28 pt-16">
        <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-14">
          {area.description && (
            <section className="flex flex-col gap-4">
              <SectionHeading>Overview</SectionHeading>
              <p className="m-0 whitespace-pre-line text-[17px] leading-[1.7] text-ink-body">{area.description}</p>
            </section>
          )}

          {area.focusAreas?.length > 0 && (
            <section className="flex flex-col gap-5">
              <SectionHeading>Focus areas</SectionHeading>
              <BulletList items={area.focusAreas} />
            </section>
          )}

          {area.requiredSkills?.length > 0 && (
            <section className="flex flex-col gap-5">
              <SectionHeading>Required skills</SectionHeading>
              <BulletList items={area.requiredSkills} />
            </section>
          )}

          {area.requiredEquipment?.length > 0 && (
            <section className="flex flex-col gap-5">
              <SectionHeading>Required equipment</SectionHeading>
              <BulletList items={area.requiredEquipment} />
            </section>
          )}

          {area.collaborationOpportunities && (
            <section className="flex flex-col gap-4">
              <SectionHeading>Collaboration opportunities</SectionHeading>
              <p className="m-0 whitespace-pre-line text-[17px] leading-[1.7] text-ink-body">
                {area.collaborationOpportunities}
              </p>
            </section>
          )}

          {area.fundingInfo && (
            <section className="flex flex-col gap-4">
              <SectionHeading>Funding</SectionHeading>
              <p className="m-0 whitespace-pre-line text-[17px] leading-[1.7] text-ink-body">{area.fundingInfo}</p>
            </section>
          )}

          {externalLinks.length > 0 && (
            <section className="flex flex-col gap-5">
              <SectionHeading>External links</SectionHeading>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
                {externalLinks.map((link, index) => (
                  <a
                    key={link._id || index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nb-card nb-card-hover group flex flex-col gap-2 p-5 text-ink no-underline"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-semibold group-hover:text-signal-text">{link.title || "External link"}</span>
                      <ExternalLink size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-muted" />
                    </span>
                    {link.description && (
                      <span className="line-clamp-2 text-sm leading-relaxed text-ink-muted">{link.description}</span>
                    )}
                    <span className="truncate font-mono text-xs text-ink-muted">{getDomain(link.url)}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {studentIds.length > 0 && (
            <section className="flex flex-col gap-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <SectionHeading>Team</SectionHeading>
                <span className="font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
                  {memberTotal} member{memberTotal === 1 ? "" : "s"}
                </span>
              </div>
              {loadingMembers ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
                  {Array.from({ length: Math.min(studentIds.length, 4) }).map((_, i) => (
                    <TeamMemberCardSkeleton key={i} delay={i * 80} />
                  ))}
                </div>
              ) : teamMembers.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
                  {teamMembers.map((member, index) => {
                    const { displayName, roleOrDept, profileImage, email } = memberDetails(member);
                    return (
                      <div key={member._id || member.id || index} className="nb-card flex flex-col gap-3 p-5">
                        <div className="flex items-center gap-3">
                          {profileImage ? (
                            <RemoteImage
                              src={profileImage}
                              alt=""
                              width={44}
                              height={44}
                              className="h-11 w-11 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-paper">
                              {initials(displayName)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{displayName}</div>
                            {roleOrDept && <div className="text-sm text-ink-muted">{roleOrDept}</div>}
                          </div>
                        </div>
                        {email && (
                          <a
                            href={`mailto:${email}`}
                            className="inline-flex items-center gap-1.5 break-all text-[13px] text-ink-muted no-underline hover:text-signal-text"
                          >
                            <Mail size={14} aria-hidden="true" className="shrink-0" />
                            {email}
                          </a>
                        )}
                        {member.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {member.skills.map((skill, i) => (
                              <span key={i} className="rounded border border-line px-2 py-1 font-mono text-[11px] text-ink-muted">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="nb-card p-6 text-sm text-ink-muted">
                  Member details couldn&apos;t be loaded. {studentIds.length} member
                  {studentIds.length === 1 ? "" : "s"} assigned.
                </div>
              )}
            </section>
          )}
        </article>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <dl className="nb-card m-0 px-6 py-2">
            <SpecRow label="Category">{area.category}</SpecRow>
            <SpecRow label="Members">{memberTotal || 0}</SpecRow>
            <SpecRow label="Publications">{area.publicationCount || 0}</SpecRow>
            <SpecRow label="Created">{area.createdAt ? formatDate(area.createdAt) : null}</SpecRow>
            <SpecRow label="Last updated">{area.updatedAt ? formatDate(area.updatedAt) : null}</SpecRow>
          </dl>

          {area.keywords?.length > 0 && (
            <div className="nb-card flex flex-col gap-3.5 p-6">
              <span className="font-mono text-xs uppercase tracking-[0.04em] text-ink-muted">Keywords</span>
              <div className="flex flex-wrap gap-2">
                {area.keywords.map((keyword, i) => (
                  <span key={i} className="rounded border border-line px-2.5 py-1.5 font-mono text-xs">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-lg bg-ink p-6 text-night-text">
            <span className="font-mono text-xs uppercase tracking-[0.06em] text-signal-light">Get involved</span>
            <p className="m-0 text-sm leading-relaxed text-night-soft">
              Have an idea in this area? Pitch it and we&apos;ll help you form a team around it.
            </p>
            <Link href="/projectRequest" className="nb-btn nb-btn-accent nb-btn-sm self-start">
              Pitch a project
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default ResearchAreaDetail;
