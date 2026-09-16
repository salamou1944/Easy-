import assert from "node:assert/strict";
import { createShopifyAdapter } from "./shopify-adapter.mjs";

function mockFetch(status, payload) {
  return async (url, options) => {
    assert.match(url, /\/admin\/api\/2026-07\/graphql\.json$/);
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Accept, "application/json");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.equal(options.headers["X-Shopify-Access-Token"], "runtime-only-token");
    return { status, ok: status >= 200 && status < 300, async json() { return payload; } };
  };
}

const productPayload = {
  data: {
    products: {
      nodes: [{
        id: "gid://shopify/Product/123", title: "Demo Product", descriptionHtml: "Description", status: "ACTIVE", onlineStoreUrl: "https://demo.myshopify.com/products/demo-product", totalInventory: 4,
        images: { nodes: [{ id: "gid://shopify/MediaImage/7", url: "https://cdn.example/image.jpg" }] },
        variants: { nodes: [{ id: "gid://shopify/ProductVariant/8", sku: "SKU-8", title: "Default", inventoryItem: { id: "gid://shopify/InventoryItem/9" } }] },
      }], pageInfo: { hasNextPage: false }, edges: [],
    },
  },
};

const adapter = createShopifyAdapter({ shop: "demo.myshopify.com", accessToken: "runtime-only-token", fetchImpl: mockFetch(200, productPayload) });
const products = await adapter.listProducts();
assert.equal(products.items[0].externalId, "gid://shopify/Product/123");
assert.equal(products.items[0].sku, "SKU-8");
assert.equal(products.items[0].images[0].url, "https://cdn.example/image.jpg");
assert.equal(products.items[0].providerMetadata.provider, "shopify");

const unauthorized = createShopifyAdapter({ shop: "demo.myshopify.com", accessToken: "runtime-only-token", fetchImpl: mockFetch(401, {}) });
const status = await unauthorized.getConnectionStatus();
assert.equal(status.connected, false);
assert.equal(status.error, "authentication_required");

await assert.rejects(() => createShopifyAdapter({ shop: "demo.myshopify.com" }), /authentication_required/);
console.log("Shopify adapter fixture tests passed");
