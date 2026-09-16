import { createShopifyAdapter } from "./shopify-adapter.mjs";

const shop = process.env.SHOPIFY_SHOP;
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-07";

if (!shop || !accessToken) {
  console.error("Missing SHOPIFY_SHOP or SHOPIFY_ACCESS_TOKEN. Live smoke test requires runtime-only credentials.");
  process.exit(2);
}

const adapter = createShopifyAdapter({ shop, accessToken, apiVersion });

const fail = (label, result) => {
  if (result?.error) {
    throw new Error(`${label}: ${result.error}${result.message ? ` — ${result.message}` : ""}`);
  }
};

const status = await adapter.getConnectionStatus();
fail("connection status", status);

if (!status.connected) {
  throw new Error(`Shopify connection is not healthy: ${status.error || "unknown_error"}`);
}

const products = await adapter.listProducts();
fail("products", products);

const inventory = await adapter.listInventory();
fail("inventory", inventory);

const orders = await adapter.listOrders();
fail("orders", orders);

console.log(JSON.stringify({
  ok: true,
  provider: "shopify",
  apiVersion,
  shop,
  capabilities: status.capabilities,
  samples: {
    products: products.items?.length ?? 0,
    inventory: inventory.items?.length ?? 0,
    orders: orders.items?.length ?? 0,
  },
}, null, 2));
