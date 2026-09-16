# CommerceDataProvider Contract

This contract is the stable internal interface used by EASY. A provider adapter implements it; EASY must not call Shopify, WooCommerce, or another provider directly from seller-facing flows.

## Methods

### `getConnectionStatus()`

Returns:

- `connected: boolean`
- `provider: string`
- `scopes: string[]` (non-secret scope names only)
- `checkedAt: ISO-8601 timestamp`
- `capabilities: { products, inventory, orders }`

### `listProducts(cursor?)`

Returns a paginated normalized collection:

- `items[]`
- `nextCursor: string | null`

Each item should contain, where available:

- `externalId`
- `sku`
- `title`
- `description`
- `status`
- `productUrl`
- `images[]` with stable external image identifiers/URLs
- `variants[]`
- `inventorySummary`
- `providerMetadata`

### `getProduct(externalId)`

Returns one normalized product or a typed `not_found` result.

### `listInventory(cursor?)`

Returns normalized inventory records keyed by `externalId`/`sku`, with quantity and availability status where the provider exposes them.

### `listOrders(params?)`

Returns normalized order summaries sufficient for seller workflows. Do not expose payment secrets or unnecessary personal data.

## Error contract

Adapters should normalize failures into stable categories:

- `authentication_required`
- `permission_denied`
- `rate_limited`
- `provider_unavailable`
- `validation_failed`
- `not_found`
- `unsupported_capability`
- `unknown_provider_error`

Provider-specific error payloads may be retained only in non-sensitive diagnostic metadata.

## Product DNA boundary

Commerce data is an input to Product DNA reconciliation, not an authority that can silently overwrite immutable product attributes. If title, SKU, image, variant, or other product facts conflict, EASY must surface the conflict for validation rather than silently choosing an unsafe value.

## Product Integrity boundary

No connector method may publish or finalize generated creative. The flow is:

1. Import normalized commerce data.
2. Validate schema and source state.
3. Reconcile Product DNA.
4. Generate or edit creative if requested.
5. Run Product Integrity.
6. Present the validated result to the seller.

## Privacy

Only collect the minimum commerce/customer information needed for the requested EASY workflow. Order data should default to summaries; full customer PII should not be imported unless a later, explicitly authorized feature requires it.
