"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../contexts/AuthContext";
import { ActivityDashboardSkeleton } from "@/components/PageSkeletons";

export default function MyActivityPage() {
  const { getMyDashboard } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        console.debug('[MyActivity] Loading dashboard...');
        const res = await getMyDashboard();
        console.debug('[MyActivity] Dashboard response:', res);
        if (isMounted) {
          if (res.success) setDashboard(res.dashboard);
          else setError(res.error || "Failed to load activity");
        }
      } catch (e) {
        console.error('[MyActivity] Load error:', e);
        if (isMounted) setError(e.message || "Failed to load activity");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [getMyDashboard]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p className="nb-page-eyebrow">NEWTONBOTICS / MEMBER DASHBOARD</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-6">My Activity</h1>

          {loading && <ActivityDashboardSkeleton />}
          {error && (
            <div className="text-red-400">{error}</div>
          )}

          {!loading && !error && dashboard && (
            <div className="grid gap-6">
              {/* Profile summary */}
              <div className="nb-item-card bg-white/[0.04] p-5">
                <div className="text-lg font-semibold mb-2">Profile</div>
                <div className="text-white/80">{dashboard?.user?.displayName}</div>
                <div className="text-white/60 capitalize">{dashboard?.user?.role} • {dashboard?.user?.department}</div>
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${dashboard?.user?.profileCompletion || 0}%` }} />
                </div>
                <div className="text-xs text-white/60 mt-1">Profile completion {dashboard?.user?.profileCompletion || 0}%</div>
              </div>

              {/* Projects */}
              <div className="nb-item-card bg-white/[0.04] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">Projects</div>
                  <div className="text-white/60">Total: {dashboard?.projects?.total || 0}</div>
                </div>
                <div className="grid gap-3">
                  {(dashboard?.projects?.items || []).map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{p.title}</div>
                        <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 capitalize">{p.status}</span>
                      </div>
                      <div className="text-white/60 text-sm">Category: {p.category} • Team size: {p.teamSize}</div>
                      <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${p.progress || 0}%` }} />
                      </div>
                    </div>
                  ))}
                  {(!dashboard?.projects?.items || dashboard.projects.items.length === 0) && (
                    <div className="text-white/60">No projects yet.</div>
                  )}
                </div>
              </div>

              {/* Events */}
              <div className="nb-item-card bg-white/[0.04] p-5">
                <div className="text-lg font-semibold mb-3">Events</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-white/80 font-medium mb-2">Organized</div>
                    <div className="grid gap-2">
                      {(dashboard?.events?.organized || []).map((e) => (
                        <div key={e._id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="font-medium">{e.title}</div>
                          <div className="text-white/60 text-sm capitalize">{e.type} • {e.status}</div>
                        </div>
                      ))}
                      {(!dashboard?.events?.organized || dashboard.events.organized.length === 0) && <div className="text-white/60">None</div>}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/80 font-medium mb-2">Registered</div>
                    <div className="grid gap-2">
                      {(dashboard?.events?.registered || []).map((e) => (
                        <div key={e.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="font-medium">{e.title}</div>
                          <div className="text-white/60 text-sm capitalize">{e.type} • {e.status} • {e.registrationStatus}</div>
                        </div>
                      ))}
                      {(!dashboard?.events?.registered || dashboard.events.registered.length === 0) && <div className="text-white/60">None</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Workshops */}
              <div className="nb-item-card bg-white/[0.04] p-5">
                <div className="text-lg font-semibold mb-3">Workshops</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-white/80 font-medium mb-2">Instructed</div>
                    <div className="text-white/60">{(dashboard?.workshops?.instructed || []).length || 0}</div>
                  </div>
                  <div>
                    <div className="text-white/80 font-medium mb-2">Registered</div>
                    <div className="grid gap-2">
                      {(dashboard?.workshops?.registered || []).map((w) => (
                        <div key={w.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="font-medium">{w.title}</div>
                          <div className="text-white/60 text-sm capitalize">{w.status} • {w.registrationStatus}</div>
                        </div>
                      ))}
                      {(!dashboard?.workshops?.registered || dashboard.workshops.registered.length === 0) && <div className="text-white/60">None</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Communications */}
              <div className="nb-item-card bg-white/[0.04] p-5">
                <div className="text-lg font-semibold mb-3">Communications</div>
                <div className="text-white/60 text-sm">Inbox: {dashboard?.communications?.inboxCount || 0} • Sent: {dashboard?.communications?.sentCount || 0}</div>
                <div className="mt-3 grid gap-2">
                  {(dashboard?.communications?.recentInbox || []).map((m) => (
                    <div key={m.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="font-medium">{m.subject}</div>
                      <div className="text-white/60 text-sm">{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                  {(!dashboard?.communications?.recentInbox || dashboard.communications.recentInbox.length === 0) && <div className="text-white/60">No recent inbox</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}


