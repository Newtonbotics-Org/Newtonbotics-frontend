"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import inventoryService from "../../../lib/inventory";
import authService from "../../../lib/auth";
import { useAuth } from "../../../contexts/AuthContext";
import { DetailPageSkeleton } from "@/components/PageSkeletons";
import { API_BASE_URL } from "@/lib/api";
import { isDemoMode } from "@/lib/demoMode";
import { getDemoEquipmentById, getDemoProjects } from "@/lib/demoStore";
import { ArrowLeft, LogIn, LogOut, RefreshCw } from "lucide-react";
import BlueprintPlaceholder from "@/components/lab/BlueprintPlaceholder";
import InventoryDialog from "@/components/inventory/InventoryDialog";
import { Alert, DemoBanner, Field, Toast, checkoutChip, equipmentStatusChip } from "@/components/inventory/InventoryUi";
import styles from "@/components/inventory/inventory.module.css";
import { optimizeImageUrl } from "@/lib/cloudinaryMedia";

const DEMO = isDemoMode();

export default function EquipmentDetailPage(){
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, hasSubrole } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", kind: "success" });
  const [actionError, setActionError] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [checkoutQty, setCheckoutQty] = useState(1);
  const [checkoutDue, setCheckoutDue] = useState("");
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isProjectUse, setIsProjectUse] = useState(false);
  const [checkoutUserId, setCheckoutUserId] = useState(""); // For admin checkout
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [projects, setProjects] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [activeCheckouts, setActiveCheckouts] = useState([]);
  const [loadingCheckouts, setLoadingCheckouts] = useState(false);
  const [selectedCheckoutId, setSelectedCheckoutId] = useState("");
  const [returnQty, setReturnQty] = useState(1);
  const [returnNotes, setReturnNotes] = useState("");

  const role = user?.role || null;
  const hasInventoryManagementSubrole = hasSubrole('inventory_manager') || hasSubrole('inventory_management');
  const canManage = !DEMO && isAuthenticated && (["mentor","researcher","admin"].includes(role) || hasInventoryManagementSubrole);
  const isAdmin = isAuthenticated && (["mentor","researcher","admin"].includes(role) || hasInventoryManagementSubrole);

  const refresh = async () => {
    try{
      setLoading(true);
      if (DEMO) {
        const data = getDemoEquipmentById(params.id);
        if (!data) throw new Error("Demo equipment not found.");
        setItem(data);
        setCheckouts([]);
        setActiveCheckouts([]);
        return;
      }
      const data = await inventoryService.getEquipment(params.id);
      setItem(data);
      await loadCheckouts();
      await loadActiveCheckouts();
    }catch(e){
      setError(e.message||"Failed to load equipment");
    }finally{ setLoading(false); }
  };

  const loadCheckouts = async () => {
    try {
      setLoadingCheckouts(true);
      const data = await inventoryService.getEquipmentCheckouts(params.id, { limit: 50 });
      setCheckouts(data.items || []);
    } catch (e) {
      console.error('Failed to load checkouts:', e);
    } finally {
      setLoadingCheckouts(false);
    }
  };

  const loadActiveCheckouts = async () => {
    try {
      const data = await inventoryService.getActiveCheckouts(params.id);
      const checkouts = data.activeCheckouts || [];
      setActiveCheckouts(checkouts);
    } catch (e) {
      console.error('Failed to load active checkouts:', e);
    }
  };

  const loadProjects = async () => {
    try {
      if (DEMO) {
        setProjects(getDemoProjects());
        return;
      }
      const res = await fetch(`${API_BASE_URL}/projects?limit=100`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data.projects) {
          setProjects(data.data.projects || []);
        }
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  };

  const loadUsers = async (search = "") => {
    if (!isAdmin) return;
    try {
      setLoadingUsers(true);
      // Fetch team members from public endpoint
      const query = search ? `?q=${encodeURIComponent(search)}&limit=100` : "?limit=100";
      const res = await fetch(`${API_BASE_URL}/public/team-members${query}`, {
        cache: 'no-store'
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const usersList = data.data.items || data.data || [];
          setUsers(usersList);
        }
      }
    } catch (e) {
      console.error('Failed to load team members:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(()=>{
    let isMounted = true;
    (async()=>{
      try{
        setLoading(true);
        setError("");
        if (DEMO) {
          const data = getDemoEquipmentById(params.id);
          if (!isMounted) return;
          if (!data) throw new Error("Demo equipment not found.");
          setItem(data);
          setCheckouts([]);
          setActiveCheckouts([]);
          setProjects(getDemoProjects());
          return;
        }
        const data = await inventoryService.getEquipment(params.id);
        if(!isMounted) return;
        setItem(data);
        await loadCheckouts();
        await loadActiveCheckouts();
        await loadProjects();
      }catch(e){
        if(!isMounted) return;
        setError(e.message||"Failed to load equipment");
      }finally{ if(isMounted) setLoading(false); }
    })();
    return ()=>{ isMounted=false; };
  },[params.id]);

  if (loading) return <DetailPageSkeleton />;
  if (error || !item) {
    return (
      <main className="nb-dark bg-paper text-ink">
        <div className="nb-container flex flex-col items-start gap-4 pb-28 pt-16">
          <Link href="/Inventory" className="inline-flex min-h-[44px] items-center gap-2 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted hover:text-ink">
            <ArrowLeft size={16} aria-hidden="true" /> Back to inventory
          </Link>
          <div role={error ? "alert" : undefined} className="nb-card flex w-full flex-wrap items-center gap-8 p-8 sm:p-10">
            <div className="flex min-w-0 flex-[1_1_260px] flex-col items-start gap-3">
              <h1 className="m-0 font-display text-3xl font-semibold tracking-[-0.02em]">{error ? "Equipment couldn't be loaded" : "Not found"}</h1>
              <p className="m-0 text-ink-muted">{error || "This equipment record doesn't exist or was removed."}</p>
            </div>
            <BlueprintPlaceholder label="Equipment not found" className="h-[220px] min-w-0 flex-[1.4_1_320px] rounded-md border border-line" />
          </div>
        </div>
      </main>
    );
  }

  const status = item.status;
  const categoryName = typeof item.categoryId === "object" ? item.categoryId?.name : "";

  const handleCheckout = async () => {
    try {
      setActionError("");
      if(!checkoutQty || checkoutQty < 1){ 
        setActionError('Quantity must be at least 1'); 
        return; 
      }
      
      const payload = {
        quantity: checkoutQty,
        checkoutNotes: checkoutNotes.trim() || undefined
      };

      // Admin can checkout for other users
      if (isAdmin && checkoutUserId) {
        payload.userId = checkoutUserId;
      }

      // If project use, don't set expected return date
      if (isProjectUse && projectId) {
        payload.projectId = projectId;
      } else if (checkoutDue) {
        payload.expectedReturnDate = new Date(checkoutDue).toISOString();
      }

      await inventoryService.checkoutEquipment(item._id, payload);
      setIsCheckoutOpen(false);
      setCheckoutQty(1);
      setCheckoutDue("");
      setCheckoutNotes("");
      setProjectId("");
      setIsProjectUse(false);
      setToast({ visible:true, message:'Checked out successfully', kind:'success' });
      setTimeout(()=>setToast({ visible:false, message:'', kind:'success' }), 2000);
      await refresh();
    } catch(err) { 
      setActionError(err.message||'Checkout failed'); 
    }
  };

  const handleReturn = async () => {
    try {
      setActionError("");
      
      // If there are active checkouts, require selection
      if (activeCheckouts.length > 0 && !selectedCheckoutId) {
        setActionError('Please select a checkout to return');
        return;
      }
      
      const payload = {};
      
      // Always include checkoutId if selected - this is REQUIRED when there are active checkouts
      if (selectedCheckoutId && selectedCheckoutId.trim()) {
        // Find the selected checkout to get the correct ID format
        const selectedCheckout = activeCheckouts.find(c => {
          const cId = String(c.id || c._id || c.checkoutId || '').trim();
          const selectedId = String(selectedCheckoutId).trim();
          return cId === selectedId;
        });
        
        
        if (!selectedCheckout) {
          setActionError(`Selected checkout not found. Please refresh and select again.`);
          return;
        }
        
        // Use the ID from the checkout object to ensure we have the correct format
        const finalCheckoutId = selectedCheckout.id || selectedCheckout._id || selectedCheckout.checkoutId || selectedCheckoutId.trim();
        payload.checkoutId = finalCheckoutId;
      } else if (activeCheckouts.length > 0) {
        // If there are active checkouts but no selection, this should not happen due to validation
        setActionError('Please select a checkout to return');
        return;
      }
      
      // Only include quantity if specified (for partial returns)
      if (returnQty && returnQty > 0 && returnQty !== '' && !isNaN(returnQty)) {
        payload.quantity = parseInt(returnQty, 10);
      }
      
      if (returnNotes.trim()) {
        payload.returnNotes = returnNotes.trim();
      }

      
      await inventoryService.returnEquipment(item._id, payload);
      
      setIsReturnOpen(false);
      setSelectedCheckoutId("");
      setReturnQty(1);
      setReturnNotes("");
      setToast({ visible:true, message:'Returned successfully', kind:'success' });
      setTimeout(()=>setToast({ visible:false, message:'', kind:'success' }), 2000);
      await refresh();
    } catch(err) { 
      console.error('Return error:', err);
      setActionError(err.message||'Return failed'); 
    }
  };

  const specs = [
    ["Current qty", item.currentQuantity],
    ["Min qty", item.minQuantity || 0],
    ["Available", item.currentQuantity > 0 ? "Yes" : "No"],
    ...(item.location ? [["Location", item.location]] : []),
  ];

  return (
    <main className="nb-dark bg-paper text-ink">
      <header className="nb-blueprint border-b border-line">
        <div className="nb-container flex flex-col gap-5 pb-12 pt-10 sm:pt-14">
          <nav aria-label="Inventory breadcrumb">
            <Link href="/Inventory" className="inline-flex min-h-[44px] items-center gap-2 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted hover:text-ink">
              <ArrowLeft size={16} aria-hidden="true" /> Back to inventory
            </Link>
          </nav>
          <span className="nb-eyebrow">
            <span className="nb-eyebrow-num">[INV]</span> {categoryName || "Lab equipment"}
          </span>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="nb-h1 m-0 max-w-[900px]">{item.name}</h1>
            <span className={`nb-chip ${equipmentStatusChip(status)}`}>{String(status || "unknown").replace(/_/g, " ")}</span>
          </div>
        </div>
      </header>

      <div className="nb-container flex flex-col gap-8 pb-28 pt-10">
        {DEMO && (
          <DemoBanner>
            Showing local sample component details. Checkout and return stay disabled so demo data is never sent to the real API.
          </DemoBanner>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="nb-card overflow-hidden">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={optimizeImageUrl(item.imageUrl, { width: 640 })} alt={item.name} decoding="async" className="h-[320px] w-full bg-surface object-contain p-6" />
            ) : (
              <BlueprintPlaceholder label="No photo" className="h-[320px]" />
            )}
          </div>
          <div className="nb-card flex flex-col gap-6 p-6 sm:p-8">
            <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-5">
              {specs.map(([label, value]) => (
                <div key={label} className="flex min-w-0 flex-col gap-1">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">{label}</dt>
                  <dd className="m-0 break-words font-display text-xl font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            {item.description && (
              <div className="flex flex-col gap-1 border-t border-line pt-5">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">Description</span>
                <p className="m-0 text-ink-body">{item.description}</p>
              </div>
            )}

            <div className="mt-auto border-t border-line pt-5">
              {DEMO ? (
                <p className="m-0 text-sm text-ink-muted">
                  Demo mode keeps checkout/return offline. Use Add / Edit / Delete on the General Lab catalogue to change sample stock locally.
                </p>
              ) : canManage ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={item.currentQuantity===0}
                    onClick={async ()=>{
                      setActionError("");
                      setCheckoutQty(1);
                      setCheckoutDue("");
                      setCheckoutNotes("");
                      setProjectId("");
                      setIsProjectUse(false);
                      setCheckoutUserId("");
                      if (isAdmin) {
                        await loadUsers();
                      }
                      setIsCheckoutOpen(true);
                    }}
                    className="nb-btn nb-btn-primary"
                  >
                    <LogOut size={18} aria-hidden="true" /> Checkout
                  </button>
                  <button
                    type="button"
                    onClick={async ()=>{
                      setActionError("");
                      setSelectedCheckoutId("");
                      setReturnQty(1);
                      setReturnNotes("");
                      // Load active checkouts before opening modal
                      const activeData = await inventoryService.getActiveCheckouts(params.id);
                      const activeList = activeData.activeCheckouts || [];
                      setActiveCheckouts(activeList);

                      // Auto-select if only one active checkout
                      if (activeList.length === 1) {
                        const checkoutId = activeList[0].id || activeList[0]._id;
                        setSelectedCheckoutId(checkoutId);
                      }
                      setIsReturnOpen(true);
                    }}
                    className="nb-btn nb-btn-secondary"
                  >
                    <LogIn size={18} aria-hidden="true" /> Return
                  </button>
                </div>
              ) : (
                <p className="m-0 text-sm text-ink-muted">You don&apos;t have permission to manage this equipment.</p>
              )}
            </div>
          </div>
        </div>

        {/* Active Checkouts */}
        {activeCheckouts.length > 0 && (
          <section aria-labelledby="active-checkouts-title" className="rounded-lg border border-[#EBD9A8] bg-[#FDF1D8] p-5 text-[#854D0E]">
            <h2 id="active-checkouts-title" className="m-0 mb-3 font-display text-lg font-semibold">Active checkouts ({activeCheckouts.length})</h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
              {activeCheckouts.map((checkout) => (
                <li key={checkout.id}>
                  <span className="font-semibold">{checkout.userNameSnapshot || checkout.userId}</span>
                  {' · '}
                  Qty: {checkout.quantity}
                  {checkout.projectName && ` · Project: ${checkout.projectName}`}
                  {checkout.expectedReturnDate && ` · Expected: ${new Date(checkout.expectedReturnDate).toLocaleDateString()}`}
                  {checkout.status === 'overdue' && <span className="nb-chip nb-chip-red ml-2">Overdue</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Checkout History */}
        <section aria-labelledby="checkout-history-title" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="checkout-history-title" className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Checkout history</h2>
            {!DEMO && (
              <button
                type="button"
                onClick={loadCheckouts}
                disabled={loadingCheckouts}
                className="nb-btn nb-btn-ghost nb-btn-sm"
              >
                <RefreshCw size={16} aria-hidden="true" /> {loadingCheckouts ? 'Loading…' : 'Refresh'}
              </button>
            )}
          </div>
          {DEMO ? (
            <p className="nb-card m-0 p-8 text-center text-ink-muted">No checkout history in demo mode</p>
          ) : loadingCheckouts ? (
            <p className="nb-card m-0 p-8 text-center text-ink-muted" role="status">Loading checkouts…</p>
          ) : checkouts.length === 0 ? (
            <p className="nb-card m-0 p-8 text-center text-ink-muted">No checkout history</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">User</th>
                    <th scope="col">Qty</th>
                    <th scope="col">Status</th>
                    <th scope="col">Project</th>
                    <th scope="col">Checked out</th>
                    <th scope="col">Expected return</th>
                    <th scope="col">Returned</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {checkouts.map((c)=>(
                    <tr key={c.id}>
                      <td className="font-semibold">{c.userNameSnapshot || c.userId || '—'}</td>
                      <td className="font-mono text-[13px]">{c.quantity}</td>
                      <td>
                        <span className={`nb-chip ${checkoutChip(c.status)}`}>{(c.status||'checked_out').replace(/_/g,' ')}</span>
                      </td>
                      <td className="text-ink-muted">{c.projectName || '—'}</td>
                      <td className="font-mono text-[13px]">{c.checkoutDate ? new Date(c.checkoutDate).toLocaleDateString() : '—'}</td>
                      <td className="font-mono text-[13px]">{c.expectedReturnDate ? new Date(c.expectedReturnDate).toLocaleDateString() : '—'}</td>
                      <td className="font-mono text-[13px]">{c.actualReturnDate ? new Date(c.actualReturnDate).toLocaleDateString() : '—'}</td>
                      <td className="max-w-xs truncate text-[13px] text-ink-muted" title={c.checkoutNotes || c.returnNotes || ''}>
                        {c.checkoutNotes || c.returnNotes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <Toast toast={toast} />

      {/* Checkout dialog */}
      {isCheckoutOpen && (
        <InventoryDialog label={`Checkout ${item.name}`} onClose={()=>setIsCheckoutOpen(false)}>
          <div className={styles.dialogPanel}>
            <h2 className="m-0 mb-5 font-display text-2xl font-semibold tracking-[-0.02em]">Checkout · {item.name}</h2>
            {actionError && <Alert className="mb-4">{actionError}</Alert>}

            <div className="flex flex-col gap-5">
              {isAdmin && (
                <Field
                  id="checkout-user"
                  label="Checkout for team member"
                  hint={loadingUsers ? "Loading team members…" : users.length === 0 ? "No team members found" : "Optional — leave as yourself to check out on your own account."}
                >
                  <select
                    id="checkout-user"
                    value={checkoutUserId}
                    onChange={(e)=>setCheckoutUserId(e.target.value)}
                    className="nb-input truncate pr-8"
                  >
                    <option value="">Myself ({user?.firstName} {user?.lastName})</option>
                    {users.map(u => {
                      const displayName = u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.displayName || u.email || 'Unknown';
                      return (
                        <option key={u._id || u.id} value={u._id || u.id}>
                          {displayName} {u.email ? `(${u.email})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </Field>
              )}

              <Field id="checkout-qty" label="Quantity" hint={`Available: ${item.currentQuantity}`}>
                <input
                  id="checkout-qty"
                  type="number"
                  min={1}
                  max={item.currentQuantity}
                  value={checkoutQty}
                  onChange={(e)=>setCheckoutQty(Math.max(1, Math.min(item.currentQuantity, Number(e.target.value||1))))}
                  className="nb-input max-w-[200px]"
                />
              </Field>

              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={isProjectUse}
                  onChange={(e)=>setIsProjectUse(e.target.checked)}
                  className="h-[18px] w-[18px] accent-ink"
                />
                For project use (may not return)
              </label>

              {isProjectUse && (
                <Field id="checkout-project" label="Project (optional)">
                  <select
                    id="checkout-project"
                    value={projectId}
                    onChange={(e)=>setProjectId(e.target.value)}
                    className="nb-input truncate pr-8"
                  >
                    <option value="">Select a project (optional)</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.title}</option>
                    ))}
                  </select>
                </Field>
              )}

              {!isProjectUse && (
                <Field id="checkout-due" label="Expected return date (optional)">
                  <input
                    id="checkout-due"
                    type="date"
                    value={checkoutDue}
                    onChange={(e)=>setCheckoutDue(e.target.value)}
                    className="nb-input"
                  />
                </Field>
              )}

              <Field id="checkout-notes" label="Notes (optional)" hint={`${checkoutNotes.length}/1000`}>
                <textarea
                  id="checkout-notes"
                  value={checkoutNotes}
                  onChange={(e)=>setCheckoutNotes(e.target.value)}
                  placeholder="Add checkout notes…"
                  rows={3}
                  maxLength={1000}
                  className="nb-textarea resize-none"
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button type="button" className="nb-btn nb-btn-secondary nb-btn-sm" onClick={()=>setIsCheckoutOpen(false)}>Cancel</button>
              <button type="button" className="nb-btn nb-btn-primary nb-btn-sm" onClick={handleCheckout}>Checkout</button>
            </div>
          </div>
        </InventoryDialog>
      )}

      {/* Return dialog */}
      {isReturnOpen && (
        <InventoryDialog label={`Return ${item.name}`} onClose={()=>setIsReturnOpen(false)}>
          <div className={styles.dialogPanel}>
            <h2 className="m-0 mb-5 font-display text-2xl font-semibold tracking-[-0.02em]">Return · {item.name}</h2>
            {actionError && <Alert className="mb-4">{actionError}</Alert>}

            <div className="flex flex-col gap-5">
              {activeCheckouts.length > 0 ? (
                <Field
                  id="return-checkout"
                  label="Select checkout"
                  required={activeCheckouts.length > 1}
                  hint={activeCheckouts.length === 1 ? "Only one active checkout found — auto-selected" : undefined}
                >
                  <select
                    id="return-checkout"
                    value={selectedCheckoutId}
                    onChange={(e)=>setSelectedCheckoutId(e.target.value)}
                    className="nb-input truncate pr-8"
                    required={activeCheckouts.length > 0}
                  >
                    <option value="">Select a checkout…</option>
                    {activeCheckouts.map((checkout, idx) => {
                      // The checkout record ID (not the userId) identifies the checkout to return.
                      const checkoutId = checkout.id || checkout._id || checkout.checkoutId;
                      const userName = checkout.userNameSnapshot || checkout.userName || checkout.user?.fullName || checkout.user?.name || checkout.userId || 'Unknown';
                      const displayText = `${userName} · Qty: ${checkout.quantity}${checkout.projectName ? ` · ${checkout.projectName}` : ''}${checkout.expectedReturnDate ? ` (Due: ${new Date(checkout.expectedReturnDate).toLocaleDateString()})` : ''}`;
                      return (
                        <option key={checkoutId || `checkout-${idx}`} value={checkoutId || ''}>
                          {displayText}
                        </option>
                      );
                    })}
                  </select>
                </Field>
              ) : (
                <Alert kind="warning">No active checkouts found for this equipment.</Alert>
              )}

              <Field id="return-qty" label="Return quantity (optional)" hint="For partial returns. Leave empty to return all items from the selected checkout.">
                <input
                  id="return-qty"
                  type="number"
                  min={1}
                  value={returnQty}
                  onChange={(e)=>setReturnQty(Number(e.target.value) || 1)}
                  className="nb-input max-w-[200px]"
                  placeholder="Leave empty for full return"
                />
              </Field>

              <Field id="return-notes" label="Return notes (optional)" hint={`${returnNotes.length}/1000`}>
                <textarea
                  id="return-notes"
                  value={returnNotes}
                  onChange={(e)=>setReturnNotes(e.target.value)}
                  placeholder="Add return notes…"
                  rows={3}
                  maxLength={1000}
                  className="nb-textarea resize-none"
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button type="button" className="nb-btn nb-btn-secondary nb-btn-sm" onClick={()=>setIsReturnOpen(false)}>Cancel</button>
              <button type="button" className="nb-btn nb-btn-primary nb-btn-sm" onClick={handleReturn}>Return</button>
            </div>
          </div>
        </InventoryDialog>
      )}
    </main>
  );
}
