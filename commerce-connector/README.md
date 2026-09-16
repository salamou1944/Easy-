# EASY Commerce Connector Layer

## Purpose

Provide a provider-neutral boundary between EASY and external commerce platforms. The first implementation target is Shopify, followed by WooCommerce when the first connector contract is proven.

The layer is intentionally read-first: it imports seller/store context into EASY without allowing an external platform to bypass Product DNA, Product Integrity, validation, or EASY business rules.

## Initial scope

The first connector contract supports:

- Store connection metadata (without storing credentials in the repository)
- Product/catalog read
- Inventory read
- Order read
- Basic product identifier mapping
- Capability and health reporting

Write operations are deliberately out of scope for the first slice. They require explicit authorization, idempotency, audit logging, provider-specific permission checks, and a validated business workflow.

## Architecture

`Provider API -> Provider Adapter -> CommerceDataProvider -> EASY normalization -> Product DNA / Product Integrity -> Seller flow`

Provider-specific request/response shapes must stay inside the adapter. Seller-facing EASY flows consume the normalized contract only.

## Provider-neutral contract

Conceptual methods:

- `getConnectionStatus()`
- `listProducts(cursor?)`
- `getProduct(productId)`
- `listInventory(cursor?)`
- `listOrders(params?)`
- `mapProductId(externalId)`

Normalized objects should expose stable identifiers and only the fields required by EASY. Provider-specific fields may be preserved under a clearly namespaced `providerMetadata` object when needed.

## Security and integrity rules

1. Never commit API keys, access tokens, OAuth client secrets, cookies, or passwords.
2. Credentials belong in Replit Secrets or the production secret manager.
3. Treat imported commerce data as untrusted input: validate schemas before it enters product workflows.
4. External commerce data must not override immutable Product DNA attributes without an explicit, validated reconciliation rule.
5. Product Integrity remains authoritative before any creative generation or final seller-facing output.
6. Use least-privilege provider scopes and read-only scopes for the first connector whenever the provider supports them.
7. Log connector health and non-sensitive error information; never log credentials or raw authorization headers.
8. Provider availability, authentication, rate limits, pricing, commercial rights, privacy, reliability, and output quality must be verified before production activation.

## First connector

**Shopify** is the first target because it is already present in the EASY API registry as an ecommerce capability. The adapter should initially use read-only catalog/inventory/order access and remain replaceable by WooCommerce or another provider.

## Definition of done for the first slice

- Contract documented and provider-neutral.
- Shopify adapter boundary documented without secrets.
- Normalized product/catalog shape defined.
- Validation boundary documented.
- No write action or credential committed.
- Integration can be disabled without breaking the seller-facing EASY flow.
