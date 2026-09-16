const PRODUCT_FIELDS = ["externalId", "sku", "title", "description", "status", "productUrl", "images", "variants", "inventorySummary", "providerMetadata"];

function cleanString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeImage(image) {
  if (!image || typeof image !== "object") return null;
  const id = cleanString(image.id);
  const url = cleanString(image.url);
  if (!id && !url) return null;
  return { id, url };
}

function normalizeVariant(variant) {
  if (!variant || typeof variant !== "object") return null;
  return {
    externalId: cleanString(variant.externalId),
    sku: cleanString(variant.sku),
    title: cleanString(variant.title),
    inventoryItemId: cleanString(variant.inventoryItemId),
  };
}

export function validateImportedProduct(product) {
  if (!product || typeof product !== "object") {
    return { valid: false, errors: ["product must be an object"] };
  }
  const externalId = cleanString(product.externalId);
  if (!externalId) return { valid: false, errors: ["externalId is required"] };
  if (product.images != null && !Array.isArray(product.images)) {
    return { valid: false, errors: ["images must be an array"] };
  }
  if (product.variants != null && !Array.isArray(product.variants)) {
    return { valid: false, errors: ["variants must be an array"] };
  }
  return { valid: true, errors: [] };
}

export function normalizeImportedProduct(product) {
  const validation = validateImportedProduct(product);
  if (!validation.valid) {
    const error = new Error(validation.errors.join(", "));
    error.code = "validation_failed";
    throw error;
  }

  const normalized = {};
  for (const field of PRODUCT_FIELDS) normalized[field] = product[field] ?? null;
  normalized.externalId = cleanString(product.externalId);
  normalized.sku = cleanString(product.sku);
  normalized.title = cleanString(product.title);
  normalized.description = cleanString(product.description);
  normalized.status = cleanString(product.status);
  normalized.productUrl = cleanString(product.productUrl);
  normalized.images = (product.images ?? []).map(normalizeImage).filter(Boolean);
  normalized.variants = (product.variants ?? []).map(normalizeVariant).filter(Boolean);
  normalized.providerMetadata = product.providerMetadata && typeof product.providerMetadata === "object"
    ? { ...product.providerMetadata }
    : {};
  return normalized;
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Reconcile external commerce data against authoritative Product DNA.
 * The commerce record is never allowed to silently overwrite DNA.
 */
export function reconcileWithProductDNA(importedProduct, productDNA, authoritativeFields = ["sku", "title", "description"]) {
  const imported = normalizeImportedProduct(importedProduct);
  const dna = productDNA && typeof productDNA === "object" ? productDNA : {};
  const conflicts = authoritativeFields
    .filter((field) => dna[field] != null && imported[field] != null && !sameValue(dna[field], imported[field]))
    .map((field) => ({ field, authoritativeValue: dna[field], importedValue: imported[field] }));

  return {
    product: imported,
    conflicts,
    requiresValidation: conflicts.length > 0,
    authoritative: { ...dna },
  };
}
