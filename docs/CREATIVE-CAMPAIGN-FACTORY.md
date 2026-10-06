# EASY Creative Campaign Factory

Status: canonical product contract implemented.

## Product definition

EASY Creative is **not** an image generator.

The canonical input is **one product image**. The canonical output is a complete creative campaign package intended to be reviewed and prepared for Meta advertising:

1. Multiple product angles from the same source product.
2. Multiple static ad formats.
3. Short promotional video.
4. Multiple primary-text, headline and CTA variants.
5. Meta-format/readiness checks.
6. Product Integrity validation before any generated asset is considered final.

## Non-negotiable integrity rule

Generated media may change presentation — background, environment, lighting, camera angle, composition and atmosphere — but must preserve authoritative Product DNA. Product color, logo, printed text, numbers, brand name, shape, major components and distinctive product details are immutable unless an explicit validated product-edit contract says otherwise.

## Fail-closed rule

The campaign manifest is a planning contract, not proof of generated media.

No asset is publishable merely because an HTTP request succeeded. Every provider-backed image/video artifact must be real, retrievable, tied to the source Product DNA, and pass the relevant integrity checks. Meta readiness must also be evaluated before publishability.

When a provider is unavailable, EASY may build the deterministic campaign manifest and continue repository-native engineering, but it must never label the campaign as Meta-ready/publishable.

## Canonical implementation

- `src/creative-campaign-factory.mjs` defines the campaign manifest, required angles, static formats, video contract, copy variants and fail-closed publishability gate.
- `test/creative-campaign-factory.test.mjs` verifies the one-image expansion and blocked-before-provider behavior.

## Commercial meaning

The sellable unit is a **Creative Campaign Pack**, not an individual generated image:

`1 product image -> campaign pack -> customer review -> validated assets -> Meta-ready delivery`

This is the foundation for pay-per-pack first, followed by repeat purchase and subscription once real customer demand is proven.
