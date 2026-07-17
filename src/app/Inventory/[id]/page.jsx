"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import inventoryService from "../../../lib/inventory";
import authService from "../../../lib/auth";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { API_BASE_URL } from "@/lib/api";

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
  const canManage = isAuthenticated && (["mentor","researcher","admin"].includes(role) || hasInventoryManagementSubrole);
  const isAdmin = isAuthenticated && (["mentor","researcher","admin"].includes(role) || hasInventoryManagementSubrole);

  const refresh = async () => {
    try{
      setLoading(true);
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
      console.log('Loaded active checkouts:', checkouts);
      console.log('Checkout IDs:', checkouts.map(c => ({ id: c.id, _id: c._id, userId: c.userId })));
      setActiveCheckouts(checkouts);
    } catch (e) {
      console.error('Failed to load active checkouts:', e);
    }
  };

  const loadProjects = async () => {
    try {
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>;
  if (!item) return <div className="min-h-screen flex items-center justify-center text-white/70">Not found</div>;

  const status = item.status;
  const statusClass = status === 'available' ? 'bg-green-600' : status === 'low_stock' ? 'bg-yellow-600' : status === 'out_of_stock' ? 'bg-red-600' : 'bg-white/20';

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
        
        console.log('Selected checkout ID from state:', selectedCheckoutId);
        console.log('Selected checkout object:', selectedCheckout);
        console.log('All active checkouts with IDs:', activeCheckouts.map(c => ({
          id: c.id,
          _id: c._id,
          checkoutId: c.checkoutId,
          userId: c.userId,
          allKeys: Object.keys(c)
        })));
        
        if (!selectedCheckout) {
          setActionError(`Selected checkout not found. Please refresh and select again.`);
          return;
        }
        
        // Use the ID from the checkout object to ensure we have the correct format
        const finalCheckoutId = selectedCheckout.id || selectedCheckout._id || selectedCheckout.checkoutId || selectedCheckoutId.trim();
        payload.checkoutId = finalCheckoutId;
        console.log('Final checkout ID being sent:', payload.checkoutId);
      } else if (activeCheckouts.length > 0) {
        // If there are active checkouts but no selection, this should not happen due to validation
        setActionError('Please select a checkout to return');
        return;
      }
      
      // Only include quantity if specified (for partial returns)
      if (returnQty && returnQty > 0 && returnQty !== '' && !isNaN(returnQty)) {
        payload.quantity = parseInt(returnQty, 10);
        console.log('Return quantity:', payload.quantity);
      }
      
      if (returnNotes.trim()) {
        payload.returnNotes = returnNotes.trim();
      }

      console.log('Final return payload:', JSON.stringify(payload, null, 2));
      console.log('Equipment ID:', item._id);
      
      const result = await inventoryService.returnEquipment(item._id, payload);
      console.log('Return result:', result);
      
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

  return (
    <div className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <div className={`px-3 py-1 rounded-full text-sm ${statusClass}`}>{status.replace(/_/g,' ')}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="text-white/80">Current Qty: <span className="text-white">{item.currentQuantity}</span></div>
            <div className="text-white/80">Min Qty: <span className="text-white">{item.minQuantity || 0}</span></div>
            <div className="text-white/80">Available: <span className="text-white">{item.currentQuantity > 0 ? 'Yes' : 'No'}</span></div>
            {item.location && <div className="text-white/80">Location: <span className="text-white">{item.location}</span></div>}
            {item.description && <div className="text-white/80">Description: <span className="text-white">{item.description}</span></div>}
          </div>
          <div>
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="w-full rounded-lg border border-white/10 object-contain max-h-72 bg-white/5" />
            )}
          </div>
        </div>

        {/* Active Checkouts */}
        {activeCheckouts.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-yellow-300">Active Checkouts ({activeCheckouts.length})</h3>
            <div className="space-y-2">
              {activeCheckouts.map((checkout) => (
                <div key={checkout.id} className="text-sm text-white/80">
                  <span className="font-medium">{checkout.userNameSnapshot || checkout.userId}</span>
                  {' - '}
                  Qty: {checkout.quantity}
                  {checkout.projectName && ` - Project: ${checkout.projectName}`}
                  {checkout.expectedReturnDate && ` - Expected: ${new Date(checkout.expectedReturnDate).toLocaleDateString()}`}
                  {checkout.status === 'overdue' && <span className="ml-2 text-red-400">(Overdue)</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {canManage ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button 
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
              className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-center disabled:opacity-50"
            >
              Checkout
            </button>
            <button 
              onClick={async ()=>{ 
                setActionError(""); 
                setSelectedCheckoutId("");
                setReturnQty(1);
                setReturnNotes("");
                // Load active checkouts before opening modal
                const activeData = await inventoryService.getActiveCheckouts(params.id);
                const activeList = activeData.activeCheckouts || [];
                console.log('Active checkouts loaded:', activeList);
                console.log('Checkout IDs:', activeList.map(c => ({ id: c.id, _id: c._id })));
                setActiveCheckouts(activeList);
                
                // Auto-select if only one active checkout
                if (activeList.length === 1) {
                  const checkoutId = activeList[0].id || activeList[0]._id;
                  console.log('Auto-selecting checkout ID:', checkoutId);
                  setSelectedCheckoutId(checkoutId);
                }
                setIsReturnOpen(true); 
              }} 
              className="px-4 py-3 rounded-lg bg-green-600/80 hover:bg-green-600 text-white text-center"
            >
              Return
            </button>
          </div>
        ) : (
          <div className="mt-6 text-white/70">You don't have permission to manage this equipment.</div>
        )}

        {/* Checkout History */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Checkout History</h2>
            <button 
              onClick={loadCheckouts} 
              disabled={loadingCheckouts}
              className="text-sm text-white/60 hover:text-white/80 disabled:opacity-50"
            >
              {loadingCheckouts ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {loadingCheckouts ? (
            <div className="text-center py-8 text-white/60">Loading checkouts...</div>
          ) : checkouts.length === 0 ? (
            <div className="text-center py-8 text-white/60">No checkout history</div>
          ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-3 py-2 text-left">User</th>
                    <th className="px-3 py-2 text-left">Quantity</th>
                  <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Project</th>
                  <th className="px-3 py-2 text-left">Checkout Date</th>
                  <th className="px-3 py-2 text-left">Expected Return</th>
                  <th className="px-3 py-2 text-left">Actual Return</th>
                    <th className="px-3 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                  {checkouts.map((c)=>{
                  return (
                      <tr key={c.id} className="border-t border-white/10">
                        <td className="px-3 py-2">{c.userNameSnapshot || c.userId || '—'}</td>
                        <td className="px-3 py-2">{c.quantity}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            c.status === 'returned' ? 'bg-green-500/20 text-green-300' :
                            c.status === 'overdue' ? 'bg-red-500/20 text-red-300' :
                            c.status === 'project_use' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {(c.status||'checked_out').replace(/_/g,' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2">{c.projectName || '—'}</td>
                      <td className="px-3 py-2">{c.checkoutDate ? new Date(c.checkoutDate).toLocaleDateString() : '—'}</td>
                      <td className="px-3 py-2">{c.expectedReturnDate ? new Date(c.expectedReturnDate).toLocaleDateString() : '—'}</td>
                      <td className="px-3 py-2">{c.actualReturnDate ? new Date(c.actualReturnDate).toLocaleDateString() : '—'}</td>
                        <td className="px-3 py-2 text-xs text-white/60 max-w-xs truncate" title={c.checkoutNotes || c.returnNotes || ''}>
                          {c.checkoutNotes || c.returnNotes || '—'}
                        </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast.visible && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg border ${toast.kind === 'success' ? 'bg-green-600/90 border-green-500 text-white' : 'bg-red-600/90 border-red-500 text-white'}`}>
          {toast.message}
        </div>
      )}

      {/* Enhanced Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={()=>setIsCheckoutOpen(false)}>
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4 text-white">Checkout - {item.name}</h3>
            {actionError && <div className="mb-3 text-sm text-red-400">{actionError}</div>}
            
            <div className="space-y-4">
              {isAdmin && (
                <div>
                  <label className="block mb-1 text-sm text-white/80">Checkout for Team Member (optional - leave empty for yourself)</label>
                  <select
                    value={checkoutUserId}
                    onChange={(e)=>setCheckoutUserId(e.target.value)}
                    className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
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
                  {loadingUsers && <div className="text-xs text-white/60 mt-1">Loading team members...</div>}
                  {!loadingUsers && users.length === 0 && <div className="text-xs text-white/60 mt-1">No team members found</div>}
                </div>
              )}

              <div>
                <label className="block mb-1 text-sm text-white/80">Quantity</label>
                <input 
                  type="number" 
                  min={1} 
                  max={item.currentQuantity}
                  value={checkoutQty} 
                  onChange={(e)=>setCheckoutQty(Math.max(1, Math.min(item.currentQuantity, Number(e.target.value||1))))} 
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" 
                />
                <div className="text-xs text-white/60 mt-1">Available: {item.currentQuantity}</div>
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2 text-sm text-white/80">
                  <input 
                    type="checkbox" 
                    checked={isProjectUse} 
                    onChange={(e)=>setIsProjectUse(e.target.checked)} 
                    className="rounded"
                  />
                  <span>For project use (may not return)</span>
                </label>
              </div>

              {isProjectUse && (
                <div>
                  <label className="block mb-1 text-sm text-white/80">Project (optional)</label>
                  <select
                    value={projectId}
                    onChange={(e)=>setProjectId(e.target.value)}
                    className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                  >
                    <option value="">Select a project (optional)</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {!isProjectUse && (
                <div>
                  <label className="block mb-1 text-sm text-white/80">Expected Return Date (optional)</label>
                  <input 
                    type="date" 
                    value={checkoutDue} 
                    onChange={(e)=>setCheckoutDue(e.target.value)} 
                    className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" 
                  />
                </div>
              )}

              <div>
                <label className="block mb-1 text-sm text-white/80">Notes (optional)</label>
                <textarea
                  value={checkoutNotes}
                  onChange={(e)=>setCheckoutNotes(e.target.value)}
                  placeholder="Add checkout notes..."
                  rows={3}
                  maxLength={1000}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white resize-none"
                />
                <div className="text-xs text-white/60 mt-1">{checkoutNotes.length}/1000</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10" onClick={()=>setIsCheckoutOpen(false)}>Cancel</button>
              <button className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white" onClick={handleCheckout}>
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Return Modal */}
      {isReturnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={()=>setIsReturnOpen(false)}>
          <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-xl p-6" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4 text-white">Return - {item.name}</h3>
            {actionError && <div className="mb-3 text-sm text-red-400">{actionError}</div>}
            
            {activeCheckouts.length > 0 ? (
              <div className="mb-4">
                <label className="block mb-2 text-sm text-white/80">
                  Select Checkout {activeCheckouts.length > 1 && <span className="text-red-400">*</span>}
                </label>
                <select
                  value={selectedCheckoutId}
                  onChange={(e)=>{
                    console.log('Selected checkout ID from dropdown:', e.target.value);
                    setSelectedCheckoutId(e.target.value);
                  }}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white mb-2"
                  required={activeCheckouts.length > 0}
                >
                  <option value="">Select a checkout...</option>
                  {activeCheckouts.map((checkout, idx) => {
                    // Try multiple possible ID field names - checkout ID is different from user ID
                    // The checkout ID should be the record ID, not the userId
                    const checkoutId = checkout.id || checkout._id || checkout.checkoutId;
                    
                    // Debug: Log checkout structure for first item
                    if (idx === 0) {
                      console.log('=== CHECKOUT OBJECT STRUCTURE ===');
                      console.log('Full checkout object:', JSON.stringify(checkout, null, 2));
                      console.log('Checkout ID fields:', { 
                        id: checkout.id, 
                        _id: checkout._id, 
                        checkoutId: checkout.checkoutId,
                        userId: checkout.userId,
                        equipmentId: checkout.equipmentId
                      });
                      console.log('All keys:', Object.keys(checkout));
                    }
                    
                    if (!checkoutId) {
                      console.error('⚠️ Checkout missing ID at index', idx, ':', checkout);
                      console.error('Available keys:', Object.keys(checkout));
                    } else {
                      console.log(`✓ Checkout ${idx} ID:`, checkoutId, 'User:', checkout.userId);
                    }
                    
                    const userName = checkout.userNameSnapshot || checkout.userName || checkout.user?.fullName || checkout.user?.name || checkout.userId || 'Unknown';
                    const displayText = `${userName} - Qty: ${checkout.quantity}${checkout.projectName ? ` - ${checkout.projectName}` : ''}${checkout.expectedReturnDate ? ` (Due: ${new Date(checkout.expectedReturnDate).toLocaleDateString()})` : ''}`;
                    
                    // Ensure we're using the checkout ID, not the user ID
                    const finalId = checkoutId;
                    
                    return (
                      <option key={finalId || `checkout-${idx}`} value={finalId || ''}>
                        {displayText} {finalId ? `[ID: ${finalId.substring(0, 8)}...]` : '[NO ID]'}
                      </option>
                    );
                  })}
                </select>
                <div className="text-xs text-white/40 mt-1">
                  Selected: {selectedCheckoutId || 'None'}
                </div>
                {activeCheckouts.length === 1 && (
                  <div className="text-xs text-white/60 mt-1">Only one active checkout found - auto-selected</div>
                )}
              </div>
            ) : (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="text-sm text-yellow-300">No active checkouts found for this equipment.</div>
              </div>
            )}

            <div className="space-y-4 mb-4">
              <div>
                <label className="block mb-1 text-sm text-white/80">Return Quantity (optional - for partial returns)</label>
                <input 
                  type="number" 
                  min={1}
                  value={returnQty} 
                  onChange={(e)=>setReturnQty(Number(e.target.value) || 1)} 
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" 
                  placeholder="Leave empty for full return"
                />
                <div className="text-xs text-white/60 mt-1">Leave empty to return all items from selected checkout</div>
              </div>

              <div>
                <label className="block mb-1 text-sm text-white/80">Return Notes (optional)</label>
                <textarea
                  value={returnNotes}
                  onChange={(e)=>setReturnNotes(e.target.value)}
                  placeholder="Add return notes..."
                  rows={3}
                  maxLength={1000}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white resize-none"
                />
                <div className="text-xs text-white/60 mt-1">{returnNotes.length}/1000</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10" onClick={()=>setIsReturnOpen(false)}>Cancel</button>
              <button className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white" onClick={handleReturn}>
                Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
