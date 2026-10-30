"use client";
import { useEffect, useMemo, useState } from "react";
import CloudinaryUploader from "@/components/CloudinaryUploader";
import inventoryService from "@/lib/inventory";
import { useAuth } from "@/contexts/AuthContext";
import { isDemoMode } from "@/lib/demoMode";
import {
  getDemoCategories,
  getDemoEquipment,
  setDemoCategories,
  setDemoEquipment,
} from "@/lib/demoStore";
import InventoryCatalogue from "./InventoryCatalogue";
import InventoryDialog from "./InventoryDialog";
import styles from "./inventory.module.css";

const DEMO = isDemoMode();

function categoryIdOf(value) {
  if (!value) return "";
  return typeof value === "object" ? value._id || value.id || "" : String(value);
}

const GeneralLabInventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [limit, setLimit] = useState(20);
  const [skip, setSkip] = useState(0);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, skip: 0, hasMore: false });
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [categoryRetry, setCategoryRetry] = useState(0);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const [refreshTick, setRefreshTick] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    imageUrl: "",
    minQuantity: 0,
    currentQuantity: 0,
    maxQuantity: 0,
    modelNumber: "",
    serialNumber: "",
    manufacturer: "",
    purchaseDate: "",
    purchasePrice: "",
    location: "",
  });
  const [createError, setCreateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    description: "",
    categoryId: "",
    imageUrl: "",
    minQuantity: 0,
    currentQuantity: 0,
    maxQuantity: 0,
    modelNumber: "",
    serialNumber: "",
    manufacturer: "",
    purchaseDate: "",
    purchasePrice: "",
    location: "",
  });
  const [editError, setEditError] = useState("");
  const [createSpecList, setCreateSpecList] = useState([]);
  const [editSpecList, setEditSpecList] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", kind: "success" });
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", description: "", parentCategoryId: "" });
  const [catError, setCatError] = useState("");
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [catEditingId, setCatEditingId] = useState("");
  const [catEditValues, setCatEditValues] = useState({ name: "", description: "", parentCategoryId: "" });
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    if (DEMO) {
      setCategories(getDemoCategories());
      return;
    }
    let isMounted = true;
    const loadInitial = async () => {
      try {
        setCategoryError("");
        const [cats] = await Promise.all([
          inventoryService.listCategories(),
        ]);
        if (!isMounted) return;
        setCategories(cats);
      } catch (e) {
        if (!isMounted) return;
        setCategoryError(e.message || "Failed to load categories");
      }
    };
    loadInitial();
    return () => { isMounted = false; };
  }, [categoryRetry]);

  // Demo mode equipment — local + sessionStorage so detail pages stay in sync
  const [demoItems, setDemoItems] = useState(null);

  useEffect(() => {
    if (!DEMO) return;
    setDemoItems(getDemoEquipment());
  }, []);

  useEffect(() => {
    if (DEMO) {
      if (!demoItems) return;
      setIsLoading(true);
      let filtered = demoItems || [];
      if (categoryFilter) filtered = filtered.filter(it => categoryIdOf(it.categoryId) === categoryFilter);
      if (statusFilter) {
        filtered = filtered.filter(it => {
          if (statusFilter === "available") return Number(it.currentQuantity) > Number(it.minQuantity || 0) && it.status !== "maintenance" && it.status !== "retired";
          if (statusFilter === "low_stock") return Number(it.currentQuantity) > 0 && Number(it.currentQuantity) <= Number(it.minQuantity || 0);
          if (statusFilter === "out_of_stock") return Number(it.currentQuantity) <= 0;
          if (statusFilter === "maintenance") return it.status === "maintenance";
          if (statusFilter === "retired") return it.status === "retired";
          return true;
        });
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        filtered = filtered.filter(it =>
          (it.name || "").toLowerCase().includes(q) ||
          (it.description || "").toLowerCase().includes(q) ||
          (it.manufacturer || "").toLowerCase().includes(q) ||
          (it.modelNumber || "").toLowerCase().includes(q)
        );
      }
      const total = filtered.length;
      const page = filtered.slice(skip, skip + limit);
      setItems(page);
      setPagination({ total, limit, skip, hasMore: skip + limit < total });
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    const loadEquipment = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await inventoryService.listEquipment({
          categoryId: categoryFilter || undefined,
          status: statusFilter || undefined,
          q: searchTerm || undefined,
          limit,
          skip,
        });
        if (!isMounted) return;
        setItems(data.items || []);
        setPagination(data.pagination || { total: 0, limit, skip, hasMore: false });
      } catch (e) {
        if (!isMounted) return;
        setError(e.message || "Failed to load inventory");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    setIsLoading(true);
    const timer = setTimeout(loadEquipment, 250);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [categoryFilter, statusFilter, searchTerm, limit, skip, refreshTick, demoItems]);

  const statusOptions = useMemo(() => ([
    { value: "", label: "All" },
    { value: "available", label: "Available" },
    { value: "low_stock", label: "Low stock" },
    { value: "out_of_stock", label: "Out of stock" },
    { value: "maintenance", label: "Maintenance" },
    { value: "retired", label: "Retired" },
  ]), []);

  const role = user?.role || null;
  const isAdvancedRole = ["mentor", "researcher", "admin"].includes(role);
  const showAdvancedFields = DEMO || isAdvancedRole;
  const canEdit = false;
  const canDelete = false;
  const canManageCategories = false;

  const persistDemoItems = (updater) => {
    setDemoItems((prev) => {
      const value = typeof updater === "function" ? updater(prev || []) : updater;
      setDemoEquipment(value);
      return value;
    });
  };

  const requestDelete = (id) => {
    if (!canDelete) return;
    setConfirmDeleteId(id);
  };

  const performDelete = async () => {
    if (!confirmDeleteId) return;
    if (DEMO) {
      persistDemoItems((prev) => (prev || []).filter((it) => it._id !== confirmDeleteId));
      setConfirmDeleteId("");
      setToast({ visible: true, message: "[Demo] Equipment removed (local only)", kind: "success" });
      setTimeout(() => setToast({ visible: false, message: "", kind: "success" }), 2500);
      return;
    }
    try {
      setIsLoading(true);
      await inventoryService.deleteEquipment(confirmDeleteId);
      setConfirmDeleteId("");
      setRefreshTick((x) => x + 1);
      setToast({ visible: true, message: "Equipment deleted", kind: "success" });
      setTimeout(() => setToast({ visible: false, message: "", kind: "success" }), 2500);
    } catch (e) {
      setToast({ visible: true, message: e.message || "Delete failed", kind: "error" });
      setTimeout(() => setToast({ visible: false, message: "", kind: "error" }), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setCreateError("");
    setCreateForm({ name: "", description: "", categoryId: "", imageUrl: "", minQuantity: 0, currentQuantity: 0, maxQuantity: 0, modelNumber: "", serialNumber: "", manufacturer: "", purchaseDate: "", purchasePrice: "", location: "" });
    setCreateSpecList([]);
    setIsCreateOpen(true);
  };

  const handleSubmitCreate = async (e) => {
    e?.preventDefault?.();
    setCreateError("");
    if (!createForm.name || createForm.name.trim().length < 2) {
      setCreateError("Name is required (min 2 chars)");
      return;
    }
    if (!createForm.categoryId) {
      setCreateError("Category is required");
      return;
    }
    if (DEMO) {
      const cat = categories.find((c) => c._id === createForm.categoryId);
      const newItem = {
        _id: `demo-${Date.now()}`,
        name: createForm.name.trim(),
        description: createForm.description?.trim() || "",
        categoryId: cat ? { _id: cat._id, name: cat.name } : createForm.categoryId,
        imageUrl: createForm.imageUrl || "",
        minQuantity: Number(createForm.minQuantity) || 0,
        currentQuantity: Number(createForm.currentQuantity) || 0,
        maxQuantity: createForm.maxQuantity !== "" ? Number(createForm.maxQuantity) : undefined,
        modelNumber: createForm.modelNumber?.trim() || "",
        manufacturer: createForm.manufacturer?.trim() || "",
        location: createForm.location?.trim() || "",
        status: "available",
      };
      persistDemoItems((prev) => [newItem, ...(prev || [])]);
      setIsCreateOpen(false);
      setToast({ visible: true, message: "[Demo] Component added (local only)", kind: "success" });
      setTimeout(() => setToast({ visible: false, message: "", kind: "success" }), 2500);
      return;
    }
    try {
      setIsSubmitting(true);
      const toSpecObject = (list) => (list || []).filter(i => (i?.key || "").trim()).reduce((acc, cur) => ({ ...acc, [cur.key]: cur.value || "" }), {});
      await inventoryService.createEquipment({
        name: createForm.name.trim(),
        description: createForm.description?.trim() || undefined,
        categoryId: createForm.categoryId,
        imageUrl: createForm.imageUrl || undefined,
        minQuantity: Number(createForm.minQuantity) || 0,
        currentQuantity: Number(createForm.currentQuantity) || 0,
        maxQuantity: createForm.maxQuantity !== "" ? Number(createForm.maxQuantity) : undefined,
        modelNumber: createForm.modelNumber?.trim() || undefined,
        serialNumber: createForm.serialNumber?.trim() || undefined,
        manufacturer: createForm.manufacturer?.trim() || undefined,
        purchaseDate: createForm.purchaseDate || undefined,
        purchasePrice: createForm.purchasePrice !== "" ? Number(createForm.purchasePrice) : undefined,
        location: createForm.location?.trim() || undefined,
        specifications: toSpecObject(createSpecList),
      });
      setIsCreateOpen(false);
      setRefreshTick((x) => x + 1);
    } catch (e) {
      setCreateError(e.message || "Create failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditError("");
    setEditForm({
      id: item._id,
      name: item.name || "",
      description: item.description || "",
      categoryId: categoryIdOf(item.categoryId),
      imageUrl: item.imageUrl || "",
      minQuantity: Number(item.minQuantity) || 0,
      currentQuantity: Number(item.currentQuantity) || 0,
      maxQuantity: Number(item.maxQuantity) || 0,
      modelNumber: item.modelNumber || "",
      serialNumber: item.serialNumber || "",
      manufacturer: item.manufacturer || "",
      purchaseDate: item.purchaseDate ? String(item.purchaseDate).slice(0,10) : "",
      purchasePrice: item.purchasePrice ?? "",
      location: item.location || "",
    });
    const specs = item?.specifications || {};
    const specEntries = Array.isArray(specs)
      ? specs.map((row) => ({ key: row.key || "", value: String(row.value ?? "") }))
      : Object.entries(specs).map(([k, v]) => ({ key: k, value: String(v) }));
    setEditSpecList(specEntries);
    setIsEditOpen(true);
  };

  const handleSubmitEdit = async (e) => {
    e?.preventDefault?.();
    setEditError("");
    if (!editForm.name || editForm.name.trim().length < 2) {
      setEditError("Name is required (min 2 chars)");
      return;
    }
    if (!editForm.categoryId) {
      setEditError("Category is required");
      return;
    }
    if (DEMO) {
      const cat = categories.find((c) => c._id === editForm.categoryId);
      persistDemoItems((prev) => (prev || []).map((it) => it._id !== editForm.id ? it : {
        ...it,
        name: editForm.name.trim(),
        description: editForm.description?.trim() || "",
        categoryId: cat ? { _id: cat._id, name: cat.name } : editForm.categoryId,
        imageUrl: editForm.imageUrl || "",
        minQuantity: Number(editForm.minQuantity) || 0,
        currentQuantity: Number(editForm.currentQuantity) || 0,
        maxQuantity: editForm.maxQuantity !== "" ? Number(editForm.maxQuantity) : undefined,
        modelNumber: editForm.modelNumber?.trim() || "",
        manufacturer: editForm.manufacturer?.trim() || "",
        location: editForm.location?.trim() || "",
      }));
      setIsEditOpen(false);
      setToast({ visible: true, message: "[Demo] Component updated (local only)", kind: "success" });
      setTimeout(() => setToast({ visible: false, message: "", kind: "success" }), 2500);
      return;
    }
    try {
      setIsSubmitting(true);
      const toSpecObject = (list) => (list || []).filter(i => (i?.key || "").trim()).reduce((acc, cur) => ({ ...acc, [cur.key]: cur.value || "" }), {});
      await inventoryService.updateEquipment(editForm.id, {
        name: editForm.name.trim(),
        description: editForm.description?.trim() || undefined,
        categoryId: editForm.categoryId,
        imageUrl: editForm.imageUrl || undefined,
        minQuantity: Number(editForm.minQuantity) || 0,
        currentQuantity: Number(editForm.currentQuantity) || 0,
        maxQuantity: editForm.maxQuantity !== "" ? Number(editForm.maxQuantity) : undefined,
        modelNumber: editForm.modelNumber?.trim() || undefined,
        serialNumber: editForm.serialNumber?.trim() || undefined,
        manufacturer: editForm.manufacturer?.trim() || undefined,
        purchaseDate: editForm.purchaseDate || undefined,
        purchasePrice: editForm.purchasePrice !== "" ? Number(editForm.purchasePrice) : undefined,
        location: editForm.location?.trim() || undefined,
        specifications: toSpecObject(editSpecList),
      });
      setIsEditOpen(false);
      setRefreshTick((x) => x + 1);
    } catch (e) {
      setEditError(e.message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    {DEMO && (
      <div className={styles.demoBanner} role="status">
        <span className={styles.demoBadge}>DEMO MODE</span>
        <span>General Lab is using local sample data. Browse and search are available; component management is handled in the admin dashboard.</span>
      </div>
    )}
    <InventoryCatalogue
      items={items} categories={categories} pagination={pagination}
      loading={isLoading} error={error} categoryError={categoryError}
      onRetry={() => setRefreshTick((n) => n + 1)} onRetryCategories={() => setCategoryRetry((n) => n + 1)}
      search={searchTerm} onSearch={(value) => { setSkip(0); setSearchTerm(value); }}
      categoryId={categoryFilter} onCategory={(value) => { setSkip(0); setCategoryFilter(value); }}
      status={statusFilter} onStatus={(value) => { setSkip(0); setStatusFilter(value); }} statusOptions={statusOptions}
      limit={limit} skip={skip} onLimit={(value) => { setSkip(0); setLimit(value); }} onSkip={setSkip}
      viewMode={viewMode} onViewMode={setViewMode}
      canEdit={canEdit} canDelete={canDelete} canManageCategories={canManageCategories}
      onCreate={handleOpenCreate} onEdit={handleOpenEdit} onDelete={requestDelete}
      onManageCategories={() => { setIsCategoriesOpen(true); setCatError(""); }}
    />
    {/* Create Modal */}
    {isCreateOpen && (
      <InventoryDialog label="Add equipment" onClose={() => { if (!isSubmitting) setIsCreateOpen(false); }}>
        <div className={styles.dialogPanel} onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-semibold mb-4">Add Equipment</h3>
          {createError && <div className="mb-3 text-sm text-red-400">{createError}</div>}
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div>
              <label htmlFor="inventory-field-1" className="block mb-1 text-sm text-white/80">Name</label>
              <input id="inventory-field-1"
                className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="e.g., Arduino Uno"
                autoFocus
              />
            </div>
            {showAdvancedFields && (
              <div>
                <label htmlFor="inventory-field-2" className="block mb-1 text-sm text-white/80">Description</label>
                <textarea id="inventory-field-2"
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Short description"
                />
              </div>
            )}
            <div>
              <label htmlFor="inventory-field-3" className="block mb-1 text-sm text-white/80">Image URL</label>
              <input id="inventory-field-3"
                type="url"
                className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                value={createForm.imageUrl}
                onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                onPaste={(e) => {
                  const text = (e.clipboardData || window.clipboardData)?.getData('text');
                  if (text) {
                    e.preventDefault();
                    setCreateForm(prev => ({ ...prev, imageUrl: text.trim() }));
                  }
                }}
                inputMode="url"
                autoComplete="off"
                placeholder="https://cdn.example.com/equipment-123.jpg"
              />
              <div className="mt-2">
                <CloudinaryUploader
                  label="Upload Image"
                  folder="newtonbotics/inventory"
                  resourceType="image"
                  multiple={false}
                  showPreview={false}
                  renderTrigger={({ open }) => (
                    <button type="button" onClick={open} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-sm text-white">Upload Image</button>
                  )}
                  onUploadComplete={(file)=>{
                    if(file?.secureUrl){ setCreateForm(prev=>({ ...prev, imageUrl: file.secureUrl })); }
                  }}
                />
              </div>
              {createForm.imageUrl ? (
                <div className="mt-2 w-[160px] h-[120px] overflow-hidden rounded-md border border-white/10 bg-white/5">
                  {/* preview uses native img to avoid next/image domain limits during entry */}
                  <img
                    src={createForm.imageUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              ) : null}
            </div>
            <div>
              <label htmlFor="inventory-field-4" className="block mb-1 text-sm text-white/80">Category</label>
              <select id="inventory-field-4"
                className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                value={createForm.categoryId}
                onChange={(e) => setCreateForm({ ...createForm, categoryId: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="inventory-field-5" className="block mb-1 text-sm text-white/80">Available Quantity</label>
                <input id="inventory-field-5"
                  type="number"
                  min={0}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                  value={createForm.currentQuantity}
                  onChange={(e) => setCreateForm({ ...createForm, currentQuantity: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="inventory-field-6" className="block mb-1 text-sm text-white/80">Min. Quantity</label>
                <input id="inventory-field-6"
                  type="number"
                  min={0}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                  value={createForm.minQuantity}
                  onChange={(e) => setCreateForm({ ...createForm, minQuantity: e.target.value })}
                />
              </div>
              {/* Status is computed by backend; not editable here */}
            </div>
            {showAdvancedFields && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inventory-field-7" className="block mb-1 text-sm text-white/80">Max Quantity</label>
                  <input id="inventory-field-7" type="number" min={0} className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={createForm.maxQuantity} onChange={(e) => setCreateForm({ ...createForm, maxQuantity: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="inventory-field-8" className="block mb-1 text-sm text-white/80">Location</label>
                  <input id="inventory-field-8" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={createForm.location} onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="inventory-field-9" className="block mb-1 text-sm text-white/80">Model Number</label>
                  <input id="inventory-field-9" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={createForm.modelNumber} onChange={(e) => setCreateForm({ ...createForm, modelNumber: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="inventory-field-10" className="block mb-1 text-sm text-white/80">Serial Number</label>
                  <input id="inventory-field-10" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={createForm.serialNumber} onChange={(e) => setCreateForm({ ...createForm, serialNumber: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="inventory-field-11" className="block mb-1 text-sm text-white/80">Manufacturer</label>
                  <input id="inventory-field-11" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={createForm.manufacturer} onChange={(e) => setCreateForm({ ...createForm, manufacturer: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="inventory-field-12" className="block mb-1 text-sm text-white/80">Purchase Date</label>
                  <input id="inventory-field-12" type="date" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={createForm.purchaseDate} onChange={(e) => setCreateForm({ ...createForm, purchaseDate: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="inventory-field-13" className="block mb-1 text-sm text-white/80">Purchase Price</label>
                  <input id="inventory-field-13" type="number" min={0} step="0.01" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={createForm.purchasePrice} onChange={(e) => setCreateForm({ ...createForm, purchasePrice: e.target.value })} />
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
              >Cancel</button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
                disabled={isSubmitting}
              >{isSubmitting ? "Creating..." : "Create"}</button>
            </div>
          </form>
        </div>
      </InventoryDialog>
    )}

    {/* Edit Modal */}
    {isEditOpen && (
      <InventoryDialog label="Edit equipment" onClose={() => { if (!isSubmitting) setIsEditOpen(false); }}>
        <div className={styles.dialogPanel} onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-semibold mb-4">Edit Equipment</h3>
          {editError && <div className="mb-3 text-sm text-red-400">{editError}</div>}
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div>
              <label htmlFor="inventory-field-14" className="block mb-1 text-sm text-white/80">Name</label>
              <input id="inventory-field-14"
                className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            {showAdvancedFields && (
              <div>
                <label htmlFor="inventory-field-15" className="block mb-1 text-sm text-white/80">Description</label>
                <textarea id="inventory-field-15"
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
            )}
            <div>
              <label htmlFor="inventory-field-16" className="block mb-1 text-sm text-white/80">Image URL</label>
              <input id="inventory-field-16"
                type="url"
                className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                value={editForm.imageUrl}
                onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
              />
              <div className="mt-2">
                <CloudinaryUploader
                  label="Upload Image"
                  folder="newtonbotics/inventory"
                  resourceType="image"
                  multiple={false}
                  showPreview={false}
                  renderTrigger={({ open }) => (
                    <button type="button" onClick={open} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-sm text-white">Upload Image</button>
                  )}
                  onUploadComplete={(file)=>{
                    if(file?.secureUrl){ setEditForm(prev=>({ ...prev, imageUrl: file.secureUrl })); }
                  }}
                />
              </div>
            </div>
            <div>
              <label htmlFor="inventory-field-17" className="block mb-1 text-sm text-white/80">Category</label>
              <select id="inventory-field-17"
                className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                value={editForm.categoryId}
                onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="inventory-field-18" className="block mb-1 text-sm text-white/80">Available Quantity</label>
                <input id="inventory-field-18"
                  type="number"
                  min={0}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                  value={editForm.currentQuantity}
                  onChange={(e) => setEditForm({ ...editForm, currentQuantity: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="inventory-field-19" className="block mb-1 text-sm text-white/80">Min. Quantity</label>
                <input id="inventory-field-19"
                  type="number"
                  min={0}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                  value={editForm.minQuantity}
                  onChange={(e) => setEditForm({ ...editForm, minQuantity: e.target.value })}
                />
              </div>
              {/* Status is computed by backend; not editable here */}
            </div>
            {showAdvancedFields && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inventory-field-20" className="block mb-1 text-sm text-white/80">Max Quantity</label>
                  <input id="inventory-field-20" type="number" min={0} className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={editForm.maxQuantity} onChange={(e) => setEditForm({ ...editForm, maxQuantity: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="inventory-field-21" className="block mb-1 text-sm text-white/80">Location</label>
                  <input id="inventory-field-21" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="inventory-field-22" className="block mb-1 text-sm text-white/80">Model Number</label>
                  <input id="inventory-field-22" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={editForm.modelNumber} onChange={(e) => setEditForm({ ...editForm, modelNumber: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="inventory-field-23" className="block mb-1 text-sm text-white/80">Serial Number</label>
                  <input id="inventory-field-23" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={editForm.serialNumber} onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="inventory-field-24" className="block mb-1 text-sm text-white/80">Manufacturer</label>
                  <input id="inventory-field-24" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={editForm.manufacturer} onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="inventory-field-25" className="block mb-1 text-sm text-white/80">Purchase Date</label>
                  <input id="inventory-field-25" type="date" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={editForm.purchaseDate} onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="inventory-field-26" className="block mb-1 text-sm text-white/80">Purchase Price</label>
                  <input id="inventory-field-26" type="number" min={0} step="0.01" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={editForm.purchasePrice} onChange={(e) => setEditForm({ ...editForm, purchasePrice: e.target.value })} />
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10"
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
              >Cancel</button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
                disabled={isSubmitting}
              >{isSubmitting ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      </InventoryDialog>
    )}

    {/* Confirm Delete Modal */}
    {confirmDeleteId && (
      <InventoryDialog label="Delete equipment" onClose={() => setConfirmDeleteId("")}>
        <div className={styles.dialogPanel} onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold mb-2 text-white">Delete equipment?</h3>
          <p className="text-white/70 mb-4">This action cannot be undone.</p>
          <div className="flex items-center justify-end gap-3">
            <button className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10" onClick={() => setConfirmDeleteId("")}>Cancel</button>
            <button className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white" onClick={performDelete}>Delete</button>
          </div>
        </div>
      </InventoryDialog>
    )}

    {/* Toast */}
    {toast.visible && (
      <div role="status" aria-live="polite" className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[160] px-4 py-3 rounded-lg shadow-lg border ${toast.kind === 'success' ? 'bg-green-600/90 border-green-500 text-white' : 'bg-red-600/90 border-red-500 text-white'}`}>
        {toast.message}
      </div>
    )}

    {/* Categories Manager Modal */}
    {isCategoriesOpen && (
      <InventoryDialog label="Manage equipment categories" onClose={() => setIsCategoriesOpen(false)}>
        <div className={styles.dialogPanel} onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-semibold mb-4 text-white">Equipment Categories</h3>
          {catError && <div className="mb-3 text-sm text-red-400">{catError}</div>}
          {/* Create new category */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="p-3 rounded-lg border border-white/10 bg-white/5 text-white" placeholder="Name" value={catForm.name} onChange={(e)=>setCatForm({...catForm,name:e.target.value})} />
            <input className="p-3 rounded-lg border border-white/10 bg-white/5 text-white md:col-span-2" placeholder="Description (optional)" value={catForm.description} onChange={(e)=>setCatForm({...catForm,description:e.target.value})} />
            <div className="flex md:col-span-3 justify-end">
              <button disabled={catSubmitting} onClick={async ()=>{
                try{
                  setCatError("");
                  if(!catForm.name || catForm.name.trim().length<2){ setCatError('Name must be at least 2 characters'); return; }
                  setCatSubmitting(true);
                  if (DEMO) {
                    const next = [{ _id: `cat-demo-${Date.now()}`, name: catForm.name.trim(), description: catForm.description?.trim() || "" }, ...categories];
                    setCategories(next);
                    setDemoCategories(next);
                    setCatForm({ name: "", description: "", parentCategoryId: "" });
                    setToast({ visible:true, message:'[Demo] Category created (local only)', kind:'success' });
                    setTimeout(()=>setToast({ visible:false, message:'', kind:'success' }), 2000);
                    return;
                  }
                  await inventoryService.createCategory({ name: catForm.name.trim(), description: catForm.description?.trim()||undefined, parentCategoryId: catForm.parentCategoryId||undefined });
                  const refreshed = await inventoryService.listCategories();
                  setCategories(refreshed);
                  setCatForm({ name: "", description: "", parentCategoryId: "" });
                  setToast({ visible:true, message:'Category created', kind:'success' });
                  setTimeout(()=>setToast({ visible:false, message:'', kind:'success' }), 2000);
                }catch(err){ setCatError(err.message||'Create failed'); }
                finally{ setCatSubmitting(false); }
              }} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white disabled:opacity-50">{catSubmitting? 'Creating...':'Create Category'}</button>
            </div>
          </div>

          {/* List categories */}
          <div className="space-y-3">
            {categories.map(cat => (
              <div key={cat._id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
                {catEditingId === cat._id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input className="p-2 rounded bg-black/30 border border-white/10 text-white" value={catEditValues.name} onChange={(e)=>setCatEditValues({...catEditValues,name:e.target.value})} />
                    <input className="p-2 rounded bg-black/30 border border-white/10 text-white md:col-span-2" value={catEditValues.description} onChange={(e)=>setCatEditValues({...catEditValues,description:e.target.value})} />
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="font-medium text-white">{cat.name}</div>
                    {cat.description && <div className="text-white/70 text-sm">{cat.description}</div>}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {catEditingId === cat._id ? (
                    <>
                      <button className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10" onClick={()=>setCatEditingId("")}>Cancel</button>
                      <button className="px-3 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white" onClick={async()=>{
                        try{
                          if(!catEditValues.name || catEditValues.name.trim().length<2){ setCatError('Name must be at least 2 characters'); return; }
                          if (DEMO) {
                            const next = categories.map((c) => c._id === cat._id ? { ...c, name: catEditValues.name.trim(), description: catEditValues.description?.trim() || "" } : c);
                            setCategories(next);
                            setDemoCategories(next);
                            setCatEditingId("");
                            setToast({ visible:true, message:'[Demo] Category updated (local only)', kind:'success' });
                            setTimeout(()=>setToast({ visible:false, message:'', kind:'success' }), 2000);
                            return;
                          }
                          await inventoryService.updateCategory(cat._id, { name: catEditValues.name.trim(), description: catEditValues.description?.trim()||undefined });
                          const refreshed = await inventoryService.listCategories();
                          setCategories(refreshed);
                          setCatEditingId("");
                          setToast({ visible:true, message:'Category updated', kind:'success' });
                          setTimeout(()=>setToast({ visible:false, message:'', kind:'success' }), 2000);
                        }catch(err){ setCatError(err.message||'Update failed'); }
                      }}>Save</button>
                    </>
                  ) : (
                    <>
                      <button className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10" onClick={()=>{ setCatEditingId(cat._id); setCatEditValues({ name: cat.name||'', description: cat.description||'', parentCategoryId: cat.parentCategoryId||'' }); }}>Edit</button>
                      {(DEMO || isAdvancedRole) && (
                        <button className="px-3 py-2 rounded-md bg-red-600/80 hover:bg-red-600 text-white" onClick={async()=>{
                          try{
                            if (DEMO) {
                              const next = categories.filter((c) => c._id !== cat._id);
                              setCategories(next);
                              setDemoCategories(next);
                              setToast({ visible:true, message:'[Demo] Category deleted (local only)', kind:'success' });
                              setTimeout(()=>setToast({ visible:false, message:'', kind:'success' }), 2000);
                              return;
                            }
                            await inventoryService.deleteCategory(cat._id);
                            const refreshed = await inventoryService.listCategories();
                            setCategories(refreshed);
                            setToast({ visible:true, message:'Category deleted', kind:'success' });
                            setTimeout(()=>setToast({ visible:false, message:'', kind:'success' }), 2000);
                          }catch(err){ setCatError(err.message||'Delete failed'); }
                        }}>Delete</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end mt-6">
            <button className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10" onClick={()=>setIsCategoriesOpen(false)}>Close</button>
          </div>
        </div>
      </InventoryDialog>
    )}
    </>
  );
};

export default GeneralLabInventory;
