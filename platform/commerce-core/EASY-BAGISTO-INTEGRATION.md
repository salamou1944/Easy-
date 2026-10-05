# EASY ↔ Bagisto Integration Contract

## Architecture
Bagisto = commerce system of record for products, sellers, customers, carts and orders.
EASY = intelligence and operational layer.

```text
Bagisto
  ├─ Products / sellers / customers / orders
  ├─ Storefront / checkout
  └─ Vendor + admin operations
          │
          ▼
EASY adapter boundary
  ├─ Product DNA → AI Product Content API
  ├─ Order/customer context → Support Resolution Engine
  ├─ Support events → Chatwoot adapter
  ├─ Leads → Lead Qualification API
  └─ Creative requests → EASY Creative Engine
```

## Non-negotiable boundaries
- Bagisto remains authoritative for commerce facts.
- EASY must never invent order/customer/product facts.
- AI-generated product content must pass Product Integrity rules.
- Support responses remain human-reviewed during the first pilot.
- Provider failures fail closed.
- Secrets stay outside source control.
- Upstream Bagisto code is not rewritten merely to accommodate EASY.

## Data mapping to implement

| Bagisto | EASY |
|---|---|
| Product | Product DNA input |
| Product attributes | authoritativeFacts |
| Customer | support context |
| Order | order context |
| Order status | evidence for support resolution |
| Seller/vendor | EASY tenant identity |
| Support conversation | Chatwoot/support resolver event |

## Commercial target
The first usable milestone is not a feature-complete marketplace. It is a deployable seller workflow that can demonstrate:

1. seller signs in;
2. seller manages a product;
3. customer places an order;
4. EASY can read approved commerce context;
5. EASY can generate an evidence-backed support draft;
6. seller reviews and approves the response.

No revenue claim is valid until a real merchant completes this workflow and pays for a pilot.