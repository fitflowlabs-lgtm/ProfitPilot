const API_BASE = 'https://marginpilot.co/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.redirect) {
      window.location.href = data.redirect;
      return null;
    }
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  // Session
  me: (shop) => request(`/api/me${shop ? `?shop=${encodeURIComponent(shop)}` : ''}`),
  logout: () => request('/logout', { method: 'POST' }),

  // Sync
  syncAll: (shop) => request(`/sync/all?shop=${encodeURIComponent(shop)}`, { method: 'POST' }),
  syncProducts: (shop) => request(`/sync/products?shop=${encodeURIComponent(shop)}`, { method: 'POST' }),
  syncOrders: (shop) => request(`/sync/orders?shop=${encodeURIComponent(shop)}`, { method: 'POST' }),

  // Dashboard
  dashboard: (shop) => request(`/dashboard?shop=${encodeURIComponent(shop)}`),

  // Products
  products: (shop) => request(`/products?shop=${encodeURIComponent(shop)}`),
  updateCost: (shop, variantId, cogs) =>
    request(`/products/${variantId}/cost?shop=${encodeURIComponent(shop)}`, {
      method: 'PUT',
      body: JSON.stringify({ cogs }),
    }),

  // Recommendations
  recommendations: (shop) => request(`/recommendations?shop=${encodeURIComponent(shop)}`),

  // Price actions
  applyPrice: (shop, variantId, suggestedPrice) =>
    request(`/prices/apply?shop=${encodeURIComponent(shop)}`, {
      method: 'POST',
      body: JSON.stringify({ variantId, suggestedPrice }),
    }),
  applyAllPrices: (shop) =>
    request(`/prices/apply-all?shop=${encodeURIComponent(shop)}`, { method: 'POST' }),
  undoPrice: (shop, variantId) =>
    request(`/prices/undo/${variantId}?shop=${encodeURIComponent(shop)}`, { method: 'POST' }),

  // Inventory
  inventory: (shop) => request(`/inventory?shop=${encodeURIComponent(shop)}`),

  // Deals
  simulateDeals: (shop, params) =>
    request(`/deals/simulate?shop=${encodeURIComponent(shop)}`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // AI
  aiSummary: (shop) =>
    request(`/ai/summary?shop=${encodeURIComponent(shop)}`, { method: 'POST' }),
  aiProduct: (shop, variantId) =>
    request(`/ai/product/${variantId}?shop=${encodeURIComponent(shop)}`, { method: 'POST' }),
  aiInventory: (shop, variantId) =>
    request(`/ai/inventory/${variantId}?shop=${encodeURIComponent(shop)}`, { method: 'POST' }),
  aiDeal: (shop, simulationData) =>
    request(`/ai/deal?shop=${encodeURIComponent(shop)}`, {
      method: 'POST',
      body: JSON.stringify({ simulationData }),
    }),
};