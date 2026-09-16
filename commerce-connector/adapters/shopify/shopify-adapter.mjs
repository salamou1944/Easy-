/**
 * EASY Shopify read-only adapter using the Shopify GraphQL Admin API.
 * Credentials are runtime-only; no secrets belong in this repository.
 */
const DEFAULT_API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-07";

export function createShopifyAdapter({ shop, accessToken, apiVersion = DEFAULT_API_VERSION, fetchImpl = globalThis.fetch, now = () => new Date().toISOString() }) {
  if (!shop) throw new Error("shop_required");
  if (!accessToken) throw new Error("authentication_required");
  if (typeof fetchImpl !== "function") throw new Error("fetch_unavailable");
  const normalizedShop = String(shop).replace(/^https?:\/\//, "").replace(/\/$/, "");
  const endpoint = `https://${normalizedShop}/admin/api/${apiVersion}/graphql.json`;

  async function graphql(query, variables = {}) {
    try {
      const response = await fetchImpl(endpoint, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken }, body: JSON.stringify({ query, variables }) });
      if (response.status === 401) throw Object.assign(new Error("authentication_required"), { code: "authentication_required" });
      if (response.status === 403) throw Object.assign(new Error("permission_denied"), { code: "permission_denied" });
      if (response.status === 429) throw Object.assign(new Error("rate_limited"), { code: "rate_limited" });
      if (response.status >= 500) throw Object.assign(new Error("provider_unavailable"), { code: "provider_unavailable" });
      if (!response.ok) throw Object.assign(new Error("unknown_provider_error"), { code: "unknown_provider_error" });
      const payload = await response.json();
      if (payload.errors?.length) {
        const message = String(payload.errors[0]?.message || "unknown_provider_error").toLowerCase();
        const code = message.includes("access") || message.includes("permission") || message.includes("scope") ? "permission_denied" : "unknown_provider_error";
        throw Object.assign(new Error(code), { code });
      }
      return payload.data;
    } catch (error) {
      if (error?.code) throw error;
      throw Object.assign(new Error("provider_unavailable"), { code: "provider_unavailable", cause: error });
    }
  }

  function nextCursor(connection) {
    if (!connection?.pageInfo?.hasNextPage) return null;
    const cursor = connection.edges?.at(-1)?.cursor ?? null;
    if (!cursor) throw Object.assign(new Error("unknown_provider_error"), { code: "unknown_provider_error" });
    return cursor;
  }

  function normalizeProduct(product) {
    return {
      externalId: String(product.id), sku: product.variants?.nodes?.[0]?.sku ?? null,
      title: product.title ?? "", description: product.descriptionHtml ?? "", status: product.status ?? null,
      productUrl: product.onlineStoreUrl ?? null,
      images: (product.images?.nodes ?? []).map((image) => ({ id: String(image.id), url: image.url })),
      variants: (product.variants?.nodes ?? []).map((variant) => ({ externalId: String(variant.id), sku: variant.sku ?? null, title: variant.title ?? "", inventoryItemId: variant.inventoryItem?.id ? String(variant.inventoryItem.id) : null })),
      inventorySummary: product.totalInventory ?? null, providerMetadata: { provider: "shopify" },
    };
  }

  const PRODUCT_FIELDS = `id title descriptionHtml status onlineStoreUrl totalInventory images(first: 50) { nodes { id url } } variants(first: 100) { nodes { id sku title inventoryItem { id } } }`;

  return {
    async getConnectionStatus() {
      try {
        await graphql(`query ConnectionCheck { shop { name } }`);
        const capabilities = { products: false, inventory: false, orders: false };
        const probes = [
          ["products", `query ProductsCapability { products(first: 1) { nodes { id } } }`],
          ["inventory", `query InventoryCapability { productVariants(first: 1) { nodes { id } } }`],
          ["orders", `query OrdersCapability { orders(first: 1) { nodes { id } } }`],
        ];
        for (const [name, query] of probes) {
          try { await graphql(query); capabilities[name] = true; } catch (error) {
            if (error?.code === "authentication_required" || error?.code === "provider_unavailable" || error?.code === "rate_limited") throw error;
          }
        }
        return { connected: true, provider: "shopify", scopes: [], checkedAt: now(), capabilities };
      } catch (error) {
        return { connected: false, provider: "shopify", scopes: [], checkedAt: now(), capabilities: { products: false, inventory: false, orders: false }, error: error.code || "provider_unavailable" };
      }
    },
    async listProducts(cursor) {
      const data = await graphql(`query Products($after: String) { products(first: 50, after: $after) { nodes { ${PRODUCT_FIELDS} } pageInfo { hasNextPage } edges { cursor } } }`, { after: cursor || null });
      const connection = data.products;
      return { items: (connection?.nodes ?? []).map(normalizeProduct), nextCursor: nextCursor(connection) };
    },
    async getProduct(externalId) {
      const data = await graphql(`query Product($id: ID!) { product(id: $id) { ${PRODUCT_FIELDS} } }`, { id: String(externalId) });
      if (!data.product) return { product: null, error: "not_found" };
      return { product: normalizeProduct(data.product) };
    },
    async listInventory(cursor) {
      const data = await graphql(`query Inventory($after: String) { productVariants(first: 50, after: $after) { nodes { id sku inventoryItem { id inventoryLevels(first: 20) { nodes { id location { id name } quantities(names: ["available"]) { name quantity } } } } } pageInfo { hasNextPage } edges { cursor } } }`, { after: cursor || null });
      const connection = data.productVariants;
      const items = [];
      for (const variant of connection?.nodes ?? []) for (const level of variant.inventoryItem?.inventoryLevels?.nodes ?? []) {
        const available = level.quantities?.find((q) => q.name === "available")?.quantity ?? null;
        items.push({ externalId: String(variant.inventoryItem?.id ?? variant.id), sku: variant.sku ?? null, quantity: available, availabilityStatus: available === null ? "unknown" : available > 0 ? "available" : "unavailable", providerMetadata: { provider: "shopify", inventoryLevelId: level.id, locationId: level.location?.id ?? null, locationName: level.location?.name ?? null } });
      }
      return { items, nextCursor: nextCursor(connection) };
    },
    async listOrders(params = {}) {
      const data = await graphql(`query Orders($after: String, $query: String) { orders(first: 50, after: $after, query: $query) { nodes { id name displayFulfillmentStatus createdAt currentTotalPriceSet { shopMoney { amount currencyCode } } } pageInfo { hasNextPage } edges { cursor } } }`, { after: params.cursor || null, query: params.query || null });
      const connection = data.orders;
      return { items: (connection?.nodes ?? []).map((order) => ({ externalId: String(order.id), status: order.displayFulfillmentStatus ?? null, name: order.name ?? null, createdAt: order.createdAt ?? null, total: order.currentTotalPriceSet?.shopMoney?.amount ?? null, currency: order.currentTotalPriceSet?.shopMoney?.currencyCode ?? null, customer: null, providerMetadata: { provider: "shopify" } })), nextCursor: nextCursor(connection) };
    },
    mapProductId(externalId) { return { provider: "shopify", externalId: String(externalId) }; },
  };
}
