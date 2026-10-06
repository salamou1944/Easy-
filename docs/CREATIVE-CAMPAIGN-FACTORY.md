# EASY Creative Campaign Factory

Status: canonical product contract implemented and extended with customer controls.

## Product definition

EASY Creative is not an image generator.

The canonical input is **one product image**. The customer can choose the desired source-image quality treatment and the video script direction. EASY then produces a complete campaign package intended for Meta advertising:

1. Source-image quality enhancement.
2. Multiple product angles from the same source product.
3. Multiple static ad formats.
4. Short promotional video.
5. Customer-selected video script.
6. Multiple primary-text, headline and CTA variants.
7. Meta-format/readiness checks.
8. Product Integrity validation before any generated asset is considered final.

## Customer controls

The customer chooses:
- Image quality treatment: balanced, high detail, or clean commercial.
- Video script: benefit-first, product-first, or problem-to-solution.

The selected video script is part of the campaign record and must be the script actually rendered by the provider. EASY must never silently substitute a different script.

## Non-negotiable integrity rule

Generated media may change presentation — background, environment, lighting, camera angle, composition and atmosphere — but must preserve authoritative Product DNA. Product color, logo, printed text, numbers, brand name, shape, major components and distinctive product details are immutable unless an explicit validated product-edit contract says otherwise.

## Fail-closed rule

The campaign manifest is a planning contract, not proof of generated media.

No asset is publishable merely because an HTTP request succeeded. Every provider-backed image/video artifact must be real, retrievable, tied to the source Product DNA, and pass the relevant integrity checks. Meta readiness must also be evaluated before publishability.

When a provider is unavailable, EASY may build the deterministic campaign manifest and continue repository-native engineering, but it must never label the campaign as Meta-ready/publishable.

## Commercial meaning

The sellable unit is a **Creative Campaign Pack**, not an individual generated image:

1 product image -> quality selection -> campaign/script selection -> generation -> integrity + Meta checks -> Meta-ready delivery

This is the foundation for pay-per-pack first, followed by repeat purchase and subscription once real customer demand is proven.


## Provider implementation

An optional fal.ai adapter is now present at `src/providers/fal-creative.mjs`. It is credential-free by default and performs no request unless a configured fal client is injected. The adapter targets current commercial-use image/video endpoints and returns only provider-reported artifacts; it never self-certifies integrity.

Current target models:
- `fal-ai/qwen-image-edit-2511` for source enhancement and product-angle generation.
- `fal-ai/wan/v2.6/image-to-video` for image-to-video.

These are provider capabilities, not proof that EASY has production access. A real production run still requires a configured provider credential, reachable source image, actual artifact output, visual integrity evidence, and Meta readiness evidence.

## Artifact gate

`src/creative-campaign-artifact-gate.mjs` is the final fail-closed boundary. It blocks publishability when any required artifact, integrity result, customer control, or Meta readiness proof is missing.

## Current state

The repository now contains:
- customer-facing quality selection;
- customer-facing exact video-script text selection;
- persistence of the exact selected script in the campaign manifest;
- provider-neutral artifact gating;
- an optional real fal.ai image/video adapter;
- regression tests and a dedicated CI workflow.

The remaining production proof is intentionally external: run a real customer product image through a configured provider and the visual-integrity/Meta validators. No fixture or contract test is treated as that proof.
