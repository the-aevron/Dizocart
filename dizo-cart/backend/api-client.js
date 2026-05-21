/**
 * Dizo Cart — API Client
 * ============================================================
 * Unified HTTP request wrapper for backend communication.
 * Switches between localStorage (offline) and real API (online).
 *
 * Usage:
 *   import { api } from './backend/api-client.js';
 *   const products = await api.get('/products');
 *   const order = await api.post('/orders', orderData);
 * ============================================================
 */

const API_CONFIG = {
  // Set this to your backend URL when ready
  // e.g. 'https://api.dizocart.com/v1' or 'http://localhost:3000/api'
  baseUrl: '',  // Empty = use localStorage fallback

  // Set to 'firebase', 'supabase', 'rest', or 'local'
  provider: 'local',

  // Admin JWT token (set after admin login)
  adminToken: null
};

const api = {
  /**
   * Make a GET request
   * @param {string} endpoint
   * @param {Object} [params] - Query parameters
   */
  async get(endpoint, params = {}) {
    if (API_CONFIG.provider === 'local') {
      return this._localGet(endpoint, params);
    }
    const url = new URL(API_CONFIG.baseUrl + endpoint);
    Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));
    const res = await fetch(url.toString(), {
      headers: this._headers()
    });
    return this._handle(res);
  },

  /**
   * Make a POST request
   * @param {string} endpoint
   * @param {Object} body
   */
  async post(endpoint, body = {}) {
    if (API_CONFIG.provider === 'local') {
      return this._localPost(endpoint, body);
    }
    const res = await fetch(API_CONFIG.baseUrl + endpoint, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(body)
    });
    return this._handle(res);
  },

  /**
   * Make a PUT request
   * @param {string} endpoint
   * @param {Object} body
   */
  async put(endpoint, body = {}) {
    if (API_CONFIG.provider === 'local') {
      return this._localPut(endpoint, body);
    }
    const res = await fetch(API_CONFIG.baseUrl + endpoint, {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify(body)
    });
    return this._handle(res);
  },

  /**
   * Make a DELETE request
   * @param {string} endpoint
   */
  async delete(endpoint) {
    if (API_CONFIG.provider === 'local') {
      return this._localDelete(endpoint);
    }
    const res = await fetch(API_CONFIG.baseUrl + endpoint, {
      method: 'DELETE',
      headers: this._headers()
    });
    return this._handle(res);
  },

  /** Build request headers */
  _headers() {
    const h = { 'Content-Type': 'application/json' };
    if (API_CONFIG.adminToken) {
      h['Authorization'] = `Bearer ${API_CONFIG.adminToken}`;
    }
    return h;
  },

  /** Handle response and extract JSON */
  async _handle(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  // ============================================================
  // LOCAL STORAGE FALLBACKS (used when provider = 'local')
  // These match the existing dizo_catalog_v1 and dizo_store_db format
  // ============================================================

  _localGet(endpoint, params) {
    if (endpoint === '/products') {
      const raw = localStorage.getItem('dizo_catalog_v1');
      const db = raw ? JSON.parse(raw) : { products: [], bestSellers: [] };
      let items = [...(db.products || []), ...(db.bestSellers || [])];
      if (params.cat && params.cat !== 'all') items = items.filter(p => p.cat === params.cat);
      if (params.status) items = items.filter(p => p.status === params.status || !p.status);
      return { data: items, total: items.length };
    }
    if (endpoint.startsWith('/orders')) {
      const db = StoreDB ? StoreDB.get() : { orders: [] };
      return { data: db.orders || [] };
    }
    return { data: [] };
  },

  _localPost(endpoint, body) {
    if (endpoint === '/orders') {
      if (typeof StoreDB !== 'undefined') {
        StoreDB.recordOrder(body);
        return { success: true, orderId: body.id };
      }
    }
    return { success: false, error: 'Local fallback: not implemented' };
  },

  _localPut(endpoint, body) {
    if (endpoint.includes('/status')) {
      const orderId = endpoint.split('/')[2];
      if (typeof StoreDB !== 'undefined') {
        StoreDB.updateOrderStatus(orderId, body.status);
        return { success: true };
      }
    }
    return { success: false };
  },

  _localDelete(endpoint) {
    return { success: false, error: 'Local delete not implemented via API' };
  }
};

// Export for module environments
if (typeof module !== 'undefined') module.exports = { api, API_CONFIG };
