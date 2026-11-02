"use client";
import { useState, useEffect } from "react";
import {
  FileText, Plus, X, AlertCircle, CheckCircle, Send,
  Clock, Eye, RefreshCw, Edit2, Trash2, Upload, Download, File
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import CloudinaryUploader from "../../components/CloudinaryUploader";
import { API_BASE_URL } from "@/lib/api";
import authService from "@/lib/auth";

const ProjectRequestPage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // State for user's project requests
  const [myRequests, setMyRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    objectives: [""],
    expectedOutcomes: [""],
    teamSize: 1,
    estimatedDurationMonths: 1,
    budgetEstimate: 0,
    requiredResources: [""],
    teamMembers: [],
    resources: [],
    document: null // Cloudinary document URL and metadata
  });

  useEffect(() => {
    // Only redirect if auth loading is complete and user is not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch user's project requests
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchMyRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  // Fix scroll issue when returning from PDF viewer
  useEffect(() => {
    const handleFocus = () => {
      // Ensure body can scroll when window regains focus
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.documentElement.style.overflow = '';
      
      // Remove any potential scroll locks
      const scrollLockElements = document.querySelectorAll('[style*="overflow: hidden"]');
      scrollLockElements.forEach(el => {
        if (el !== document.body && el !== document.documentElement) {
          // Only remove if it's not intentionally set
          const computedStyle = window.getComputedStyle(el);
          if (computedStyle.position === 'fixed') {
            el.style.overflow = '';
          }
        }
      });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible again
        handleFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', () => {
      // Optional: can add cleanup here if needed
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchMyRequests = async () => {
    try {
      setRequestsLoading(true);
      if (!isAuthenticated) return;

      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/project-requests/my-requests`
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMyRequests(data.data.items || []);
      }
    } catch (err) {
      console.error('Error fetching project requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleEdit = (request) => {
    // Populate form with request data
    let documentData = null;
    
    // Handle different document formats from backend - check multiple possible formats
    // Check 1: Full document object with URL fields
    if (request.document && (request.document.secureUrl || request.document.url || request.document.path)) {
      // Backend document object (from API docs format or Cloudinary format)
      const docFormat = request.document.format || request.document.mimetype?.split('/')[1] || 
                       (request.document.filename?.split('.').pop()) || 
                       (request.document.originalName?.split('.').pop()) || 'pdf';
      const docUrl = request.document.secureUrl || request.document.url || 
                     (request.document.path && `${API_BASE_URL.replace('/api', '')}/${request.document.path}`);
      
      documentData = {
        secureUrl: fixCloudinaryUrl(docUrl, docFormat),
        url: fixCloudinaryUrl(request.document.url || request.document.secureUrl || docUrl, docFormat),
        originalName: request.document.originalName || request.document.filename || 'Document',
        bytes: request.document.bytes || request.document.size,
        format: docFormat,
        publicId: request.document.publicId || request.document.public_id
      };
    } 
    // Check 2: Document URL stored separately
    else if (request.documentUrl) {
      // Cloudinary URL stored separately (fallback format)
      const docFormat = request.documentFormat || 
                       (request.documentUrl.split('.').pop()?.split('?')[0]) || 'pdf';
      documentData = {
        secureUrl: fixCloudinaryUrl(request.documentUrl, docFormat),
        url: fixCloudinaryUrl(request.documentUrl, docFormat),
        originalName: request.documentName || 'Document',
        bytes: request.documentSize,
        format: docFormat
      };
    }
    // Check 3: Try loading from localStorage (backup since backend doesn't return it)
    else if (request._id) {
      const storageKey = `project_request_doc_${request._id}`;
      const storedDoc = localStorage.getItem(storageKey);
      if (storedDoc) {
        try {
          documentData = JSON.parse(storedDoc);
        } catch (e) {
          console.error('Failed to parse stored document:', e);
        }
      }
    }
    
    
    setFormData({
      title: request.title || "",
      description: request.description || "",
      objectives: request.objectives && request.objectives.length > 0 ? request.objectives : [""],
      expectedOutcomes: request.expectedOutcomes && request.expectedOutcomes.length > 0 ? request.expectedOutcomes : [""],
      teamSize: request.teamSize || 1,
      estimatedDurationMonths: request.estimatedDurationMonths || 1,
      budgetEstimate: request.budgetEstimate || 0,
      requiredResources: request.requiredResources && request.requiredResources.length > 0 ? request.requiredResources : [""],
      teamMembers: request.teamMembers || [],
      resources: request.resources || [],
      document: documentData
    });
    setEditingRequest(request);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingRequest(null);
    setFormData({
      title: "",
      description: "",
      objectives: [""],
      expectedOutcomes: [""],
      teamSize: 1,
      estimatedDurationMonths: 1,
      budgetEstimate: 0,
      requiredResources: [""],
      teamMembers: [],
      resources: [],
      document: null
    });
    setShowForm(false);
  };

  const handleDelete = async (requestId) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!isAuthenticated) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/project-requests/${requestId}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ reason: 'User requested deletion' })
        }
      );


      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }


      if (!response.ok) {
        console.error('Delete failed:', data);
        throw new Error(data.error?.message || data.message || 'Failed to delete project request');
      }

      if (!data.success) {
        console.error('API returned success:false', data);
        throw new Error(data.message || 'Failed to delete project request');
      }

      setSuccess(true);
      setSuccessMessage('Project request deleted successfully!');
      setError(null);
      setDeleteConfirm(null);
      
      // Refresh the requests list
      await fetchMyRequests();
      
      setTimeout(() => {
        setSuccess(false);
        setSuccessMessage('');
      }, 3000);

    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message);
      setSuccess(false);
      setDeleteConfirm(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayFieldChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, {
        userId: "",
        proposedRole: "",
        skills: [""],
        availabilityHoursPerWeek: 0
      }]
    }));
  };

  const removeTeamMember = (index) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  const handleTeamMemberChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  const addTeamMemberSkill = (memberIndex) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => 
        i === memberIndex ? { ...member, skills: [...member.skills, ""] } : member
      )
    }));
  };

  const removeTeamMemberSkill = (memberIndex, skillIndex) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => 
        i === memberIndex ? { 
          ...member, 
          skills: member.skills.filter((_, si) => si !== skillIndex) 
        } : member
      )
    }));
  };

  const handleTeamMemberSkillChange = (memberIndex, skillIndex, value) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => 
        i === memberIndex ? {
          ...member,
          skills: member.skills.map((skill, si) => si === skillIndex ? value : skill)
        } : member
      )
    }));
  };

  const addResource = () => {
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, {
        resourceType: "equipment",
        description: "",
        estimatedCost: 0,
        priority: "medium"
      }]
    }));
  };

  const removeResource = (index) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const handleResourceChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.map((resource, i) => 
        i === index ? { ...resource, [field]: value } : resource
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!isAuthenticated) {
        throw new Error('Authentication required. Please log in.');
      }

      // Clean up data - remove empty strings from arrays
      const cleanedData = {
        ...formData,
        objectives: formData.objectives.filter(obj => obj.trim() !== ""),
        expectedOutcomes: formData.expectedOutcomes.filter(out => out.trim() !== ""),
        requiredResources: formData.requiredResources.filter(res => res.trim() !== ""),
        teamMembers: formData.teamMembers.map(member => ({
          ...member,
          skills: member.skills.filter(skill => skill.trim() !== "")
        })).filter(member => member.userId && member.proposedRole),
        resources: formData.resources.filter(res => res.description.trim() !== "")
      };

      // Include document URL if uploaded via Cloudinary
      if (formData.document && (formData.document.secureUrl || formData.document.url)) {
        cleanedData.documentUrl = formData.document.secureUrl || formData.document.url;
        cleanedData.documentName = formData.document.originalName || 'Document';
        cleanedData.documentSize = formData.document.bytes;
        cleanedData.documentFormat = formData.document.format;
        // Also send full document object for backend to store properly
        cleanedData.document = {
          secureUrl: formData.document.secureUrl || formData.document.url,
          url: formData.document.url || formData.document.secureUrl,
          originalName: formData.document.originalName || 'Document',
          bytes: formData.document.bytes,
          format: formData.document.format,
          publicId: formData.document.publicId
        };
        
        // Store document in localStorage as backup (since backend might not return it)
        if (editingRequest?._id) {
          const storageKey = `project_request_doc_${editingRequest._id}`;
          localStorage.setItem(storageKey, JSON.stringify(formData.document));
        }
      }

      // Add reason for update if editing
      if (editingRequest) {
        cleanedData.reason = 'Updated project request details';
      }

      const url = editingRequest 
        ? `${API_BASE_URL}/project-requests/${editingRequest._id}`
        : `${API_BASE_URL}/project-requests`;
      
      const method = editingRequest ? 'PUT' : 'POST';

      const response = await authService.makeAuthenticatedRequest(url, {
        method,
        body: JSON.stringify(cleanedData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Failed to ${editingRequest ? 'update' : 'create'} project request`);
      }

      setSuccess(true);
      setSuccessMessage(editingRequest ? 'Project request updated successfully!' : 'Project request submitted successfully!');
      setError(null);
      
      // If editing, preserve the document from formData since backend might not return it
      if (editingRequest) {
        // Keep the current document in formData (backend might not return it in response)
        const currentDocument = formData.document;
        
        // If backend returned document data, use it; otherwise keep what we had
        let savedDocument = currentDocument;
        
        if (data.data?.item) {
          const savedItem = data.data.item;
          
          if (savedItem.document && (savedItem.document.secureUrl || savedItem.document.url || savedItem.document.path)) {
            const docFormat = savedItem.document.format || savedItem.document.mimetype?.split('/')[1] || 'pdf';
            const docUrl = savedItem.document.secureUrl || savedItem.document.url || 
                           (savedItem.document.path && `${API_BASE_URL.replace('/api', '')}/${savedItem.document.path}`);
            savedDocument = {
              secureUrl: fixCloudinaryUrl(docUrl, docFormat),
              url: fixCloudinaryUrl(savedItem.document.url || savedItem.document.secureUrl || docUrl, docFormat),
              originalName: savedItem.document.originalName || savedItem.document.filename || 'Document',
              bytes: savedItem.document.bytes || savedItem.document.size,
              format: docFormat
            };
          } else if (savedItem.documentUrl) {
            const docFormat = savedItem.documentFormat || 'pdf';
            savedDocument = {
              secureUrl: fixCloudinaryUrl(savedItem.documentUrl, docFormat),
              url: fixCloudinaryUrl(savedItem.documentUrl, docFormat),
              originalName: savedItem.documentName || 'Document',
              bytes: savedItem.documentSize,
              format: docFormat
            };
          }
        }
        
        // Preserve document in formData (don't clear it)
        if (savedDocument) {
          setFormData(prev => ({
            ...prev,
            document: savedDocument
          }));
        }
      } else {
        // Reset form only for new requests
        setFormData({
          title: "",
          description: "",
          objectives: [""],
          expectedOutcomes: [""],
          teamSize: 1,
          estimatedDurationMonths: 1,
          budgetEstimate: 0,
          requiredResources: [""],
          teamMembers: [],
          resources: [],
          document: null
        });
        setEditingRequest(null);
      }

      // Refresh the requests list
      fetchMyRequests();
      
      // Hide form and show requests
      setTimeout(() => {
        setShowForm(false);
        setSuccess(false);
        setSuccessMessage('');
      }, 2000);

    } catch (err) {
      setError(err.message);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <main className="nb-dark flex min-h-[60vh] items-center justify-center bg-paper text-ink" role="status">
        <div className="flex flex-col items-center gap-4">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-line-strong border-t-signal" aria-hidden="true" />
          <p className="m-0 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">Loading…</p>
        </div>
      </main>
    );
  }

  // Show authentication required only after loading is complete
  if (!authLoading && !isAuthenticated) {
    return (
      <main className="nb-dark bg-paper text-ink">
        <div className="nb-container flex min-h-[60vh] flex-col items-start justify-center gap-4 py-24">
          <span className="nb-eyebrow">Members only</span>
          <h1 className="m-0 font-display text-[32px] font-semibold tracking-[-0.02em]">Authentication required</h1>
          <p className="m-0 text-ink-muted">Please log in to submit a project request.</p>
        </div>
      </main>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'nb-chip-amber';
      case 'under_review':
        return 'nb-chip-blue';
      case 'approved':
        return 'nb-chip-green';
      case 'rejected':
        return 'nb-chip-red';
      case 'on_hold':
        return 'nb-chip-outline';
      default:
        return 'nb-chip-outline';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to fix Cloudinary URLs for PDFs and other raw files
  // Cloudinary sometimes returns /image/upload/ URLs for PDFs, but they need /raw/upload/ to work
  const fixCloudinaryUrl = (url, format) => {
    if (!url) return url;
    
    // Check if it's a Cloudinary URL
    if (url.includes('res.cloudinary.com')) {
      // List of document formats that should use raw delivery
      const rawFormats = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'];
      const fileFormat = format?.toLowerCase() || url.split('.').pop()?.split('?')[0]?.toLowerCase();
      
      // If it's a document format OR if URL contains /image/upload/ with a document extension
      if (rawFormats.includes(fileFormat) || (url.includes('/image/upload/') && rawFormats.some(fmt => url.includes(`.${fmt}`)))) {
        // Always replace /image/upload/ with /raw/upload/ for documents
        if (url.includes('/image/upload/')) {
          url = url.replace('/image/upload/', '/raw/upload/');
        }
        
        // Also handle case where path structure needs fixing
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/').filter(Boolean);
          
          // Find the upload index
          const uploadIndex = pathParts.findIndex(part => part === 'upload');
          if (uploadIndex > 0 && pathParts[uploadIndex - 1] === 'image') {
            // Replace image with raw
            pathParts[uploadIndex - 1] = 'raw';
            urlObj.pathname = '/' + pathParts.join('/');
            url = urlObj.toString();
          }
        } catch (e) {
          // If URL parsing fails, the simple string replacement above should handle it
        }
      }
    }
    
    return url;
  };

  // Presentation-only: which form sections already have content (drives the section indicator)
  const hasDocument = Boolean(formData.document && (formData.document.secureUrl || formData.document.url));
  const formSections = [
    { id: 'pr-sec-basics', label: 'The idea', done: formData.title.trim().length >= 5 && formData.description.trim().length >= 20 },
    { id: 'pr-sec-document', label: 'Document', done: hasDocument, optional: true },
    { id: 'pr-sec-goals', label: 'Objectives & outcomes', done: formData.objectives.some((o) => o.trim()) && formData.expectedOutcomes.some((o) => o.trim()) },
    { id: 'pr-sec-resources', label: 'Parts & budget', done: formData.requiredResources.some((r) => r.trim()) || formData.resources.some((r) => r.description.trim()) },
  ];
  const firstOpenSection = formSections.findIndex((s) => !s.done && !s.optional);

  // Restores page scroll after opening a document in a new tab (PDF viewers can leave it locked)
  const unlockScroll = () => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  };
  const unlockScrollSoon = () => {
    setTimeout(unlockScroll, 100);
  };

  const sectionTitle = (num, title, extra) => (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="font-mono text-xs text-signal-text">{num}</span>
      <h2 className="m-0 font-display text-xl font-semibold tracking-[-0.01em]">{title}</h2>
      {extra && <span className="text-sm text-ink-muted">{extra}</span>}
    </div>
  );

  const removeRowButton = (label, onClick) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-line-strong bg-surface text-ink-muted hover:border-[#B91C1C] hover:text-[#B91C1C]"
    >
      <X size={18} aria-hidden="true" />
    </button>
  );

  const addRowButton = (label, onClick) => (
    <button type="button" onClick={onClick} className="nb-btn nb-btn-secondary nb-btn-sm self-start">
      <Plus size={16} aria-hidden="true" />
      {label}
    </button>
  );

  return (
    <main className="nb-dark bg-paper text-ink">
      <div className="nb-container flex flex-col gap-8 pb-24 pt-10 sm:pt-12">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
              {showForm ? (editingRequest ? 'Edit project request' : 'New project request') : 'Project requests'}
            </span>
            <h1 className="m-0 font-display text-[32px] font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
              {showForm ? (editingRequest ? 'Update your pitch' : 'Pitch a project') : 'My project requests'}
            </h1>
            <p className="m-0 max-w-[620px] text-[15px] leading-relaxed text-ink-muted">
              {showForm
                ? 'Submit your robotics project idea. Be specific about the problem and honest about what you’ll need.'
                : 'Track the status of the projects you’ve pitched to the lab.'}
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="View">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-pressed={!showForm}
              className={`nb-pill h-11 px-4 text-sm ${!showForm ? 'nb-pill-active' : ''}`}
            >
              <FileText size={16} aria-hidden="true" />
              My requests ({myRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              aria-pressed={showForm}
              className={`nb-pill h-11 px-4 text-sm ${showForm ? 'nb-pill-active' : ''}`}
            >
              <Plus size={16} aria-hidden="true" />
              New request
            </button>
          </div>
        </header>

        {/* Success Message */}
        {success && (
          <div role="status" className="flex items-start gap-2 rounded-md border border-[#BBDFC6] bg-[#E3F1E7] px-4 py-3 text-sm text-[#166534]">
            <CheckCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{successMessage || 'Operation completed successfully!'}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-[#F3C4C4] bg-[#FBE4E4] px-4 py-3 text-sm text-[#991B1B]">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* My Requests List View */}
        {!showForm && (
          <section className="flex flex-col gap-5">
            {requestsLoading ? (
              <div className="flex flex-col items-center gap-4 py-16" role="status">
                <span className="h-10 w-10 animate-spin rounded-full border-2 border-line-strong border-t-signal" aria-hidden="true" />
                <p className="m-0 text-sm text-ink-muted">Loading your requests…</p>
              </div>
            ) : myRequests.length === 0 ? (
              <div className="nb-card nb-blueprint-sm flex flex-col items-start gap-3 p-8 sm:p-10">
                <FileText size={28} className="text-ink-muted" aria-hidden="true" />
                <h2 className="m-0 font-display text-2xl font-semibold">No project requests yet</h2>
                <p className="m-0 max-w-[520px] text-ink-muted">
                  You haven&apos;t submitted any project requests. Pitch your first idea to get started.
                </p>
                <button type="button" onClick={() => setShowForm(true)} className="nb-btn nb-btn-accent mt-2">
                  <Plus size={16} aria-hidden="true" />
                  Create your first request
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="m-0 font-display text-2xl font-semibold">Your project requests</h2>
                  <button type="button" onClick={fetchMyRequests} className="nb-btn nb-btn-secondary nb-btn-sm">
                    <RefreshCw size={16} aria-hidden="true" />
                    Refresh
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {myRequests.map((request) => (
                    <article key={request._id} className="nb-card flex flex-col gap-4 p-5 sm:p-6">
                      {/* Request Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5">
                          <h3 className="m-0 font-display text-xl font-semibold tracking-[-0.01em]">{request.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            <span className={`nb-chip ${getStatusColor(request.status)}`}>
                              {request.status.replace('_', ' ')}
                            </span>
                            <span className="nb-chip nb-chip-outline">{request.teamSize} team members</span>
                            <span className="nb-chip nb-chip-outline">{request.estimatedDurationMonths} months</span>
                            {request.budgetEstimate > 0 && (
                              <span className="nb-chip nb-chip-outline">${request.budgetEstimate}</span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons - Top Right */}
                        {request.status !== 'approved' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(request)}
                              aria-label={`Edit ${request.title}`}
                              title="Edit project"
                              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line-strong bg-surface text-ink hover:border-ink"
                            >
                              <Edit2 size={16} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(request._id)}
                              aria-label={`Delete ${request.title}`}
                              title="Delete project"
                              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line-strong bg-surface text-[#B91C1C] hover:border-[#B91C1C]"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="m-0 line-clamp-3 text-[15px] leading-relaxed text-ink-body">{request.description}</p>

                      {/* Objectives */}
                      {request.objectives && request.objectives.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <h4 className="m-0 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">Objectives</h4>
                          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm text-ink-body">
                            {request.objectives.slice(0, 3).map((obj, idx) => (
                              <li key={idx} className="flex gap-2.5">
                                <span className="font-mono text-xs leading-5 text-signal-text">{String(idx + 1).padStart(2, '0')}</span>
                                <span className="line-clamp-1">{obj}</span>
                              </li>
                            ))}
                            {request.objectives.length > 3 && (
                              <li className="pl-7 text-ink-muted">+{request.objectives.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Team Members */}
                      {request.teamMembers && request.teamMembers.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <h4 className="m-0 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">Team members</h4>
                          <div className="flex flex-wrap gap-2">
                            {request.teamMembers.map((member, idx) => (
                              <span key={idx} className="rounded border border-line px-2.5 py-1 text-xs text-ink-body">
                                {member.userId?.firstName} {member.userId?.lastName} — {member.proposedRole}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mentor Info */}
                      {request.mentorId && (
                        <p className="m-0 rounded-md bg-paper px-3 py-2.5 text-sm text-ink-body">
                          <span className="font-semibold text-ink">Mentor:</span>{' '}
                          {request.mentorId.firstName} {request.mentorId.lastName}
                        </p>
                      )}

                      {/* Review Notes */}
                      {request.reviewNotes && (
                        <p className="m-0 rounded-md border border-[#C9D6F5] bg-[#E5ECFB] px-3 py-2.5 text-sm text-[#1E40AF]">
                          <span className="font-semibold">Review notes:</span> {request.reviewNotes}
                        </p>
                      )}

                      {/* Document Section */}
                      {(request.document || (request.documentUrl && request.documentName)) && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line px-4 py-3">
                          <span className="flex min-w-0 items-center gap-2.5 text-sm">
                            <File size={16} className="shrink-0 text-ink-muted" aria-hidden="true" />
                            <span className="truncate font-medium">
                              {request.document?.originalName || request.document?.filename || request.documentName || 'Document'}
                            </span>
                          </span>
                          <a
                            href={fixCloudinaryUrl(
                              request.document?.secureUrl || request.document?.url || request.documentUrl || 
                              (request.document?.path && `${API_BASE_URL.replace('/api', '')}/${request.document.path}`),
                              request.document?.format || request.document?.mimetype?.split('/')[1]
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={unlockScroll}
                            onBlur={unlockScrollSoon}
                            className="nb-btn nb-btn-secondary nb-btn-sm"
                          >
                            <Download size={16} aria-hidden="true" />
                            Download
                          </a>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-line-soft pt-4 font-mono text-xs uppercase tracking-[0.04em] text-ink-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={14} aria-hidden="true" />
                          Submitted {formatDate(request.submittedAt)}
                        </span>
                        {request.reviewedAt && (
                          <span className="inline-flex items-center gap-1.5">
                            <Eye size={14} aria-hidden="true" />
                            Reviewed {formatDate(request.reviewedAt)}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* Form */}
        {showForm && (
          <>
            {/* Section indicator */}
            <ol aria-label="Form sections" className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2 p-0">
              {formSections.map((s, i) => {
                const isCurrent = i === firstOpenSection;
                return (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="flex flex-col gap-2 py-1 text-ink no-underline" aria-current={isCurrent ? 'step' : undefined}>
                      <span className={`h-1 rounded-sm ${s.done ? 'bg-ink' : isCurrent ? 'bg-signal' : 'bg-line'}`} aria-hidden="true" />
                      <span className={`font-mono text-[11px] uppercase ${isCurrent ? 'text-signal-hover' : 'text-ink-muted'}`}>
                        Step {i + 1}
                        {s.done ? ' · Done' : isCurrent ? ' · Now' : s.optional ? ' · Optional' : ''}
                      </span>
                      <span className={`text-sm ${s.done || isCurrent ? 'font-semibold' : 'font-medium text-ink-muted'}`}>{s.label}</span>
                    </a>
                  </li>
                );
              })}
            </ol>

            <div className="flex flex-wrap items-start gap-6">
              <form
                onSubmit={handleSubmit}
                className="nb-card flex min-w-0 flex-[999_1_520px] flex-col gap-10 p-5 sm:p-8"
              >
                {/* Basic Information Section */}
                <section id="pr-sec-basics" className="flex scroll-mt-24 flex-col gap-5">
                  {sectionTitle('01', 'Basic information')}

                  {/* Title */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="pr-title" className="nb-label">
                      Project title <span className="text-[#B91C1C]" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="pr-title"
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      minLength={5}
                      maxLength={255}
                      placeholder="Enter your project title"
                      className="nb-input"
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="pr-description" className="nb-label">
                      Project description <span className="text-[#B91C1C]" aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="pr-description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      minLength={20}
                      maxLength={5000}
                      rows={6}
                      placeholder="Provide a detailed description of your project"
                      aria-describedby="pr-description-count"
                      className="nb-textarea resize-y"
                    />
                    <span id="pr-description-count" className="text-[13px] text-ink-muted">
                      At least 20 characters. {formData.description.length} / 5000
                    </span>
                  </div>

                  {/* Project Metrics */}
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                    {/* Team Size */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="pr-team-size" className="nb-label">
                        Team size <span className="text-[#B91C1C]" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="pr-team-size"
                        type="number"
                        name="teamSize"
                        value={formData.teamSize}
                        onChange={handleInputChange}
                        required
                        min={1}
                        max={20}
                        className="nb-input"
                      />
                    </div>

                    {/* Duration */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="pr-duration" className="nb-label">
                        Duration (months) <span className="text-[#B91C1C]" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="pr-duration"
                        type="number"
                        name="estimatedDurationMonths"
                        value={formData.estimatedDurationMonths}
                        onChange={handleInputChange}
                        required
                        min={1}
                        max={24}
                        className="nb-input"
                      />
                    </div>

                    {/* Budget */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="pr-budget" className="nb-label">
                        Budget estimate
                      </label>
                      <input
                        id="pr-budget"
                        type="number"
                        name="budgetEstimate"
                        value={formData.budgetEstimate}
                        onChange={handleInputChange}
                        min={0}
                        placeholder="0"
                        className="nb-input"
                      />
                    </div>
                  </div>
                </section>

                {/* Document Upload Section */}
                <section id="pr-sec-document" className="flex scroll-mt-24 flex-col gap-4 border-t border-line-soft pt-8">
                  {sectionTitle('02', 'Project document', '(optional)')}
                  <p className="m-0 text-sm text-ink-muted">
                    Upload a document file (PDF, Word, Excel, PowerPoint, Text, Markdown) to provide additional details about your project.
                  </p>

                  {hasDocument ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-paper px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#E5ECFB] text-[#1E40AF]">
                          <File size={18} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="m-0 truncate font-medium">{formData.document.originalName || 'Document'}</p>
                          {editingRequest && (
                            <p className="m-0 text-[13px] text-ink-muted">
                              Current document — choose &ldquo;Change&rdquo; to replace it
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={fixCloudinaryUrl(formData.document.secureUrl || formData.document.url, formData.document.format)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={unlockScroll}
                          onBlur={unlockScrollSoon}
                          className="nb-btn nb-btn-secondary nb-btn-sm"
                        >
                          <Eye size={16} aria-hidden="true" />
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, document: null }))}
                          className="nb-btn nb-btn-ghost nb-btn-sm"
                          title={editingRequest ? "Change document" : "Remove document"}
                        >
                          <Upload size={16} aria-hidden="true" />
                          {editingRequest ? 'Change' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <CloudinaryUploader
                      folder="newtonbotics/project-documents"
                      resourceType="raw"
                      showPreview={false}
                      maxFileSizeBytes={10 * 1024 * 1024} // 10MB
                      onUploadComplete={(file) => {
                        // Cloudinary might return /image/upload/ URLs even for raw files
                        // We need to convert them to /raw/upload/ for PDFs to work
                        const documentFormats = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'];
                        const fileFormat = file.format?.toLowerCase();
                        
                        // Always fix URLs for document formats
                        let fixedSecureUrl = file.secureUrl;
                        let fixedUrl = file.url;
                        
                        if (documentFormats.includes(fileFormat)) {
                          // Convert /image/upload/ to /raw/upload/ if present
                          fixedSecureUrl = fixCloudinaryUrl(file.secureUrl, file.format);
                          fixedUrl = fixCloudinaryUrl(file.url, file.format);
                        }
                        
                        setFormData(prev => ({
                          ...prev,
                          document: {
                            secureUrl: fixedSecureUrl || file.secureUrl,
                            url: fixedUrl || file.url,
                            originalName: file.originalName || 'Document',
                            bytes: file.bytes,
                            format: file.format,
                            publicId: file.publicId,
                            resourceType: 'raw' // Force raw for documents
                          }
                        }));
                      }}
                      renderTrigger={({ open }) => (
                        <button
                          type="button"
                          onClick={open}
                          className="nb-blueprint-sm flex min-h-[96px] w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong px-4 py-5 text-ink hover:border-ink"
                        >
                          <span className="inline-flex items-center gap-2 font-semibold">
                            <Upload size={18} aria-hidden="true" />
                            Upload document
                          </span>
                        </button>
                      )}
                    />
                  )}

                  <p className="m-0 font-mono text-[11px] uppercase tracking-[0.04em] text-ink-muted">
                    PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, MD · Max 10 MB
                  </p>
                </section>

                {/* Objectives + Expected Outcomes */}
                <section id="pr-sec-goals" className="flex scroll-mt-24 flex-col gap-8 border-t border-line-soft pt-8">
                  <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
                    <legend className="mb-4 p-0">{sectionTitle('03', 'Project objectives')}</legend>
                    {formData.objectives.map((objective, index) => (
                      <div key={index} className="flex gap-2">
                        <label htmlFor={`pr-objective-${index}`} className="nb-sr-only">
                          Objective {index + 1}
                        </label>
                        <input
                          id={`pr-objective-${index}`}
                          type="text"
                          value={objective}
                          onChange={(e) => handleArrayFieldChange('objectives', index, e.target.value)}
                          placeholder={`Objective ${index + 1}`}
                          maxLength={500}
                          className="nb-input min-w-0 flex-1"
                        />
                        {formData.objectives.length > 1 &&
                          removeRowButton(`Remove objective ${index + 1}`, () => removeArrayField('objectives', index))}
                      </div>
                    ))}
                    {addRowButton('Add objective', () => addArrayField('objectives'))}
                  </fieldset>

                  {/* Expected Outcomes Section */}
                  <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
                    <legend className="mb-4 p-0">{sectionTitle('04', 'Expected outcomes')}</legend>
                    {formData.expectedOutcomes.map((outcome, index) => (
                      <div key={index} className="flex gap-2">
                        <label htmlFor={`pr-outcome-${index}`} className="nb-sr-only">
                          Expected outcome {index + 1}
                        </label>
                        <input
                          id={`pr-outcome-${index}`}
                          type="text"
                          value={outcome}
                          onChange={(e) => handleArrayFieldChange('expectedOutcomes', index, e.target.value)}
                          placeholder={`Expected outcome ${index + 1}`}
                          maxLength={500}
                          className="nb-input min-w-0 flex-1"
                        />
                        {formData.expectedOutcomes.length > 1 &&
                          removeRowButton(`Remove expected outcome ${index + 1}`, () => removeArrayField('expectedOutcomes', index))}
                      </div>
                    ))}
                    {addRowButton('Add outcome', () => addArrayField('expectedOutcomes'))}
                  </fieldset>
                </section>

                {/* Required Resources Section */}
                <section id="pr-sec-resources" className="flex scroll-mt-24 flex-col gap-8 border-t border-line-soft pt-8">
                  <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
                    <legend className="mb-4 p-0">{sectionTitle('05', 'Required resources')}</legend>
                    {formData.requiredResources.map((resource, index) => (
                      <div key={index} className="flex gap-2">
                        <label htmlFor={`pr-resource-${index}`} className="nb-sr-only">
                          Resource {index + 1}
                        </label>
                        <input
                          id={`pr-resource-${index}`}
                          type="text"
                          value={resource}
                          onChange={(e) => handleArrayFieldChange('requiredResources', index, e.target.value)}
                          placeholder={`Resource ${index + 1}`}
                          maxLength={200}
                          className="nb-input min-w-0 flex-1"
                        />
                        {formData.requiredResources.length > 1 &&
                          removeRowButton(`Remove resource ${index + 1}`, () => removeArrayField('requiredResources', index))}
                      </div>
                    ))}
                    {addRowButton('Add resource', () => addArrayField('requiredResources'))}
                  </fieldset>

                  {/* Detailed Resources Section (Optional) */}
                  <div className="flex flex-col gap-4">
                    {sectionTitle('06', 'Detailed resources', '(optional)')}
                    {formData.resources.map((resource, index) => (
                      <fieldset key={index} className="m-0 flex min-w-0 flex-col gap-4 rounded-lg border border-line bg-paper p-4">
                        <legend className="nb-sr-only">Detailed resource {index + 1}</legend>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
                            Resource {String(index + 1).padStart(2, '0')}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeResource(index)}
                            aria-label={`Remove detailed resource ${index + 1}`}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-[#B91C1C]"
                          >
                            <X size={18} aria-hidden="true" />
                          </button>
                        </div>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                          <div className="flex flex-col gap-2">
                            <label htmlFor={`pr-res-type-${index}`} className="nb-label">Resource type</label>
                            <select
                              id={`pr-res-type-${index}`}
                              value={resource.resourceType}
                              onChange={(e) => handleResourceChange(index, 'resourceType', e.target.value)}
                              className="nb-input pr-8"
                            >
                              <option value="equipment">Equipment</option>
                              <option value="software">Software</option>
                              <option value="funding">Funding</option>
                              <option value="space">Space</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label htmlFor={`pr-res-priority-${index}`} className="nb-label">Priority</label>
                            <select
                              id={`pr-res-priority-${index}`}
                              value={resource.priority}
                              onChange={(e) => handleResourceChange(index, 'priority', e.target.value)}
                              className="nb-input pr-8"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label htmlFor={`pr-res-cost-${index}`} className="nb-label">Estimated cost</label>
                            <input
                              id={`pr-res-cost-${index}`}
                              type="number"
                              value={resource.estimatedCost}
                              onChange={(e) => handleResourceChange(index, 'estimatedCost', parseFloat(e.target.value) || 0)}
                              min={0}
                              placeholder="0"
                              className="nb-input"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor={`pr-res-desc-${index}`} className="nb-label">Description</label>
                          <textarea
                            id={`pr-res-desc-${index}`}
                            value={resource.description}
                            onChange={(e) => handleResourceChange(index, 'description', e.target.value)}
                            placeholder="Describe the resource"
                            maxLength={500}
                            rows={2}
                            className="nb-textarea resize-y"
                          />
                        </div>
                      </fieldset>
                    ))}
                    {addRowButton('Add detailed resource', addResource)}
                  </div>
                </section>

                {/* Submit Button */}
                <div className="flex flex-wrap justify-end gap-2 border-t border-line-soft pt-6">
                  <button
                    type="button"
                    onClick={editingRequest ? handleCancelEdit : () => setShowForm(false)}
                    className="nb-btn nb-btn-ghost"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="nb-btn nb-btn-primary">
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" aria-hidden="true" />
                        {editingRequest ? 'Updating…' : 'Submitting…'}
                      </>
                    ) : (
                      <>
                        <Send size={16} aria-hidden="true" />
                        {editingRequest ? 'Update project request' : 'Submit project request'}
                      </>
                    )}
                  </button>
                </div>
              </form>

              <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-4 lg:sticky lg:top-24">
                <div className="nb-card flex flex-col gap-3 p-6">
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">Your pitch so far</span>
                  <span className="break-words font-display text-xl font-semibold">
                    {formData.title.trim() || 'Untitled project'}
                  </span>
                  {formData.description.trim() && (
                    <span className="line-clamp-3 text-sm leading-relaxed text-ink-muted">{formData.description}</span>
                  )}
                  <dl className="m-0 grid grid-cols-3 gap-3 border-t border-line-soft pt-3">
                    <div className="flex flex-col">
                      <dt className="font-mono text-[11px] uppercase text-ink-muted">Team</dt>
                      <dd className="m-0 font-semibold">{formData.teamSize || '—'}</dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="font-mono text-[11px] uppercase text-ink-muted">Months</dt>
                      <dd className="m-0 font-semibold">{formData.estimatedDurationMonths || '—'}</dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="font-mono text-[11px] uppercase text-ink-muted">Budget</dt>
                      <dd className="m-0 font-semibold">{Number(formData.budgetEstimate) > 0 ? `$${formData.budgetEstimate}` : '—'}</dd>
                    </div>
                  </dl>
                  <span className={`nb-chip self-start ${editingRequest ? getStatusColor(editingRequest.status) : 'nb-chip-amber'}`}>
                    {editingRequest ? editingRequest.status.replace('_', ' ') : 'Draft'}
                  </span>
                </div>
                <div className="flex flex-col gap-3 rounded-lg bg-ink p-6 text-night-text">
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-signal-light">Before you submit</span>
                  <ul className="m-0 flex flex-col gap-2 pl-[18px] text-sm leading-normal text-night-soft">
                    <li>A title of at least 5 characters and a description of at least 20</li>
                    <li>Team size between 1 and 20, duration between 1 and 24 months</li>
                    <li>Concrete objectives and outcomes someone could check at the end</li>
                    <li>List the parts you need so they can be checked against lab stock</li>
                  </ul>
                </div>
              </aside>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/60 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="pr-delete-title"
              onClick={(e) => e.stopPropagation()}
              className="nb-card flex w-full max-w-md flex-col gap-5 p-6"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FBE4E4] text-[#991B1B]">
                  <Trash2 size={18} aria-hidden="true" />
                </span>
                <div>
                  <h3 id="pr-delete-title" className="m-0 font-display text-xl font-semibold">Delete project request</h3>
                  <p className="m-0 text-sm text-ink-muted">This action cannot be undone</p>
                </div>
              </div>

              <p className="m-0 text-[15px] leading-relaxed text-ink-body">
                Are you sure you want to delete this project request? All associated data will be permanently removed.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={loading}
                  className="nb-btn nb-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={loading}
                  className="nb-btn flex-1 bg-[#B91C1C] text-white hover:bg-[#991B1B]"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} aria-hidden="true" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default ProjectRequestPage;
