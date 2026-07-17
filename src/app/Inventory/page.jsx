"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  AlertCircle,
  XCircle,
  CheckCircle,
  Grid3X3,
  List,
} from "lucide-react";
import Image from "next/image";
import CloudinaryUploader from "../../components/CloudinaryUploader";
import Link from "next/link";
import LoadingSpinner from "../../components/LoadingSpinner";
import inventoryService from "../../lib/inventory";
import { useAuth } from "../../contexts/AuthContext";

const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [limit, setLimit] = useState(20);
  const [skip, setSkip] = useState(0);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, skip: 0, hasMore: false });
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, isAuthenticated } = useAuth();
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
  // Checkout/Urgent/Return modals
  const [activeItem, setActiveItem] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isUrgentOpen, setIsUrgentOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [checkoutQty, setCheckoutQty] = useState(1);
  const [checkoutDue, setCheckoutDue] = useState("");
  const [urgentQty, setUrgentQty] = useState(1);
  const [urgentDue, setUrgentDue] = useState("");
  const [urgentNotes, setUrgentNotes] = useState("");
  const [actionError, setActionError] = useState("");
  const [catForm, setCatForm] = useState({ name: "", description: "", parentCategoryId: "" });
  const [catError, setCatError] = useState("");
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [catEditingId, setCatEditingId] = useState("");
  const [catEditValues, setCatEditValues] = useState({ name: "", description: "", parentCategoryId: "" });
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    let isMounted = true;
    const loadInitial = async () => {
      try {
        setError("");
        const [cats] = await Promise.all([
          inventoryService.listCategories(),
        ]);
        if (!isMounted) return;
        setCategories(cats);
      } catch (e) {
        if (!isMounted) return;
        setError(e.message || "Failed to load categories");
      }
    };
    loadInitial();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
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
    loadEquipment();
  }, [categoryFilter, statusFilter, searchTerm, limit, skip, refreshTick]);

  const statusOptions = useMemo(() => ([
    { value: "", label: "All" },
    { value: "available", label: "Available" },
    { value: "low_stock", label: "Low stock" },
    { value: "out_of_stock", label: "Out of stock" },
    { value: "maintenance", label: "Maintenance" },
    { value: "retired", label: "Retired" },
  ]), []);

  const { hasSubrole } = useAuth();
  const role = user?.role || null;
  const isAdvancedRole = ["mentor", "researcher", "admin"].includes(role);
  const hasInventoryManagementSubrole = hasSubrole('inventory_manager') || hasSubrole('inventory_management');
  const isTeamMemberWithInventoryManagement = role === 'team_member' && hasInventoryManagementSubrole;
  const canEdit = isAuthenticated && (isAdvancedRole || hasInventoryManagementSubrole || isTeamMemberWithInventoryManagement);
  const canDelete = isAuthenticated && (isAdvancedRole || hasInventoryManagementSubrole || isTeamMemberWithInventoryManagement);
  const canManageCategories = isAuthenticated && (["team_member", "mentor", "researcher", "admin"].includes(role) || hasInventoryManagementSubrole || isTeamMemberWithInventoryManagement);

  // Backend will compute status; no local status logic

  const getStatusInfo = (item) => {
    if (!item) {
      return { label: "", color: "bg-white/10", Icon: CheckCircle };
    }
    if (item.currentQuantity <= 0) {
      return { label: "Out of Stock", color: "bg-red-500/90", Icon: XCircle };
    }
    if (item.currentQuantity <= (item.minQuantity || 0)) {
      return { label: "Low Stock", color: "bg-yellow-500/90", Icon: AlertCircle };
    }
    return { label: "Available", color: "bg-green-500/90", Icon: CheckCircle };
  };

  const requestDelete = (id) => {
    if (!canDelete) return;
    setConfirmDeleteId(id);
  };

  const performDelete = async () => {
    if (!confirmDeleteId) return;
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
      categoryId: item.categoryId || "",
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
    setEditSpecList(Object.entries(specs).map(([k,v]) => ({ key: k, value: String(v) })));
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
    <div className="min-h-screen bg-black text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <motion.div
        className="max-w-7xl mx-auto mb-12 text-center"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-600">
          Robotics Lab Inventory
        </h1>
        <p className="text-lg text-white/80">
          Explore all the tools, components, and equipment available in our lab.
        </p>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div
        className="max-w-7xl mx-auto mb-8"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80" />
          </div>

          {/* Category Filter */}
          <div className="relative w-full md:w-1/4">
            <select
              value={categoryFilter}
              onChange={(e) => { setSkip(0); setCategoryFilter(e.target.value); }}
              className="w-full p-3 pl-10 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80" />
          </div>

          {/* Status Filter */}
          <div className="relative w-full md:w-1/4">
            <select
              value={statusFilter}
              onChange={(e) => { setSkip(0); setStatusFilter(e.target.value); }}
              className="w-full p-3 pl-10 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80" />
          </div>

          {/* View Mode Toggle (after Manage Categories) */}
          <div className="flex items-center justify-center bg-white/10 border border-white/10 rounded-lg p-1 w-full md:w-auto ml-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${viewMode === "grid" ? "bg-red-600 text-white" : "text-white/70 hover:text-white"}`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${viewMode === "list" ? "bg-red-600 text-white" : "text-white/70 hover:text-white"}`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          {/* Add Equipment Button */}
          {canEdit && (
            <button
              className="w-full md:w-auto px-5 py-3 rounded-lg whitespace-nowrap bg-red-600 hover:bg-red-500 transition border border-white/10"
              onClick={handleOpenCreate}
            >Add Equipment</button>
          )}
          {/* Manage Categories Button (team_member+) */}
          {canManageCategories && (
            <button
              className="w-full md:w-auto px-5 py-3 rounded-lg whitespace-nowrap bg-white/10 hover:bg-white/15 transition border border-white/10"
              onClick={() => { setIsCategoriesOpen(true); setCatError(""); }}
            >Manage Categories</button>
          )}
        </div>
      </motion.div>

      {/* Inventory Grid/List */}
      <motion.div
        className="max-w-7xl mx-auto w-full"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {isLoading && (
          <div className="py-16"><LoadingSpinner text="Loading inventory..." /></div>
        )}
        {!isLoading && error && (
          <div className="py-10 text-center text-red-400">{error}</div>
        )}
        {!isLoading && !error && items.length === 0 && (
          <div className="py-10 text-center text-white/70">No equipment found.</div>
        )}
        {!isLoading && !error && items.length > 0 && (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const status = getStatusInfo(item);
                const StatusIcon = status.Icon;
                return (
                  <motion.div
                    key={item._id}
                    className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-red-500/50 transition-all relative"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className={`absolute top-4 right-4 z-10 ${status.color} text-white px-3 py-1 rounded-full flex items-center text-sm`}
                    >
                      <StatusIcon className="w-4 h-4 mr-2" />
                      {status.label}
                    </div>

                    <div className="relative h-56 w-full mb-4 rounded-lg overflow-hidden bg-black/30">
                      <Image
                        src={item.imageUrl || '/white logo.png'}
                        alt={item.name}
                        fill
                        className="object-contain z-0"
                      />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 font-display">
                      {item.name}
                    </h3>
                    {item.description && (<p className="text-white/80 mb-2">{item.description}</p>)}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-red-500">{categories.find(c => c._id === item.categoryId)?.name || '—'}</span>
                      <span className="text-white/80">Quantity: {item.currentQuantity}</span>
                    </div>

                    {(canEdit || canDelete) && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {canEdit && (
                          <Link
                            href={`/Inventory/${item._id}`}
                            className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
                          >Manage</Link>
                        )}
                        {canEdit && (
                          <button
                            className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
                            onClick={() => handleOpenEdit(item)}
                          >Edit</button>
                        )}
                        {canDelete && (
                          <button
                            className="px-3 py-2 rounded-md bg-red-600/80 hover:bg-red-600 text-white text-sm"
                            onClick={() => requestDelete(item._id)}
                          >Delete</button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const status = getStatusInfo(item);
                const StatusIcon = status.Icon;
                return (
                  <motion.div
                    key={item._id}
                    className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-white/10 hover:border-white/15 transition-all"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex flex-col md:flex-row gap-5">
                      <div className="w-full md:w-48 h-40 rounded-lg overflow-hidden bg-black/30 relative">
                        <Image
                          src={item.imageUrl || '/white logo.png'}
                          alt={item.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-semibold text-white font-display">{item.name}</h3>
                            {item.description && <p className="text-white/70 text-sm mt-1 max-w-2xl">{item.description}</p>}
                          </div>
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm text-white ${status.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {status.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                          <span className="flex items-center gap-1">
                            <strong className="text-white/90">Category:</strong>
                            {categories.find(c => c._id === item.categoryId)?.name || '—'}
                          </span>
                          <span className="flex items-center gap-1">
                            <strong className="text-white/90">Quantity:</strong>
                            {item.currentQuantity}
                          </span>
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <strong className="text-white/90">Location:</strong>
                              {item.location}
                            </span>
                          )}
                          {item.modelNumber && (
                            <span className="flex items-center gap-1">
                              <strong className="text-white/90">Model:</strong>
                              {item.modelNumber}
                            </span>
                          )}
                        </div>

                        {(canEdit || canDelete) && (
                          <div className="flex flex-wrap items-center gap-2">
                            {canEdit && (
                              <Link
                                href={`/Inventory/${item._id}`}
                                className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
                              >Manage</Link>
                            )}
                            {canEdit && (
                              <button
                                className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
                                onClick={() => handleOpenEdit(item)}
                              >Edit</button>
                            )}
                            {canDelete && (
                              <button
                                className="px-3 py-2 rounded-md bg-red-600/80 hover:bg-red-600 text-white text-sm"
                                onClick={() => requestDelete(item._id)}
                              >Delete</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        )}
      </motion.div>

      {/* Pagination Controls */}
      <div className="max-w-7xl mx-auto mt-8 flex items-center justify-between gap-4">
        <div className="text-white/70 text-sm">{pagination.total} items</div>
        <div className="flex items-center gap-3">
          <button
            className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50"
            onClick={() => setSkip(Math.max(0, skip - limit))}
            disabled={skip === 0 || isLoading}
          >Prev</button>
          <button
            className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50"
            onClick={() => setSkip(skip + limit)}
            disabled={!pagination.hasMore || isLoading}
          >Next</button>
          <select
            className="px-2 py-2 rounded-md bg-white/10 border border-white/10"
            value={limit}
            onChange={(e) => { setSkip(0); setLimit(Number(e.target.value)); }}
          >
            {[10,20,30,40,50,100].map(n => (
              <option key={n} value={n}>{n}/page</option>
            ))}
          </select>
        </div>
      </div>
    </div>
    {/* Create Modal */}
    {isCreateOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setIsCreateOpen(false)}>
        <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-semibold mb-4">Add Equipment</h3>
          {createError && <div className="mb-3 text-sm text-red-400">{createError}</div>}
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm text-white/80">Name</label>
              <input
                className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="e.g., Arduino Uno"
                autoFocus
              />
            </div>
            {isAdvancedRole && (
              <div>
                <label className="block mb-1 text-sm text-white/80">Description</label>
                <textarea
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Short description"
                />
              </div>
            )}
            <div>
              <label className="block mb-1 text-sm text-white/80">Image URL</label>
              <input
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
              <label className="block mb-1 text-sm text-white/80">Category</label>
              <select
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
                <label className="block mb-1 text-sm text-white/80">Available Quantity</label>
                <input
                  type="number"
                  min={0}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                  value={createForm.currentQuantity}
                  onChange={(e) => setCreateForm({ ...createForm, currentQuantity: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-white/80">Min. Quantity</label>
                <input
                  type="number"
                  min={0}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                  value={createForm.minQuantity}
                  onChange={(e) => setCreateForm({ ...createForm, minQuantity: e.target.value })}
                />
              </div>
              {/* Status is computed by backend; not editable here */}
            </div>
            {isAdvancedRole && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-sm text-white/80">Max Quantity</label>
                  <input type="number" min={0} className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={createForm.maxQuantity} onChange={(e) => setCreateForm({ ...createForm, maxQuantity: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-white/80">Location</label>
                  <input className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={createForm.location} onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-white/80">Model Number</label>
                  <input className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={createForm.modelNumber} onChange={(e) => setCreateForm({ ...createForm, modelNumber: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-white/80">Serial Number</label>
                  <input className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={createForm.serialNumber} onChange={(e) => setCreateForm({ ...createForm, serialNumber: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-white/80">Manufacturer</label>
                  <input className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={createForm.manufacturer} onChange={(e) => setCreateForm({ ...createForm, manufacturer: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-white/80">Purchase Date</label>
                  <input type="date" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={createForm.purchaseDate} onChange={(e) => setCreateForm({ ...createForm, purchaseDate: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-white/80">Purchase Price</label>
                  <input type="number" min={0} step="0.01" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={createForm.purchasePrice} onChange={(e) => setCreateForm({ ...createForm, purchasePrice: e.target.value })} />
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
      </div>
    )}

    {/* Edit Modal */}
    {isEditOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setIsEditOpen(false)}>
        <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-semibold mb-4">Edit Equipment</h3>
          {editError && <div className="mb-3 text-sm text-red-400">{editError}</div>}
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm text-white/80">Name</label>
              <input
                className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            {isAdvancedRole && (
              <div>
                <label className="block mb-1 text-sm text-white/80">Description</label>
                <textarea
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="block mb-1 text-sm text-white/80">Image URL</label>
              <input
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
              <label className="block mb-1 text-sm text-white/80">Category</label>
              <select
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
                <label className="block mb-1 text-sm text-white/80">Available Quantity</label>
                <input
                  type="number"
                  min={0}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                  value={editForm.currentQuantity}
                  onChange={(e) => setEditForm({ ...editForm, currentQuantity: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-white/80">Min. Quantity</label>
                <input
                  type="number"
                  min={0}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white"
                  value={editForm.minQuantity}
                  onChange={(e) => setEditForm({ ...editForm, minQuantity: e.target.value })}
                />
              </div>
              {/* Status is computed by backend; not editable here */}
            </div>
            {isAdvancedRole && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-sm text-white/80">Max Quantity</label>
                  <input type="number" min={0} className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={editForm.maxQuantity} onChange={(e) => setEditForm({ ...editForm, maxQuantity: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-white/80">Location</label>
                  <input className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-white/80">Model Number</label>
                  <input className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={editForm.modelNumber} onChange={(e) => setEditForm({ ...editForm, modelNumber: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-white/80">Serial Number</label>
                  <input className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={editForm.serialNumber} onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-white/80">Manufacturer</label>
                  <input className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={editForm.manufacturer} onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-white/80">Purchase Date</label>
                  <input type="date" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={editForm.purchaseDate} onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-white/80">Purchase Price</label>
                  <input type="number" min={0} step="0.01" className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" value={editForm.purchasePrice} onChange={(e) => setEditForm({ ...editForm, purchasePrice: e.target.value })} />
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
      </div>
    )}

    {/* Confirm Delete Modal */}
    {confirmDeleteId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setConfirmDeleteId("")}>
        <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold mb-2 text-white">Delete equipment?</h3>
          <p className="text-white/70 mb-4">This action cannot be undone.</p>
          <div className="flex items-center justify-end gap-3">
            <button className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10" onClick={() => setConfirmDeleteId("")}>Cancel</button>
            <button className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white" onClick={performDelete}>Delete</button>
          </div>
        </div>
      </div>
    )}

    {/* Toast */}
    {toast.visible && (
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg border ${toast.kind === 'success' ? 'bg-green-600/90 border-green-500 text-white' : 'bg-red-600/90 border-red-500 text-white'}`}>
        {toast.message}
      </div>
    )}

    {/* Checkout Modal */}
    {isCheckoutOpen && activeItem && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={()=>setIsCheckoutOpen(false)}>
        <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-xl p-6" onClick={(e)=>e.stopPropagation()}>
          <h3 className="text-xl font-semibold mb-4 text-white">Checkout - {activeItem.name}</h3>
          {actionError && <div className="mb-3 text-sm text-red-400">{actionError}</div>}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block mb-1 text-sm text-white/80">Quantity</label>
              <input type="number" min={1} value={checkoutQty} onChange={(e)=>setCheckoutQty(Math.max(1, Number(e.target.value||1)))} className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" />
            </div>
            <div>
              <label className="block mb-1 text-sm text-white/80">Expected Return</label>
              <input type="date" value={checkoutDue} onChange={(e)=>setCheckoutDue(e.target.value)} className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10" onClick={()=>setIsCheckoutOpen(false)}>Cancel</button>
            <button className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white" onClick={async()=>{
              try{
                setActionError("");
                if(!checkoutQty || checkoutQty < 1){ setActionError('Quantity must be at least 1'); return; }
                await inventoryService.checkoutEquipment(activeItem._id, { quantity: checkoutQty, expectedReturnDate: checkoutDue || undefined });
                setIsCheckoutOpen(false);
                setToast({ visible:true, message:'Checked out successfully', kind:'success' });
                setTimeout(()=>setToast({ visible:false, message:'', kind:'success' }), 2000);
                setRefreshTick(x=>x+1);
              }catch(err){ setActionError(err.message||'Checkout failed'); }
            }}>Checkout</button>
          </div>
        </div>
      </div>
    )}

    {/* Urgent Checkout Modal */}
    {isUrgentOpen && activeItem && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={()=>setIsUrgentOpen(false)}>
        <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-xl p-6" onClick={(e)=>e.stopPropagation()}>
          <h3 className="text-xl font-semibold mb-4 text-white">Urgent Checkout - {activeItem.name}</h3>
          {actionError && <div className="mb-3 text-sm text-red-400">{actionError}</div>}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block mb-1 text-sm text-white/80">Quantity</label>
              <input type="number" min={1} value={urgentQty} onChange={(e)=>setUrgentQty(Math.max(1, Number(e.target.value||1)))} className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" />
            </div>
            <div>
              <label className="block mb-1 text-sm text-white/80">Expected Return</label>
              <input type="date" value={urgentDue} onChange={(e)=>setUrgentDue(e.target.value)} className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm text-white/80">Notes (optional)</label>
            <textarea rows={3} value={urgentNotes} onChange={(e)=>setUrgentNotes(e.target.value.slice(0,1000))} className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white" placeholder="Reason for urgent use" />
          </div>
          <div className="text-white/70 text-sm mb-3">Available now: {activeItem.currentQuantity}</div>
          <div className="flex items-center justify-end gap-3">
            <button className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10" onClick={()=>setIsUrgentOpen(false)}>Cancel</button>
            <button className="px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-500 text-white" onClick={async()=>{
              try{
                setActionError("");
                if(!urgentQty || urgentQty < 1){ setActionError('Quantity must be at least 1'); return; }
                const data = await inventoryService.urgentCheckout(activeItem._id, { quantity: urgentQty, expectedReturnDate: urgentDue || undefined, notes: urgentNotes || undefined });
                setIsUrgentOpen(false);
                setToast({ visible:true, message:`Urgent checkout: req ${data.requestedQuantity}, fulfilled ${data.fulfilledQuantity}, overdrawn ${data.overdrawnQuantity}`, kind:'success' });
                setTimeout(()=>setToast({ visible:false, message:'', kind:'success' }), 3000);
                setRefreshTick(x=>x+1);
              }catch(err){ setActionError(err.message||'Urgent checkout failed'); }
            }}>Urgent Checkout</button>
          </div>
        </div>
      </div>
    )}

    {/* Return Modal */}
    {isReturnOpen && activeItem && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={()=>setIsReturnOpen(false)}>
        <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-xl p-6" onClick={(e)=>e.stopPropagation()}>
          <h3 className="text-xl font-semibold mb-4 text-white">Return - {activeItem.name}</h3>
          {actionError && <div className="mb-3 text-sm text-red-400">{actionError}</div>}
          {/* Simple message; backend selects last active if none provided. You can extend to list user's active checkouts here. */}
          <div className="text-white/80 mb-4">Submit to return your last active checkout for this item.</div>
          <div className="flex items-center justify-end gap-3">
            <button className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10" onClick={()=>setIsReturnOpen(false)}>Cancel</button>
            <button className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white" onClick={async()=>{
              try{
                setActionError("");
                await inventoryService.returnEquipment(activeItem._id, {});
                setIsReturnOpen(false);
                setToast({ visible:true, message:'Returned successfully', kind:'success' });
                setTimeout(()=>setToast({ visible:false, message:'', kind:'success' }), 2000);
                setRefreshTick(x=>x+1);
              }catch(err){ setActionError(err.message||'Return failed'); }
            }}>Return</button>
          </div>
        </div>
      </div>
    )}

    {/* Categories Manager Modal */}
    {isCategoriesOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setIsCategoriesOpen(false)}>
        <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                      {isAdvancedRole && (
                        <button className="px-3 py-2 rounded-md bg-red-600/80 hover:bg-red-600 text-white" onClick={async()=>{
                          try{
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
      </div>
    )}
    </>
  );
};

export default InventoryPage;
