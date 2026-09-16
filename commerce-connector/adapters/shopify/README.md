# Shopify Adapter — Read-Only First Slice

## Status
Contract-ready adapter boundary. Runtime implementation is intentionally deferred until the EASY runtime surface and Shopify credentials/scopes are available.

## Responsibilities
- Implement `CommerceDataProvider` for Shopify.
- Normalize Shopify product, inventory and order responses into the provider-neutral contract.
- Convert provider errors into the stable EASY error categories.
- Keep all Shopify-specific API details inside this adapter.

## Security
- Never commit Shopify access tokens, OAuth secrets, cookies or authorization headers.
- Use runtime secret storage only.
- Request least-privilege/read-only scopes for the first slice.
- Do not log customer PII or credentials.

## Integrity boundary
Shopify data is untrusted input. Before it reaches seller-facing creative workflows:

1. Validate the response schema.
2. Reconcile Product DNA.
3. Detect conflicts rather than silently overwriting immutable attributes.
4. Run Product Integrity before any generated creative is presented as final.

## Runtime activation checklist
- Verify current Shopify API availability/version.
- Verify authentication and exact scopes.
- Verify rate limits and pricing/commercial terms.
- Verify privacy/data-retention requirements.
- Add adapter tests using fixtures first.
- Run integration tests only with runtime secrets.
- Confirm connector failure does not break the EASY seller flow.
