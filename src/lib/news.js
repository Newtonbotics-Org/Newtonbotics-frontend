// Public News and Newsletter API client
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

export function isValidObjectId(id) {
  return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
}

export const newsService = {
  // GET /api/news
  async listNews({ isPublished = true, isFeatured, categoryId, q, limit = 20, skip = 0 } = {}) {
    try {
      const query = toQuery({ isPublished, isFeatured, categoryId, q, limit, skip });
      const res = await fetch(`${API_BASE_URL}/news${query}`, { cache: 'no-store' });
      
      if (!res.ok) {
        // Gracefully degrade on rate limiting
        if (res.status === 429) {
          return { items: [], pagination: { total: 0, limit, skip, hasMore: false } };
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      let data;
      try {
        data = await safeParseJson(res);
      } catch (_) {
        // If parse fails under heavy load, just return empty list
        return { items: [], pagination: { total: 0, limit, skip, hasMore: false } };
      }
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load news';
        // Do not crash UI for ticker; return empty gracefully
        return { items: [], pagination: { total: 0, limit, skip, hasMore: false }, message: msg };
      }
      
      return data?.data || { items: [], pagination: { total: 0, limit, skip, hasMore: false } };
    } catch (error) {
      console.error('Error fetching news:', error);
      // Graceful fallback for ticker
      return { items: [], pagination: { total: 0, limit, skip, hasMore: false } };
    }
  },

  // GET /api/news/:id
  async getNews(id) {
    if (!isValidObjectId(id)) {
      return null;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/news/${id}`, { cache: 'no-store' });

      if (res.status === 404) {
        return null;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await safeParseJson(res);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load news item';
        throw new Error(msg);
      }

      return data?.data?.item ?? null;
    } catch (error) {
      console.error('Error fetching news item:', error);
      throw new Error(`Failed to load news item: ${error.message}`);
    }
  },

  // GET /api/news/categories
  async listCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/news/categories`, { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await safeParseJson(res);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load categories';
        throw new Error(msg);
      }
      
      return data?.data?.categories || data?.data?.items || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error(`Failed to load categories: ${error.message}`);
    }
  },

  // POST /api/newsletter/subscribe
  async subscribeNewsletter({ email, firstName, lastName }) {
    try {
      const res = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await safeParseJson(res);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Subscription failed';
        throw new Error(msg);
      }
      
      return data;
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      throw new Error(`Subscription failed: ${error.message}`);
    }
  },

  // DELETE /api/newsletter/unsubscribe
  async unsubscribeNewsletter({ email }) {
    try {
      const res = await fetch(`${API_BASE_URL}/newsletter/unsubscribe`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await safeParseJson(res);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Unsubscribe failed';
        throw new Error(msg);
      }
      
      return data;
    } catch (error) {
      console.error('Error unsubscribing from newsletter:', error);
      throw new Error(`Unsubscribe failed: ${error.message}`);
    }
  },
};

export default newsService;


