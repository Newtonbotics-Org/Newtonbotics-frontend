import { API_BASE_URL } from './api';
import authService from './auth';

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

export const inventoryService = {
  // GET /api/inventory/equipment
  async listEquipment({ categoryId, status, q, limit = 20, skip = 0 } = {}) {
    try {
      const query = toQuery({ categoryId, status, q, limit, skip });
      const res = await fetch(`${API_BASE_URL}/inventory/equipment${query}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await safeParseJson(res);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load equipment';
        throw new Error(msg);
      }
      return data?.data || { items: [], pagination: { total: 0, limit, skip, hasMore: false } };
    } catch (error) {
      console.error('Error fetching equipment:', error);
      throw new Error(`Failed to load equipment: ${error.message}`);
    }
  },

  // GET /api/inventory/equipment/:id
  async getEquipment(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/equipment/${id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await safeParseJson(res);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load equipment item';
        throw new Error(msg);
      }
      return data?.data?.item;
    } catch (error) {
      console.error('Error fetching equipment item:', error);
      throw new Error(`Failed to load equipment item: ${error.message}`);
    }
  },

  // POST /api/inventory/equipment (auth: team_member+)
  async createEquipment(payload) {
    try {
      await authService.ensureValidToken();
      const res = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/equipment`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await safeParseJson(res);
      if (!res.ok || data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Create failed';
        throw new Error(msg);
      }
      return data?.data?.item;
    } catch (error) {
      throw error;
    }
  },

  // PUT /api/inventory/equipment/:id (auth: team_member+)
  async updateEquipment(id, payload) {
    try {
      await authService.ensureValidToken();
      const res = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/equipment/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await safeParseJson(res);
      if (!res.ok || data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Update failed';
        throw new Error(msg);
      }
      return data?.data?.item;
    } catch (error) {
      throw error;
    }
  },

  // DELETE /api/inventory/equipment/:id (auth: mentor+)
  async deleteEquipment(id) {
    try {
      await authService.ensureValidToken();
      const res = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/equipment/${id}`, {
        method: 'DELETE',
      });
      const data = await safeParseJson(res);
      if (!res.ok || data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Delete failed';
        throw new Error(msg);
      }
      return true;
    } catch (error) {
      throw error;
    }
  },

  // POST /api/inventory/equipment/:id/checkout (auth: team_member+)
  async checkoutEquipment(id, { 
    quantity = 1, 
    userId, 
    expectedReturnDate, 
    projectId, 
    checkoutNotes 
  } = {}) {
    try {
      await authService.ensureValidToken();
      const payload = { quantity };
      if (userId) payload.userId = userId;
      if (expectedReturnDate) payload.expectedReturnDate = expectedReturnDate;
      if (projectId) payload.projectId = projectId;
      if (checkoutNotes) payload.checkoutNotes = checkoutNotes;
      
      const res = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/equipment/${id}/checkout`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await safeParseJson(res);
      if (!res.ok || data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Checkout failed';
        throw new Error(msg);
      }
      return data?.data;
    } catch (error) {
      throw error;
    }
  },

  // PUT /api/inventory/equipment/:id/return (auth: team_member+)
  async returnEquipment(id, { checkoutId, quantity, returnNotes } = {}) {
    try {
      await authService.ensureValidToken();
      const payload = {};
      if (checkoutId) payload.checkoutId = checkoutId;
      if (quantity !== undefined) payload.quantity = quantity;
      if (returnNotes) payload.returnNotes = returnNotes;
      
      const res = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/equipment/${id}/return`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await safeParseJson(res);
      if (!res.ok || data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Return failed';
        throw new Error(msg);
      }
      return data?.data;
    } catch (error) {
      throw error;
    }
  },

  // GET /api/inventory/checkouts (auth: team_member+)
  async listCheckouts({ equipmentId, userId, projectId, status, limit = 20, skip = 0 } = {}) {
    try {
      await authService.ensureValidToken();
      const query = toQuery({ equipmentId, userId, projectId, status, limit, skip });
      const res = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/checkouts${query}`, {
        method: 'GET',
      });
      const data = await safeParseJson(res);
      if (!res.ok || data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load checkouts';
        throw new Error(msg);
      }
      return data?.data || { items: [], pagination: { total: 0, limit, skip, hasMore: false } };
    } catch (error) {
      throw error;
    }
  },

  // GET /api/inventory/checkouts/my (auth: team_member+)
  async getMyCheckouts({ status, limit = 20, skip = 0 } = {}) {
    try {
      await authService.ensureValidToken();
      const query = toQuery({ status, limit, skip });
      const res = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/checkouts/my${query}`, {
        method: 'GET',
      });
      const data = await safeParseJson(res);
      if (!res.ok || data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load your checkouts';
        throw new Error(msg);
      }
      return data?.data || { items: [], pagination: { total: 0, limit, skip, hasMore: false } };
    } catch (error) {
      throw error;
    }
  },

  // GET /api/inventory/equipment/:id/checkouts (auth: team_member+)
  async getEquipmentCheckouts(id, { status, limit = 20, skip = 0 } = {}) {
    try {
      await authService.ensureValidToken();
      const query = toQuery({ status, limit, skip });
      const res = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/equipment/${id}/checkouts${query}`, {
        method: 'GET',
      });
      const data = await safeParseJson(res);
      if (!res.ok || data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load equipment checkouts';
        throw new Error(msg);
      }
      return data?.data || { equipment: {}, items: [], pagination: { total: 0, limit, skip, hasMore: false } };
    } catch (error) {
      throw error;
    }
  },

  // GET /api/inventory/equipment/:id/checkouts/active (auth: team_member+)
  async getActiveCheckouts(id) {
    try {
      await authService.ensureValidToken();
      const res = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/equipment/${id}/checkouts/active`, {
        method: 'GET',
      });
      const data = await safeParseJson(res);
      if (!res.ok || data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load active checkouts';
        throw new Error(msg);
      }
      return data?.data || { equipment: {}, activeCheckouts: [], count: 0 };
    } catch (error) {
      throw error;
    }
  },

  // GET /api/inventory/checkouts/:checkoutId (auth: team_member+)
  async getCheckoutDetails(checkoutId) {
    try {
      await authService.ensureValidToken();
      const res = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/checkouts/${checkoutId}`, {
        method: 'GET',
      });
      const data = await safeParseJson(res);
      if (!res.ok || data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load checkout details';
        throw new Error(msg);
      }
      return data?.data?.checkout;
    } catch (error) {
      throw error;
    }
  },

  // POST /api/inventory/equipment/:id/urgent-checkout (auth: team_member+)
  async urgentCheckout(id, { quantity = 1, expectedReturnDate, notes } = {}) {
    await authService.ensureValidToken();
    const payload = JSON.stringify({ quantity, expectedReturnDate, notes });
    const paths = [
      `${API_BASE_URL}/inventory/equipment/${id}/urgent-checkout`,
      // Fallbacks for possible backend route naming variations
      `${API_BASE_URL}/inventory/equipment/${id}/urgentCheckout`,
      `${API_BASE_URL}/inventory/equipment/${id}/urgent`,
      // Alternate param order variants some backends use
      `${API_BASE_URL}/inventory/equipment/urgent-checkout/${id}`,
      `${API_BASE_URL}/inventory/equipment/urgentCheckout/${id}`,
      `${API_BASE_URL}/inventory/equipment/urgent/${id}`,
    ];

    let lastError;
    for (const url of paths) {
      try {
        const res = await authService.makeAuthenticatedRequest(url, { method: 'POST', body: payload });
        const data = await safeParseJson(res);
        if (!res.ok || data?.success === false) {
          const msg = data?.error?.message || data?.message || `Urgent checkout failed`;
          // Try next path only if 404; otherwise throw
          if (res.status === 404) {
            lastError = new Error(`Endpoint not found: ${url}`);
            continue;
          }
          throw new Error(msg);
        }
        return data?.data;
      } catch (err) {
        // If parse failed due to 404 HTML, treat as 404 and continue
        if ((err?.message || '').toLowerCase().includes('unexpected response') || (err?.message || '').includes('not found')) {
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    throw lastError || new Error('Urgent checkout endpoint not available');
  },

  // GET /api/inventory/categories
  async listCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/categories`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await safeParseJson(res);
      if (data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Failed to load categories';
        throw new Error(msg);
      }
      return data?.data?.items || [];
    } catch (error) {
      console.error('Error fetching inventory categories:', error);
      throw new Error(`Failed to load categories: ${error.message}`);
    }
  },

  // POST /api/inventory/categories (auth: team_member+)
  async createCategory(payload) {
    try {
      await authService.ensureValidToken();
      const res = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/categories`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await safeParseJson(res);
      if (!res.ok || data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Create category failed';
        throw new Error(msg);
      }
      return data?.data?.item;
    } catch (error) {
      throw error;
    }
  },

  // PUT /api/inventory/categories/:id (auth: team_member+)
  async updateCategory(id, payload) {
    try {
      await authService.ensureValidToken();
      const res = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await safeParseJson(res);
      if (!res.ok || data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Update category failed';
        throw new Error(msg);
      }
      return data?.data?.item;
    } catch (error) {
      throw error;
    }
  },

  // DELETE /api/inventory/categories/:id (auth: mentor+)
  async deleteCategory(id) {
    try {
      await authService.ensureValidToken();
      const res = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/categories/${id}`, {
        method: 'DELETE',
      });
      const data = await safeParseJson(res);
      if (!res.ok || data?.success === false) {
        const msg = data?.error?.message || data?.message || 'Delete category failed';
        throw new Error(msg);
      }
      return true;
    } catch (error) {
      throw error;
    }
  },
};

export default inventoryService;


