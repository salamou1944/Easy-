import assert from "node:assert/strict";
import { createShopifyAdapter } from "./shopify-adapter.mjs";

function mockFetch(status, payload) {
  return async (url, options) => {
    assert.equal(options.method, "GET");
    assert.equal(options.headers.Accept, "application/json");
    assert.equal(options.headers["X-Shopify-Access-Token"], "runtime-only-token");
    return {
      status,
      ok: status >= 200 && status < 300,
      async json() { return payload; },
    };
  };
}

const adapter = createShopifyAdapter({
  shop: "demo.myshopify.com",
  accessToken: "runtime-only-token",
  fetchImpl: mockFetch(200, {
    products: [{
      id: 123,
      title: "Demo Product",
      body_html: "Description",
      status: "active",
      handle: "demo-product",
      images: [{ id: 7, src: "https://cdn.example/image.jpg" }],
      variants: [{ id: 8, sku: "SKU-8", title: "Default", inventory_item_id: 9 }],
    }],
  }),
});

const products = await adapter.listProducts();
assert.equal(products.items[0].externalId, "123");
assert.equal(products.items[0].sku, "SKU-8");
assert.equal(products.items[0].images[0].id, "7");
assert.equal(products.items[0].providerMetadata.provider, "shopify");

const unauthorized = createShopifyAdapter({
  shop: "demo.myshopify.com",
  accessToken: "runtime-only-token",
  fetchImpl: mockFetch(401, {}),
});
const status = await unauthorized.getConnectionStatus();
assert.equal(status.connected, false);
assert.equal(status.error, "authentication_required");

await assert.rejects(
  () => createShopifyAdapter({ shop: "demo.myshopify.com" }),
  /authentication_required/
);

console.log("Shopify adapter fixture tests passed");
