# Shopify Adapter — Read-Only First Slice

## Status
Implemented as an isolated read-only adapter using the Shopify GraphQL Admin API. Runtime credential wiring and live integration tests remain intentionally outside the repository until the EASY runtime and an authorized test shop/token are available.

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

## Runtime activation checklist
- Verify current Shopify API availability/version.
- Verify authentication and exact scopes for products, inventory and orders.
- Verify rate limits and pricing/commercial terms.
- Verify privacy/data-retention requirements.
- Run fixture/unit tests.
- Run integration tests only with runtime secrets and an authorized test shop.
- Confirm connector failure does not break the EASY seller flow.
