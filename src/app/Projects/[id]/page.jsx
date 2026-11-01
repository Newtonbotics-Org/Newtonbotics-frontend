"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Boxes, Check, ExternalLink, Link2, Play, Share2, Star } from "lucide-react";
import RemoteImage from "@/components/RemoteImage";
import { DetailPageSkeleton } from "@/components/PageSkeletons";
import CropFrame from "@/components/lab/CropFrame";
import BlueprintPlaceholder from "@/components/lab/BlueprintPlaceholder";
import { mediaService } from "@/lib/media";
import { API_BASE_URL } from "@/lib/api";
import { getPersonDisplayName } from "@/lib/publicTeam";
import { formatDate, projectStatus, titleCase } from "@/lib/labUi";
import NotFoundState from "@/components/lab/NotFoundState";

const getUserId = (user) => {
  if (!user) return null;
  if (typeof user === "string") return user;
  return user._id || user.id || null;
};

const calculateProgress = (milestones) => {
  if (!milestones || milestones.length === 0) return 0;
  const completed = milestones.filter((m) => m.status === "completed").length;
  return Math.round((completed / milestones.length) * 100);
};

const MILESTONE_STYLE = {
  completed: { dot: "bg-[#166534]", label: "Done", text: "text-ink-muted" },
  in_progress: { dot: "bg-signal shadow-[0_0_0_4px_#FFE9DF]", label: "In progress", text: "text-signal-hover" },
  overdue: { dot: "bg-[#B91C1C]", label: "Overdue", text: "text-[#991B1B]" },
  pending: { dot: "border-2 border-line-strong bg-paper", label: "Next", text: "text-ink-muted" },
};

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

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

