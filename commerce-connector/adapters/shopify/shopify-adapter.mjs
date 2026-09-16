/**
 * EASY Shopify read-only adapter.
 * Credentials are runtime-only; no secrets belong in this repository.
 */

const DEFAULT_API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-07";

export function createShopifyAdapter({ shop, accessToken, apiVersion = DEFAULT_API_VERSION, fetchImpl = globalThis.fetch, now = () => new Date().toISOString() }) {
  if (!shop) throw new Error("shop_required");
  if (!accessToken) throw new Error("authentication_required");
  if (typeof fetchImpl !== "function") throw new Error("fetch_unavailable");

  const normalizedShop = String(shop).replace(/^https?:\/\//, "").replace(/\/$/, "");
  const base = `https://${normalizedShop}/admin/api/${apiVersion}`;

  async function request(path) {
    try {
      const response = await fetchImpl(`${base}${path}`, {
        method: "GET",
        headers: { Accept: "application/json", "X-Shopify-Access-Token": accessToken },
      });
      if (response.status === 401) throw Object.assign(new Error("authentication_required"), { code: "authentication_required" });
      if (response.status === 403) throw Object.assign(new Error("permission_denied"), { code: "permission_denied" });
      if (response.status === 404) throw Object.assign(new Error("not_found"), { code: "not_found" });
      if (response.status === 429) throw Object.assign(new Error("rate_limited"), { code: "rate_limited" });
      if (response.status >= 500) throw Object.assign(new Error("provider_unavailable"), { code: "provider_unavailable" });
      if (!response.ok) throw Object.assign(new Error("unknown_provider_error"), { code: "unknown_provider_error" });
      return await response.json();
    } catch (error) {
      if (error?.code) throw error;
      throw Object.assign(new Error("provider_unavailable"), { code: "provider_unavailable", cause: error });
    }
  }

  function normalizeProduct(product) {
    return {
      externalId: String(product.id),
      sku: product.variants?.[0]?.sku ?? null,
      title: product.title ?? "",
      description: product.body_html ?? "",
      status: product.status ?? null,
      productUrl: product.handle ? `https://${normalizedShop}/products/${product.handle}` : null,
      images: (product.images ?? []).map((image) => ({ id: String(image.id), url: image.src })),
      variants: (product.variants ?? []).map((variant) => ({
        externalId: String(variant.id), sku: variant.sku ?? null, title: variant.title ?? "",
        inventoryItemId: variant.inventory_item_id ? String(variant.inventory_item_id) : null,
      })),
      inventorySummary: null,
      providerMetadata: { provider: "shopify" },
    };
  }

  return {
    async getConnectionStatus() {
      try {
        await request("/shop.json");
        return { connected: true, provider: "shopify", scopes: [], checkedAt: now(), capabilities: { products: true, inventory: true, orders: true } };
      } catch (error) {
        return { connected: false, provider: "shopify", scopes: [], checkedAt: now(), capabilities: { products: false, inventory: false, orders: false }, error: error.code || "provider_unavailable" };
      }
    },
    async listProducts() {
      const data = await request("/products.json?limit=50");
      return { items: (data.products ?? []).map(normalizeProduct), nextCursor: null };
    },
    async getProduct(externalId) {
      try {
        const data = await request(`/products/${encodeURIComponent(externalId)}.json`);
        return { product: normalizeProduct(data.product) };
      } catch (error) {
        if (error.code === "not_found") return { product: null, error: "not_found" };
        throw error;
      }
    },
    async listInventory() {
      const data = await request("/inventory_levels.json?limit=50");
      return { items: (data.inventory_levels ?? []).map((item) => ({
        externalId: String(item.inventory_item_id), sku: null, quantity: item.available ?? null,
        availabilityStatus: item.available > 0 ? "available" : "unavailable",
        providerMetadata: { provider: "shopify", locationId: item.location_id ? String(item.location_id) : null },
      })), nextCursor: null };
    },
    async listOrders(params = {}) {
      const query = new URLSearchParams({ status: params.status || "any", limit: String(Math.min(Number(params.limit) || 50, 50)) });
      const data = await request(`/orders.json?${query.toString()}`);
      return { items: (data.orders ?? []).map((order) => ({
        externalId: String(order.id), status: order.fulfillment_status ?? order.financial_status ?? null,
        createdAt: order.created_at ?? null, total: order.current_total_price ?? order.total_price ?? null,
        currency: order.currency ?? null, customer: null, providerMetadata: { provider: "shopify" },
      })), nextCursor: null };
    },
    mapProductId(externalId) { return { provider: "shopify", externalId: String(externalId) }; },
  };
}
