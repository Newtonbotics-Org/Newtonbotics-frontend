// Media API client for Gallery
import { API_BASE_URL } from './api';
import authService from './auth';

/** Roles that can view labMembersOnly gallery media (not public / student) */
export const LAB_MEMBER_MEDIA_ROLES = ['team_member', 'mentor', 'researcher', 'admin'];

export function canViewLabOnlyMedia(user) {
  if (!user?.role) return false;
  const role = String(user.role).toLowerCase();
  return LAB_MEMBER_MEDIA_ROLES.includes(role);
}

export function resolveGalleryViewer() {
  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();
  return {
    user,
    isAuthenticated,
    canViewLabOnly: isAuthenticated && canViewLabOnlyMedia(user),
  };
}

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

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  try {
    const token = authService.getAccessToken() || localStorage.getItem('nb_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

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
      const res = await fetch(url, {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await safeParseJson(res);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load media';
        throw new Error(msg);
      }
      return data?.data || { items: [], pagination: { total: 0, limit, skip, hasMore: false } };
    } catch (error) {
      console.error('Error fetching media:', error);
      // Let the gallery show its real error state instead of placeholder content
      throw error;
    }
  },

  // GET /api/media/categories - List media categories
  async listCategories() {
    try {
      const url = `${API_BASE_URL}/media/categories`;
      const res = await fetch(url, { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await safeParseJson(res);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load categories';
        throw new Error(msg);
      }
      const items = data?.data?.items || [];
      return items;
    } catch (error) {
      console.error('Error fetching media categories:', error);
      return [];
    }
  },

  // GET /api/media/collections - List media collections
  async listCollections() {
    try {
      const url = `${API_BASE_URL}/media/collections`;
      const res = await fetch(url, { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await safeParseJson(res);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load collections';
        throw new Error(msg);
      }
      const items = data?.data?.items || [];
      return items;
    } catch (error) {
      console.error('Error fetching media collections:', error);
      return [];
    }
  },

  // GET /api/media/:id - Get specific media item (auto-increments view count)
  async getMedia(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/media/${id}`, {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });
      
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
        cache: 'no-store',
        headers: getAuthHeaders(),
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
