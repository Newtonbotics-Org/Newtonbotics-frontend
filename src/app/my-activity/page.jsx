"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail, MailOpen, Plus } from "lucide-react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../contexts/AuthContext";
import { ActivityDashboardSkeleton } from "@/components/PageSkeletons";
import { dateParts, formatDate, titleCase } from "@/lib/labUi";

const STATUS_CHIP = {
  ongoing: "nb-chip-signal",
  active: "nb-chip-signal",
  under_review: "nb-chip-signal",
  completed: "nb-chip-green",
  approved: "nb-chip-green",
  attended: "nb-chip-green",
  upcoming: "nb-chip-blue",
  registered: "nb-chip-blue",
  pending: "nb-chip-amber",
  on_hold: "nb-chip-amber",
  rejected: "nb-chip-red",
  cancelled: "nb-chip-red",
  absent: "nb-chip-red",
};

function StatusChip({ status }) {
  if (!status) return null;
  return <span className={`nb-chip ${STATUS_CHIP[status] || "nb-chip-outline"}`}>{titleCase(status)}</span>;
}

const idOf = (v) => (v && typeof v === "object" ? v._id || v.id : v) || null;

function Panel({ title, action, children }) {
  return (
    <section className="nb-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-6 py-[18px]">
        <h2 className="m-0 font-display text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return <p className="m-0 px-6 py-5 text-sm text-ink-muted">{children}</p>;
}

function Kpi({ label, value, note }) {
  return (
    <div className="nb-card flex flex-col gap-2 p-5">
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">{label}</span>
      <span className="font-display text-4xl font-semibold leading-none">{value}</span>
      {note && <span className="text-[13px] text-ink-muted">{note}</span>}
    </div>
  );
}

function greetingFor(date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function MyActivityPage() {
  const { getMyDashboard } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getMyDashboard();
        if (isMounted) {
          if (res.success) setDashboard(res.dashboard);
          else setError(res.error || "Failed to load activity");
        }
      } catch (e) {
        console.error("[MyActivity] Load error:", e);
        if (isMounted) setError(e.message || "Failed to load activity");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [getMyDashboard]);

  const user = dashboard?.user || {};
  const projects = dashboard?.projects?.items || [];
  const organizedEvents = dashboard?.events?.organized || [];
  const registeredEvents = dashboard?.events?.registered || [];
  const instructedWorkshops = dashboard?.workshops?.instructed || [];
  const registeredWorkshops = dashboard?.workshops?.registered || [];
  const inbox = dashboard?.communications?.recentInbox || [];
  const projectRequests = dashboard?.applications?.projectRequests || [];
  const completion = Math.max(0, Math.min(100, Number(user.profileCompletion) || 0));
  const firstName = (user.displayName || "").split(/\s+/)[0];

  const leadCount = projects.filter((p) => user.id && String(idOf(p.teamLeaderId)) === String(user.id)).length;
  const upcomingEvents = registeredEvents
    .filter((e) => e.status !== "completed" && e.status !== "cancelled")
    .sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));
  const unread = inbox.filter((m) => m.isRead === false).length;
  const nextEvent = upcomingEvents[0];

  return (
    <ProtectedRoute>
      <main className="nb-dark bg-paper text-ink">
        <div className="nb-container flex flex-col gap-8 pb-24 pt-10 sm:pt-12">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
                {now
                  ? now
                      .toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
                      .replace(",", " ·")
                  : "Member dashboard"}
              </span>
              <h1 className="m-0 font-display text-[32px] font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
                {now ? greetingFor(now) : "Welcome"}
                {firstName ? `, ${firstName}` : ""}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/Inventory" className="nb-btn nb-btn-secondary nb-btn-sm h-11">
                Browse inventory
              </Link>
              <Link href="/projectRequest" className="nb-btn nb-btn-accent nb-btn-sm h-11">
                <Plus size={16} aria-hidden="true" /> Pitch a project
              </Link>
            </div>
          </header>

          {loading && <ActivityDashboardSkeleton />}
          {error && (
            <div role="alert" className="rounded-md border border-[#F3C4C4] bg-[#FBE4E4] px-4 py-3 text-sm text-[#991B1B]">
              {error}
            </div>
          )}

          {!loading && !error && dashboard && (
            <>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                <Kpi
                  label="My projects"
                  value={dashboard?.projects?.total || 0}
                  note={projects.length ? `${leadCount} lead · ${projects.length - leadCount} member` : "None yet"}
                />
                <Kpi
                  label="Events"
                  value={registeredEvents.length}
                  note={
                    nextEvent?.startDate
                      ? `Next: ${formatDate(nextEvent.startDate, { weekday: "short", day: "numeric", month: "short" })}`
                      : `${organizedEvents.length} organised`
                  }
                />
                <Kpi
                  label="Workshops"
                  value={registeredWorkshops.length}
                  note={`${instructedWorkshops.length} instructed`}
                />
                <Kpi
                  label="Inbox"
                  value={dashboard?.communications?.inboxCount || 0}
                  note={`${dashboard?.communications?.sentCount || 0} sent${unread ? ` · ${unread} unread` : ""}`}
                />
              </div>

              <div className="flex flex-wrap items-start gap-6">
                <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-6">
                  <Panel
                    title="My projects"
                    action={
                      <Link href="/Projects" className="nb-link text-sm">
                        View all
                      </Link>
                    }
                  >
                    {projects.length === 0 ? (
                      <Empty>No projects yet.</Empty>
                    ) : (
                      <ul className="m-0 list-none p-0">
                        {projects.map((p) => {
                          const isLead = user.id && String(idOf(p.teamLeaderId)) === String(user.id);
                          const progress = p.status === "completed" ? 100 : Math.max(0, Math.min(100, Number(p.progress) || 0));
                          return (
                            <li key={p.id} className="border-b border-line-soft last:border-b-0">
                              <Link
                                href={`/Projects/${p.id}`}
                                className="flex flex-wrap items-center gap-5 px-6 py-[18px] text-ink no-underline hover:bg-paper"
                              >
                                <span className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
                                  <span className="flex flex-wrap items-center gap-2">
                                    <span className="text-base font-semibold">{p.title}</span>
                                    <StatusChip status={p.status} />
                                  </span>
                                  <span className="font-mono text-xs uppercase tracking-[0.04em] text-ink-muted">
                                    {isLead ? "Project lead" : "Member"}
                                    {p.category ? ` · ${p.category}` : ""}
                                    {p.teamSize ? ` · Team of ${p.teamSize}` : ""}
                                  </span>
                                </span>
                                <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-1.5">
                                  <span className="flex justify-between font-mono text-xs text-ink-muted">
                                    <span>Progress</span>
                                    <span>{progress}%</span>
                                  </span>
                                  <span className="h-1.5 overflow-hidden rounded-[3px] bg-[#E6E7E1]">
                                    <span
                                      className={`block h-full ${isLead ? "bg-signal" : "bg-ink"}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </span>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </Panel>

                  <Panel
                    title="Project requests"
                    action={
                      <Link href="/projectRequest" className="nb-link text-sm">
                        New request
                      </Link>
                    }
                  >
                    {projectRequests.length === 0 ? (
                      <Empty>You haven&apos;t submitted any project requests.</Empty>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px] border-collapse text-sm">
                          <thead>
                            <tr className="text-left font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">
                              <th scope="col" className="px-6 py-3 font-medium">Title</th>
                              <th scope="col" className="px-3 py-3 font-medium">Submitted</th>
                              <th scope="col" className="px-6 py-3 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {projectRequests.map((r) => (
                              <tr key={r._id} className="border-t border-line-soft">
                                <td className="px-6 py-3.5 font-medium">{r.title}</td>
                                <td className="px-3 py-3.5 font-mono text-[13px] text-ink-muted">
                                  {formatDate(r.submittedAt) || "—"}
                                </td>
                                <td className="px-6 py-3.5">
                                  <StatusChip status={r.status} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Panel>

                  <Panel
                    title="Events"
                    action={
                      <Link href="/Events" className="nb-link text-sm">
                        All events
                      </Link>
                    }
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] border-collapse text-sm">
                        <thead>
                          <tr className="text-left font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">
                            <th scope="col" className="px-6 py-3 font-medium">Event</th>
                            <th scope="col" className="px-3 py-3 font-medium">Role</th>
                            <th scope="col" className="px-3 py-3 font-medium">Event status</th>
                            <th scope="col" className="px-6 py-3 font-medium">My status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {organizedEvents.map((e) => (
                            <tr key={`o-${e._id}`} className="border-t border-line-soft">
                              <td className="px-6 py-3.5">
                                <span className="block font-medium">{e.title}</span>
                                <span className="text-[13px] text-ink-muted">{titleCase(e.type)}</span>
                              </td>
                              <td className="px-3 py-3.5 text-ink-muted">Organiser</td>
                              <td className="px-3 py-3.5">
                                <StatusChip status={e.status} />
                              </td>
                              <td className="px-6 py-3.5 text-ink-muted">—</td>
                            </tr>
                          ))}
                          {registeredEvents.map((e) => (
                            <tr key={`r-${e.id}`} className="border-t border-line-soft">
                              <td className="px-6 py-3.5">
                                <span className="block font-medium">{e.title}</span>
                                <span className="text-[13px] text-ink-muted">{titleCase(e.type)}</span>
                              </td>
                              <td className="px-3 py-3.5 text-ink-muted">Participant</td>
                              <td className="px-3 py-3.5">
                                <StatusChip status={e.status} />
                              </td>
                              <td className="px-6 py-3.5">
                                <StatusChip status={e.registrationStatus} />
                              </td>
                            </tr>
                          ))}
                          {organizedEvents.length === 0 && registeredEvents.length === 0 && (
                            <tr className="border-t border-line-soft">
                              <td colSpan={4} className="px-6 py-5 text-ink-muted">
                                No events yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Panel>

                  <Panel title="Workshops">
                    <div className="flex flex-wrap gap-x-8 gap-y-1 border-b border-line-soft px-6 py-3 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
                      <span>Instructed: {instructedWorkshops.length}</span>
                      <span>Registered: {registeredWorkshops.length}</span>
                    </div>
                    {registeredWorkshops.length === 0 ? (
                      <Empty>No workshop registrations.</Empty>
                    ) : (
                      <ul className="m-0 list-none p-0">
                        {registeredWorkshops.map((w) => (
                          <li
                            key={w.id}
                            className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-6 py-3.5 last:border-b-0"
                          >
                            <span className="min-w-0 font-medium">{w.title}</span>
                            <span className="flex flex-wrap gap-2">
                              <StatusChip status={w.status} />
                              <StatusChip status={w.registrationStatus} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Panel>
                </div>

                <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-6">
                  <section className="flex flex-col gap-4 rounded-lg bg-ink p-6 text-night-text">
                    <h2 className="m-0 font-display text-lg font-semibold">You&apos;re registered</h2>
                    {upcomingEvents.length === 0 ? (
                      <p className="m-0 border-t border-night-line pt-3.5 text-sm text-night-soft">
                        No upcoming events.{" "}
                        <Link href="/Events" className="font-semibold text-signal-light no-underline hover:text-night-text">
                          Find one →
                        </Link>
                      </p>
                    ) : (
                      upcomingEvents.slice(0, 4).map((e) => {
                        const d = dateParts(e.startDate);
                        return (
                          <div key={e.id} className="flex items-center gap-3.5 border-t border-night-line pt-3.5">
                            <span className="flex w-[52px] shrink-0 flex-col items-center rounded-md bg-night-raised py-1.5">
                              <span className="font-mono text-[10px] text-signal-light">{d.month}</span>
                              <span className="font-display text-xl font-semibold">{d.day}</span>
                            </span>
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="text-[15px] font-semibold">{e.title}</span>
                              <span className="text-[13px] text-night-muted">
                                {titleCase(e.type)}
                                {e.status ? ` · ${titleCase(e.status)}` : ""}
                              </span>
                            </span>
                          </div>
                        );
                      })
                    )}
                  </section>

                  <section className="nb-card flex flex-col gap-3 p-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="m-0 font-display text-lg font-semibold">Profile</h2>
                      <Link href="/ProfileCompletion" className="nb-link text-sm">
                        Edit
                      </Link>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">{user.displayName}</span>
                      <span className="text-sm text-ink-muted">
                        {[titleCase(user.role), user.department].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-muted">Profile completion</span>
                      <span className="font-mono">{completion}%</span>
                    </div>
                    <span
                      className="h-1.5 overflow-hidden rounded-[3px] bg-[#E6E7E1]"
                      role="progressbar"
                      aria-label="Profile completion"
                      aria-valuenow={completion}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span className="block h-full bg-signal" style={{ width: `${completion}%` }} />
                    </span>
                    {completion < 100 && (
                      <Link href="/ProfileCompletion" className="nb-btn nb-btn-secondary nb-btn-sm mt-1 self-start">
                        Complete profile <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    )}
                  </section>

                  <section className="nb-card flex flex-col p-6">
                    <h2 className="m-0 mb-3 font-display text-lg font-semibold">Recent inbox</h2>
                    {inbox.length === 0 ? (
                      <p className="m-0 border-t border-line-soft pt-3 text-sm text-ink-muted">No recent messages.</p>
                    ) : (
                      inbox.map((m) => (
                        <div key={m.id} className="flex gap-3 border-t border-line-soft py-2.5">
                          {m.isRead === false ? (
                            <Mail size={16} className="mt-0.5 shrink-0 text-signal-text" role="img" aria-label="Unread" />
                          ) : (
                            <MailOpen size={16} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
                          )}
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span className={`text-sm leading-snug ${m.isRead === false ? "font-semibold" : ""}`}>
                              {m.subject || "(No subject)"}
                            </span>
                            <span className="font-mono text-[11px] uppercase text-ink-muted">
                              {new Date(m.createdAt).toLocaleString()}
                            </span>
                          </span>
                        </div>
                      ))
                    )}
                  </section>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
