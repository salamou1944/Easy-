import assert from "node:assert/strict";
import { createShopifyAdapter } from "./shopify-adapter.mjs";

function mockFetch(status, payload, seen = []) {
  return async (url, options) => {
    seen.push({ url, options, payload });
    assert.match(url, /\/admin\/api\/2026-07\/graphql\.json$/);
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Accept, "application/json");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.equal(options.headers["X-Shopify-Access-Token"], "runtime-only-token");
    return { status, ok: status >= 200 && status < 300, async json() { return payload; } };
  };
}

const productPayload = {
  data: { products: { nodes: [{
    id: "gid://shopify/Product/123", title: "Demo Product", descriptionHtml: "Description", status: "ACTIVE", onlineStoreUrl: "https://demo.myshopify.com/products/demo-product", totalInventory: 4,
    images: { nodes: [{ id: "gid://shopify/MediaImage/7", url: "https://cdn.example/image.jpg" }] },
    variants: { nodes: [{ id: "gid://shopify/ProductVariant/8", sku: "SKU-8", title: "Default", inventoryItem: { id: "gid://shopify/InventoryItem/9" } }] },
  }], pageInfo: { hasNextPage: false }, edges: [] } },
};

const adapter = createShopifyAdapter({ shop: "https://demo.myshopify.com/", accessToken: "runtime-only-token", fetchImpl: mockFetch(200, productPayload) });
const products = await adapter.listProducts();
assert.equal(products.items[0].externalId, "gid://shopify/Product/123");
assert.equal(products.items[0].sku, "SKU-8");
assert.equal(products.items[0].images[0].url, "https://cdn.example/image.jpg");
assert.equal(products.items[0].providerMetadata.provider, "shopify");
assert.equal(products.nextCursor, null);

const inventoryPayload = { data: { productVariants: {
  nodes: [{ id: "gid://shopify/ProductVariant/8", sku: "SKU-8", inventoryItem: { id: "gid://shopify/InventoryItem/9", inventoryLevels: { nodes: [{ id: "level-1", location: { id: "loc-1", name: "Main" }, quantities: [{ name: "available", quantity: 3 }] }] } } }],
  pageInfo: { hasNextPage: true }, edges: [{ cursor: "cursor-1" }],
} } };
const inventoryAdapter = createShopifyAdapter({ shop: "demo.myshopify.com", accessToken: "runtime-only-token", fetchImpl: mockFetch(200, inventoryPayload) });
const inventory = await inventoryAdapter.listInventory();
assert.equal(inventory.items[0].quantity, 3);
assert.equal(inventory.items[0].availabilityStatus, "available");
assert.equal(inventory.items[0].providerMetadata.locationName, "Main");
assert.equal(inventory.nextCursor, "cursor-1");

const ordersPayload = { data: { orders: {
  nodes: [{ id: "gid://shopify/Order/55", name: "#1001", displayFulfillmentStatus: "FULFILLED", createdAt: "2026-09-16T10:00:00Z", currentTotalPriceSet: { shopMoney: { amount: "42.00", currencyCode: "USD" } } }],
  pageInfo: { hasNextPage: true }, edges: [{ cursor: "order-cursor" }],
} } };
const ordersAdapter = createShopifyAdapter({ shop: "demo.myshopify.com", accessToken: "runtime-only-token", fetchImpl: mockFetch(200, ordersPayload) });
const orders = await ordersAdapter.listOrders({ query: "status:open" });
assert.equal(orders.items[0].externalId, "gid://shopify/Order/55");
assert.equal(orders.items[0].total, "42.00");
assert.equal(orders.items[0].currency, "USD");
assert.equal(orders.nextCursor, "order-cursor");

const missingProduct = createShopifyAdapter({ shop: "demo.myshopify.com", accessToken: "runtime-only-token", fetchImpl: mockFetch(200, { data: { product: null } }) });
assert.deepEqual(await missingProduct.getProduct("gid://shopify/Product/404"), { product: null, error: "not_found" });

for (const [status, code] of [[401, "authentication_required"], [403, "permission_denied"], [429, "rate_limited"], [503, "provider_unavailable"], [400, "unknown_provider_error"]]) {
  const failing = createShopifyAdapter({ shop: "demo.myshopify.com", accessToken: "runtime-only-token", fetchImpl: mockFetch(status, {}) });
  await assert.rejects(() => failing.listProducts(), (error) => error.code === code && error.message === code);
}

const graphqlDenied = createShopifyAdapter({ shop: "demo.myshopify.com", accessToken: "runtime-only-token", fetchImpl: mockFetch(200, { errors: [{ message: "Access denied for field products" }] }) });
await assert.rejects(() => graphqlDenied.listProducts(), (error) => error.code === "permission_denied");

const malformedPage = createShopifyAdapter({ shop: "demo.myshopify.com", accessToken: "runtime-only-token", fetchImpl: mockFetch(200, { data: { products: { nodes: [], pageInfo: { hasNextPage: true }, edges: [] } } }) });
await assert.rejects(() => malformedPage.listProducts(), (error) => error.code === "unknown_provider_error");

const unauthorized = createShopifyAdapter({ shop: "demo.myshopify.com", accessToken: "runtime-only-token", fetchImpl: mockFetch(401, {}) });
const status = await unauthorized.getConnectionStatus();
assert.equal(status.connected, false);
assert.equal(status.error, "authentication_required");

assert.throws(() => createShopifyAdapter({ shop: "demo.myshopify.com" }), /authentication_required/);
console.log("Shopify adapter fixture tests passed");
