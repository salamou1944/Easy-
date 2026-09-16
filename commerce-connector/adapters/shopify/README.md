# Shopify Adapter — Read-Only First Slice

## Status
Implemented as an isolated read-only adapter using the Shopify GraphQL Admin API. Fixture tests and CI coverage are present. A manual live smoke path is now included, but it requires runtime-only credentials for an authorized Shopify test shop.

## Responsibilities
- Implement `CommerceDataProvider` for Shopify.
- Normalize Shopify product, inventory and order responses into the provider-neutral contract.
- Convert provider errors into the stable EASY error categories.
- Keep all Shopify-specific API details inside this adapter.
- Support cursor-based reads without exposing provider-specific shapes to EASY seller flows.

## Security
- Never commit Shopify access tokens, OAuth secrets, cookies or authorization headers.
- Use runtime secret storage only.
- Request least-privilege/read-only scopes for the first slice.
- Do not log customer PII or credentials.
- Do not add write operations to this first connector slice.

## Integrity boundary
Shopify data is untrusted input. Before it reaches seller-facing creative workflows:

1. Validate the response schema.
2. Reconcile Product DNA.
3. Detect conflicts rather than silently overwriting immutable attributes.
4. Run Product Integrity before any generated creative is presented as final.

The adapter itself does not decide Product DNA or Product Integrity outcomes.

## Runtime activation
The live smoke test is `live-smoke.mjs`. It requires these runtime-only environment variables:

- `SHOPIFY_SHOP`
- `SHOPIFY_ACCESS_TOKEN`
- `SHOPIFY_API_VERSION` (optional; defaults to `2026-07`)

It verifies connection status/capabilities and performs read-only product, inventory and order reads. It does not write to Shopify and does not print the access token.

GitHub Actions workflow: `.github/workflows/shopify-live-smoke.yml`. Run it manually only after the repository secrets point to an authorized test shop with the required least-privilege scopes.

## Runtime activation checklist
- Verify current Shopify API availability/version.
- Verify authentication and exact scopes for products, inventory and orders.
- Verify rate limits and pricing/commercial terms.
- Verify privacy/data-retention requirements.
- Run fixture/unit tests.
- Run the live smoke workflow with runtime secrets and an authorized test shop.
- Confirm connector failure does not break the EASY seller flow.
