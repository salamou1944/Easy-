import assert from "node:assert/strict";
import test from "node:test";
import { normalizeImportedProduct, reconcileWithProductDNA, validateImportedProduct } from "./commerce-import.mjs";

test("rejects malformed imported products", () => {
  assert.deepEqual(validateImportedProduct(null), { valid: false, errors: ["product must be an object"] });
  assert.deepEqual(validateImportedProduct({ title: "Missing ID" }), { valid: false, errors: ["externalId is required"] });
  assert.equal(validateImportedProduct({ externalId: "p1", images: {} }).valid, false);
});

test("normalizes provider output without changing source meaning", () => {
  const product = normalizeImportedProduct({
    externalId: " p1 ", sku: " SKU-1 ", title: " Demo ", description: " Description ",
    images: [{ id: "img1", url: "https://example.test/a.jpg" }, null, { url: "https://example.test/b.jpg" }],
    variants: [{ externalId: "v1", sku: "SKU-1", title: "Default", inventoryItemId: "i1" }],
    providerMetadata: { provider: "shopify" },
  });
  assert.equal(product.externalId, "p1");
  assert.equal(product.sku, "SKU-1");
  assert.equal(product.images.length, 2);
  assert.equal(product.variants[0].inventoryItemId, "i1");
  assert.equal(product.providerMetadata.provider, "shopify");
});

test("surfaces conflicts instead of overwriting Product DNA", () => {
  const result = reconcileWithProductDNA(
    { externalId: "p1", sku: "SHOP-1", title: "Imported title", description: "Imported description" },
    { sku: "DNA-1", title: "Authoritative title", description: "Authoritative description" },
  );
  assert.equal(result.requiresValidation, true);
  assert.deepEqual(result.conflicts.map((item) => item.field), ["sku", "title", "description"]);
  assert.equal(result.authoritative.sku, "DNA-1");
  assert.equal(result.product.sku, "SHOP-1");
});

test("allows clean reconciliation when authoritative facts match", () => {
  const result = reconcileWithProductDNA(
    { externalId: "p1", sku: "SKU-1", title: "Same title" },
    { sku: "SKU-1", title: "Same title" },
  );
  assert.equal(result.requiresValidation, false);
  assert.deepEqual(result.conflicts, []);
});
