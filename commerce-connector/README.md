# EASY Commerce Connector Layer

## Purpose

Provide a provider-neutral boundary between EASY and external commerce platforms. Shopify is the first connector; WooCommerce remains replaceable and can follow after the contract is proven.

The layer is intentionally read-first: it imports seller/store context into EASY without allowing an external platform to bypass Product DNA, Product Integrity, validation, or EASY business rules.

## Initial scope

- Store connection metadata (without storing credentials in the repository)
- Product/catalog read
- Inventory read
- Order read
- Basic product identifier mapping
- Capability and health reporting
- Validated import boundary before product workflows

Write operations are deliberately out of scope for the first slice. They require explicit authorization, idempotency, audit logging, provider-specific permission checks, and a validated business workflow.

## Architecture

`Provider API -> Provider Adapter -> CommerceDataProvider -> validated commerce import -> Product DNA reconciliation -> Product Integrity -> Seller flow`

Provider-specific request/response shapes stay inside the adapter. Seller-facing EASY flows consume the normalized contract only.

## Current implementation

- Provider-neutral contract: implemented.
- Shopify read-only adapter: implemented as an isolated adapter boundary.
- Validated commerce import boundary: implemented in `core/commerce-import.mjs`.
- Import validation tests: implemented and included in CI.
- Runtime credential wiring: not enabled in GitHub; credentials belong in Replit Secrets or the production secret manager.
- Integration tests against a live Shopify shop: pending runtime access and an authorized test shop/token.

## Security and integrity rules

1. Never commit API keys, access tokens, OAuth client secrets, cookies, or passwords.
2. Credentials belong in Replit Secrets or the production secret manager.
3. Treat imported commerce data as untrusted input: validate and normalize schemas before it enters product workflows.
4. External commerce data must not override immutable Product DNA attributes without an explicit, validated reconciliation rule.
5. The import boundary surfaces conflicts between commerce data and authoritative Product DNA; it does not silently resolve them.
6. Product Integrity remains authoritative before any creative generation or final seller-facing output.
7. Use least-privilege provider scopes and read-only scopes for the first connector whenever the provider supports them.
8. Log connector health and non-sensitive error information; never log credentials or raw authorization headers.
9. Provider availability, authentication, rate limits, pricing, commercial rights, privacy, reliability, and output quality must be verified before production activation.

## Shopify activation checklist

- Verify the currently supported Shopify Admin API version and endpoint availability.
- Verify authentication and exact read-only scopes.
- Verify rate limits and commercial terms.
- Verify privacy/data-retention requirements.
- Run fixture/unit tests.
- Run integration tests only with runtime secrets.
- Confirm connector failure does not break the EASY seller flow.

## Definition of done for the first slice

- Contract documented and provider-neutral.
- Shopify adapter implemented behind the contract.
- Normalized product/catalog shape defined.
- Validated import boundary implemented and tested.
- Product DNA / Product Integrity boundaries documented.
- No write action or credential committed.
- Integration can be disabled without breaking the seller-facing EASY flow.