function PersonCard({ name, avatarUrl, role, email, isLeader, skills, responsibilities, joinedAt }) {
  return (
    <div className={`nb-card flex flex-col gap-3 p-5 ${isLeader ? "shadow-[inset_3px_0_0_#FF5A1F]" : ""}`}>
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <RemoteImage src={avatarUrl} alt="" width={44} height={44} displayWidth={44} displayHeight={44} className="h-11 w-11 shrink-0 rounded-full object-cover" />
        ) : (
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold ${
              isLeader ? "bg-signal text-ink" : "bg-ink text-paper"
            }`}
          >
            {initials(name)}
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate font-semibold">{name}</div>
          <div className="flex flex-wrap items-center gap-2">
            {isLeader && <span className="nb-chip nb-chip-signal">Team leader</span>}
            {role && <span className="text-sm text-ink-muted">{role}</span>}
          </div>
        </div>
      </div>
      {email && (
        <a href={`mailto:${email}`} className="break-all text-[13px] text-ink-muted no-underline hover:text-signal-text">
          {email}
        </a>
      )}
      {skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span key={s} className="rounded border border-line px-2 py-1 font-mono text-[11px] text-ink-muted">
              {s}
            </span>
          ))}
        </div>
      )}
      {responsibilities?.length > 0 && (
        <p className="m-0 text-[13px] leading-relaxed text-ink-muted">
          <span className="font-semibold text-ink">Responsible for:</span> {responsibilities.join(", ")}
        </p>
      )}
      {joinedAt && <span className="font-mono text-[11px] text-ink-subtle">JOINED {formatDate(joinedAt).toUpperCase()}</span>}
    </div>
  );
}

const ProjectDetail = () => {
  const params = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryCategoryId, setGalleryCategoryId] = useState(null);
  const [heroFailed, setHeroFailed] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/projects/${params.id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch project");
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to fetch project");
        setProject(data.data.project);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [params.id]);

  // Load project-related gallery items (images and videos)
  useEffect(() => {
    if (!project) return;
    const loadGallery = async () => {
      try {
        setGalleryLoading(true);
        let categoryId = project.galleryCategoryId || project.mediaCategoryId || project.categoryId || undefined;

        // If categoryId is not present on project, try to resolve it by matching media categories
        if (!categoryId) {
          try {
            const categories = await mediaService.listCategories();
            const title = (project.title || "").toLowerCase();
            const projCategory = (project.category || "").toLowerCase();
            const match = categories.find((c) => {
              const name = (c.name || "").toLowerCase();
              return name === title || name === projCategory || name.includes(title) || name.includes(projCategory);
            });
            if (match?._id) categoryId = match._id;
          } catch (e) {
            console.error("Failed to resolve media category by name:", e);
          }
        }

        const query = categoryId
          ? { categoryId, limit: 50, skip: 0 }
          : { q: project.title || undefined, limit: 50, skip: 0 };
        const { items } = await mediaService.listMedia(query);
        const supported = Array.isArray(items)
          ? items.filter((it) => ["image", "video"].includes((it.fileType || "").toLowerCase()))
          : [];
        setGalleryItems(supported);
        setGalleryCategoryId(categoryId || null);
      } catch (e) {
        console.error("Error loading gallery for project:", e);
        setGalleryItems([]);
      } finally {
        setGalleryLoading(false);
      }
    };
    loadGallery();
  }, [project]);

  if (loading) return <DetailPageSkeleton className="nb-dark" />;

  if (error || !project) {
    return (
      <NotFoundState
        title="Project not found"
        message={error || "The project you're looking for doesn't exist."}
        gameLabel="Project not found"
        actions={
          <Link href="/Projects" className="nb-btn nb-btn-primary">
            Back to projects
          </Link>
        }
      />
    );
  }

  const status = projectStatus(project.status);
  const teamLeaderUserId = getUserId(project.teamLeaderId);
  const members = Array.isArray(project.teamMembers) ? project.teamMembers : [];
  const teamLeaderInMembers = teamLeaderUserId
    ? members.some((m) => getUserId(m.userId)?.toString() === teamLeaderUserId.toString())
    : false;
  const teamCount = project.teamSize || members.length + (project.teamLeaderId && !teamLeaderInMembers ? 1 : 0);

  const displayProgress =
    project.status === "completed" ? 100 : project.progress ?? calculateProgress(project.milestones);
  const milestoneTotal = project.totalMilestonesCount || project.milestones?.length || 0;
  const milestoneCompleted =
    project.completedMilestonesCount || project.milestones?.filter((m) => m.status === "completed").length || 0;

  const description = project.description || "";
  const leadIsWholeDescription = description.length <= 220;
  const componentsHref = `/Inventory/projects/${encodeURIComponent(params.id)}`;

  const links = [
    project.documentationUrl && { href: project.documentationUrl, label: "Documentation" },
    project.githubUrl && { href: project.githubUrl, label: "Source code" },
    project.videoUrl && { href: project.videoUrl, label: "Demo video" },
  ].filter(Boolean);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: project.title, text: description.slice(0, 140), url });
        return;
      } catch (_) {
        // fall through to copy when the share sheet is dismissed
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <main className="nb-dark bg-paper text-ink">
      <div className="nb-container flex flex-col gap-7 pt-10">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap gap-2 font-mono text-xs uppercase tracking-[0.04em] text-ink-muted"
        >
          <Link href="/Projects" className="text-ink-muted no-underline hover:text-ink">
            Projects
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">{project.title}</span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <span className={`nb-chip ${status.chip}`}>{status.label}</span>
              {project.category && <span className="nb-chip nb-chip-outline">{project.category}</span>}
              {project.isFeatured && (
                <span className="nb-chip nb-chip-outline inline-flex items-center gap-1">
                  <Star size={11} aria-hidden="true" /> Featured
                </span>
              )}
            </div>
            <h1 className="nb-h1 m-0">{project.title}</h1>
            {description && (
              <p className={`m-0 max-w-[680px] text-lg leading-relaxed text-ink-muted ${leadIsWholeDescription ? "" : "line-clamp-2"}`}>
                {description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href={componentsHref} className="nb-btn nb-btn-secondary">
              <Boxes size={16} aria-hidden="true" /> Project components
            </Link>
            <button type="button" onClick={share} className="nb-btn nb-btn-primary">
              {linkCopied ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}
              {linkCopied ? "Link copied" : "Share"}
            </button>
          </div>
        </div>

        <CropFrame
          caption={`Fig. 01 — ${project.title}`}
          captionRight={project.startDate ? `Since ${formatDate(project.startDate, { month: "short", year: "numeric" })}` : undefined}
        >
          {project.imageUrl && !heroFailed ? (
            <RemoteImage
              src={project.imageUrl}
              alt={project.title}
              displayWidth={1216}
              priority
              className="block h-[280px] w-full rounded object-cover sm:h-[520px]"
              onError={() => setHeroFailed(true)}
            />
          ) : (
            <BlueprintPlaceholder className="h-[280px] rounded sm:h-[420px]" />
          )}
        </CropFrame>
      </div>

      <div className="nb-container flex flex-wrap items-start gap-16 pb-28 pt-16">
        <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-14">
          {!leadIsWholeDescription && (
            <section className="flex flex-col gap-5">
              <SectionHeading>Overview</SectionHeading>
              <p className="m-0 whitespace-pre-line text-[17px] leading-[1.7] text-ink-body">{description}</p>
            </section>
          )}

          {project.milestones?.length > 0 && (
            <section className="flex flex-col gap-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <SectionHeading>Build log</SectionHeading>
                <span className="font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
                  {milestoneCompleted} of {milestoneTotal} done
                </span>
              </div>
              <ol className="m-0 flex list-none flex-col gap-7 border-l-2 border-line py-1 pl-6">
                {project.milestones.map((m, i) => {
                  const s = MILESTONE_STYLE[m.status] || MILESTONE_STYLE.pending;
                  return (
                    <li key={m._id || i} className="relative flex flex-col gap-1.5">
                      <span aria-hidden="true" className={`absolute -left-[32px] top-0.5 h-3.5 w-3.5 rounded-full ${s.dot}`} />
                      <span className={`font-mono text-xs uppercase tracking-[0.04em] ${s.text}`}>
                        {s.label}
                        {m.completedAt
                          ? ` · ${formatDate(m.completedAt)}`
                          : m.dueDate
                            ? ` · due ${formatDate(m.dueDate)}`
                            : ""}
                      </span>
                      <span className={`text-[17px] font-semibold ${m.status === "pending" ? "text-ink-muted" : ""}`}>
                        {m.title}
                      </span>
                      {m.description && <span className="text-[15px] leading-relaxed text-ink-muted">{m.description}</span>}
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {(project.teamLeaderId || members.length > 0) && (
            <section id="project-team" className="flex flex-col gap-5">
              <SectionHeading>Team</SectionHeading>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
                {project.teamLeaderId && !teamLeaderInMembers && (
                  <PersonCard
                    name={getPersonDisplayName(project.teamLeaderId)}
                    avatarUrl={project.teamLeaderId?.profileImageUrl}
                    email={project.teamLeaderId?.email}
                    isLeader
                  />
                )}
                {members.map((member, i) => {
                  const memberUserId = getUserId(member.userId);
                  return (
                    <PersonCard
                      key={memberUserId || i}
                      name={getPersonDisplayName(member.userId) || member.userName || "Team member"}
                      avatarUrl={member.userId?.profileImageUrl || member.profileImageUrl}
                      role={member.role}
                      email={member.userId?.email || member.email}
                      isLeader={Boolean(teamLeaderUserId && memberUserId?.toString() === teamLeaderUserId.toString())}
                      skills={member.skills}
                      responsibilities={member.responsibilities}
                      joinedAt={member.joinedAt}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {project.achievements?.length > 0 && (
            <section className="flex flex-col gap-5">
              <SectionHeading>Achievements</SectionHeading>
              <ul className="m-0 flex list-none flex-col border-t border-line p-0">
                {project.achievements.map((a, i) => (
                  <li key={i} className="flex gap-5 border-b border-line py-4">
                    <span className="w-7 font-mono text-[13px] text-signal-text">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-base leading-normal">{a}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="flex flex-col gap-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <SectionHeading>Media</SectionHeading>
              <Link
                href={galleryCategoryId ? `/Gallery?categoryId=${galleryCategoryId}` : "/Gallery"}
                className="nb-link text-sm"
              >
                Open in gallery →
              </Link>
            </div>
            {galleryLoading ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[180px] animate-pulse rounded-md bg-[#E6E7E1]" />
                ))}
              </div>
            ) : galleryItems.length === 0 ? (
              <p className="m-0 text-ink-muted">No photos or videos for this project yet.</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                {galleryItems.slice(0, 5).map((item, i) => {
                  const isVideo = (item.fileType || "").toLowerCase() === "video";
                  return (
                    <a
                      key={item._id || i}
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block h-[180px] overflow-hidden rounded-md bg-[#E6E7E1]"
                    >
                      <RemoteImage
                        src={item.thumbnailUrl || (isVideo ? undefined : item.fileUrl)}
                        alt={item.title || "Project media"}
                        displayWidth={240}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      {isVideo && (
                        <span className="absolute inset-0 grid place-items-center">
                          <span className="grid h-11 w-11 place-items-center rounded-full bg-ink/80 text-paper">
                            <Play size={18} aria-hidden="true" />
                          </span>
                        </span>
                      )}
                    </a>
                  );
                })}
                {galleryItems.length > 5 && (
                  <Link
                    href={galleryCategoryId ? `/Gallery?categoryId=${galleryCategoryId}` : "/Gallery"}
                    className="nb-blueprint-sm grid h-[180px] place-items-center rounded-md font-mono text-xs text-ink-muted no-underline"
                  >
                    + {galleryItems.length - 5} MORE
                  </Link>
                )}
              </div>
            )}
          </section>

          {project.comments?.length > 0 && (
            <section className="flex flex-col gap-5">
              <SectionHeading>Notes</SectionHeading>
              <div className="flex flex-col gap-3">
                {project.comments.map((cmt, idx) => (
                  <div key={idx} className="nb-card p-5">
                    <p className="m-0 leading-relaxed">{cmt.text || String(cmt)}</p>
                    {cmt.createdAt && (
                      <span className="mt-2 block font-mono text-[11px] text-ink-subtle">{formatDate(cmt.createdAt)}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Offset by one section heading so the first card lines up with the first content card. */}
        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4 lg:mt-[62px]">
          <dl className="nb-card m-0 px-6 py-2">
            <SpecRow label="Status">{status.label}</SpecRow>
            <SpecRow label="Category">{project.category}</SpecRow>
            <SpecRow label="Started">{project.startDate ? formatDate(project.startDate) : null}</SpecRow>
            <SpecRow label="Target end">{project.endDate ? formatDate(project.endDate) : null}</SpecRow>
            <SpecRow label="Mentor">{project.mentorId ? getPersonDisplayName(project.mentorId) : null}</SpecRow>
            <SpecRow label="Team leader">{project.teamLeaderId ? getPersonDisplayName(project.teamLeaderId) : null}</SpecRow>
            <SpecRow label="Team">
              {teamCount > 0 ? (
                <a href="#project-team" className="text-ink no-underline hover:text-signal-text">
                  {teamCount} member{teamCount === 1 ? "" : "s"} →
                </a>
              ) : null}
            </SpecRow>
            <SpecRow label="Priority">{project.priority ? titleCase(project.priority) : null}</SpecRow>
            <SpecRow label="Difficulty">{project.difficulty ? titleCase(project.difficulty) : null}</SpecRow>
            <SpecRow label="Duration">
              {project.duration || project.duration === 0 ? `${project.duration} days` : null}
            </SpecRow>
            <SpecRow label="Budget">{project.budget ? `$${project.budget.toLocaleString()}` : null}</SpecRow>
            <SpecRow label="Views">{typeof project.viewCount === "number" ? project.viewCount : null}</SpecRow>
          </dl>

          <div className="nb-card flex flex-col gap-3 p-6">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Progress</span>
              <span className="font-mono text-ink-muted">{displayProgress}%</span>
            </div>
            <span className="h-1.5 overflow-hidden rounded-full bg-[#E6E7E1]">
              <span className="block h-full bg-signal" style={{ width: `${displayProgress}%` }} />
            </span>
            {milestoneTotal > 0 && (
              <span className="text-[13px] text-ink-muted">
                {milestoneCompleted} of {milestoneTotal} milestones complete
                {project.isOverdue ? " · behind schedule" : ""}
              </span>
            )}
          </div>

          {project.tags?.length > 0 && (
            <div className="nb-card flex flex-col gap-3.5 p-6">
              <span className="font-mono text-xs uppercase tracking-[0.04em] text-ink-muted">Tech &amp; tags</span>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="rounded border border-line px-2.5 py-1.5 font-mono text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {links.length > 0 && (
            <div className="nb-card flex flex-col p-2">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-md px-4 py-3 text-sm font-semibold text-ink no-underline hover:bg-paper"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Link2 size={16} aria-hidden="true" className="text-ink-muted" /> {l.label}
                  </span>
                  <ExternalLink size={14} aria-hidden="true" className="text-ink-muted" />
                </a>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-lg bg-ink p-6 text-night-text">
            <span className="font-mono text-xs uppercase tracking-[0.06em] text-signal-light">Project components</span>
            <p className="m-0 text-sm leading-relaxed text-night-soft">
              Parts and equipment dedicated to this project. General lab stock is tracked separately.
            </p>
            <Link href={componentsHref} className="nb-btn nb-btn-accent nb-btn-sm self-start">
              <Boxes size={16} aria-hidden="true" /> View components
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default ProjectDetail;
