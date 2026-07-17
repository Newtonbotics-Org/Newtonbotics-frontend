// Media API client for Gallery
import { API_BASE_URL } from './api';

async function safeParseJson(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text();
  throw new Error(`Unexpected response (${response.status} ${response.statusText}): ${text.slice(0, 200)}`);
}

function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    search.set(k, String(v));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

// Mock media data for when API is not available
const mockMediaData = [
  {
    _id: "1",
    title: "Robotics Lab Setup",
    description: "Our state-of-the-art robotics laboratory with advanced equipment",
    fileType: "image",
    fileUrl: "/servilancerobot.jpeg",
    thumbnailUrl: "/servilancerobot.jpeg",
    categoryId: "lab",
    isFeatured: true,
    viewCount: 1250,
    createdAt: "2024-12-15T10:00:00Z",
    tags: ["lab", "equipment", "robotics"]
  },
  {
    _id: "2",
    title: "Humanoid Robot Healthcare Demo",
    description: "Demonstration of our humanoid robot for healthcare applications",
    fileType: "image",
    fileUrl: "/humanoidRobotHealthcare.webp",
    thumbnailUrl: "/humanoidRobotHealthcare.webp",
    categoryId: "projects",
    isFeatured: true,
    viewCount: 890,
    createdAt: "2024-12-10T14:30:00Z",
    tags: ["humanoid", "healthcare", "AI"]
  },
  {
    _id: "3",
    title: "Lab Background View",
    description: "Overview of our robotics lab workspace",
    fileType: "image",
    fileUrl: "/bgImageforroboticslab.jpg",
    thumbnailUrl: "/bgImageforroboticslab.jpg",
    categoryId: "lab",
    isFeatured: false,
    viewCount: 456,
    createdAt: "2024-12-08T09:15:00Z",
    tags: ["lab", "workspace"]
  }
];

const mockCategories = [
  { _id: "lab", name: "Laboratory" },
  { _id: "projects", name: "Projects" },
  { _id: "events", name: "Events" }
];

const mockCollections = [
  { _id: "featured", name: "Featured Media" },
  { _id: "recent", name: "Recent Uploads" }
];

export const mediaService = {
  // GET /api/media - List all media files
  async listMedia({ 
    fileType, 
    categoryId, 
    q, 
    limit = 50, 
    skip = 0, 
    isFeatured 
  } = {}) {
    try {
      const query = toQuery({ fileType, categoryId, q, limit, skip, isFeatured });
      const url = `${API_BASE_URL}/media${query}`;
      console.log('[mediaService.listMedia] GET', url);
      const res = await fetch(url, { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await safeParseJson(res);
      console.log('[mediaService.listMedia] response', data);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load media';
        throw new Error(msg);
      }
      // If API returns successfully but with no items, fall back to mock data
      const apiPayload = data?.data || { items: [], pagination: { total: 0, limit, skip, hasMore: false } };
      const apiItems = Array.isArray(apiPayload.items) ? apiPayload.items : [];
      if (apiItems.length === 0) {
        return this.getMockMedia({ fileType, categoryId, q, limit, skip, isFeatured });
      }
      return apiPayload;
    } catch (error) {
      console.error('Error fetching media:', error);
      // Fallback to mock data
      const mock = this.getMockMedia({ fileType, categoryId, q, limit, skip, isFeatured });
      console.log('[mediaService.listMedia] using mock data', mock);
      return mock;
    }
  },

  // Mock data fallback
  getMockMedia({ fileType, categoryId, q, limit = 50, skip = 0, isFeatured } = {}) {
    let filteredData = [...mockMediaData];

    // Apply filters
    if (fileType && fileType !== "all") {
      filteredData = filteredData.filter(item => item.fileType === fileType);
    }

    if (categoryId && categoryId !== "all") {
      filteredData = filteredData.filter(item => item.categoryId === categoryId);
    }

    if (isFeatured) {
      filteredData = filteredData.filter(item => item.isFeatured === true);
    }

    if (q) {
      const searchTerm = q.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply pagination
    const total = filteredData.length;
    const paginatedData = filteredData.slice(skip, skip + limit);
    const hasMore = skip + limit < total;

    return {
      items: paginatedData,
      pagination: {
        total,
        limit,
        skip,
        hasMore
      }
    };
  },

  // GET /api/media/categories - List media categories
  async listCategories() {
    try {
      const url = `${API_BASE_URL}/media/categories`;
      console.log('[mediaService.listCategories] GET', url);
      const res = await fetch(url, { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await safeParseJson(res);
      console.log('[mediaService.listCategories] response', data);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load categories';
        throw new Error(msg);
      }
      const items = data?.data?.items || [];
      return items.length === 0 ? mockCategories : items;
    } catch (error) {
      console.error('Error fetching media categories:', error);
      // Fallback to mock data
      console.log('[mediaService.listCategories] using mock categories', mockCategories);
      return mockCategories;
    }
  },

  // GET /api/media/collections - List media collections
  async listCollections() {
    try {
      const url = `${API_BASE_URL}/media/collections`;
      console.log('[mediaService.listCollections] GET', url);
      const res = await fetch(url, { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await safeParseJson(res);
      console.log('[mediaService.listCollections] response', data);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load collections';
        throw new Error(msg);
      }
      const items = data?.data?.items || [];
      return items.length === 0 ? mockCollections : items;
    } catch (error) {
      console.error('Error fetching media collections:', error);
      // Fallback to mock data
      console.log('[mediaService.listCollections] using mock collections', mockCollections);
      return mockCollections;
    }
  },

  // GET /api/media/:id - Get specific media item (auto-increments view count)
  async getMedia(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/media/${id}`, { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await safeParseJson(res);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load media item';
        throw new Error(msg);
      }
      
      return data?.data?.item;
    } catch (error) {
      console.error('Error fetching media item:', error);
      throw new Error(`Failed to load media item: ${error.message}`);
    }
  },

  // POST /api/media/:id/view - Increment view count only
  async incrementViewCount(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/media/${id}/view`, { 
        method: 'POST',
        cache: 'no-store' 
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await safeParseJson(res);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to increment view count';
        throw new Error(msg);
      }
      
      return data?.data?.viewCount;
    } catch (error) {
      console.error('Error incrementing view count:', error);
      // Don't throw error for view count increment failures
      return null;
    }
  },

  // Helper function to get file type icon
  getFileTypeIcon(fileType) {
    switch (fileType) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      case 'document': return '📄';
      default: return '📁';
    }
  },

  // Helper function to format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Helper function to format duration
  formatDuration(seconds) {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
};

export default mediaService;
