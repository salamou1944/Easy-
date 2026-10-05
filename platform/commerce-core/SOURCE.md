# EASY Commerce Core — Bagisto

## Selected upstream
- Repository: https://github.com/bagisto/bagisto
- Branch: 2.4
- Pinned commit: b40f998fa482dcbc99d24dccd4f45a263032100b
- License: MIT

## Role in EASY
Bagisto is the commerce core. EASY remains the product/AI/operator layer.

Bagisto supplies:
- storefront
- catalog
- cart and checkout
- orders
- customer accounts
- seller/vendor marketplace capabilities
- multi-tenant commerce capability
- admin/vendor dashboards

EASY supplies:
- Product DNA and integrity policy
- AI Product Content API
- Lead Qualification API
- Support Resolution Engine
- Chatwoot boundary
- creative/provider-neutral layer
- Algeria-specific commerce workflows and integrations

## Integration rule
Do not fork or copy Bagisto application code into EASY until the runtime/deployment boundary is verified. Pin the upstream commit first, then integrate through explicit adapters and configuration.

## First integration gates
1. Boot Bagisto from the pinned commit.
2. Verify storefront + admin + vendor flows locally/CI.
3. Connect Bagisto product/order events to EASY adapters.
4. Add EASY authentication/tenant boundary without modifying upstream business logic unnecessarily.
5. Deploy a disposable integration environment before production.
6. Only then promote the combined platform to the EASY public runtime.
