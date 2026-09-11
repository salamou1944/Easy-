# EASY API Registry

This directory is the central catalog for APIs that may be useful to EASY.

## Sources

- public-apis/public-apis — large community-maintained collection of free APIs.
- public-api-lists/public-api-lists — curated collection with a JSON API.
- BuiltByEcho/public-api-finder — combines multiple API sources for discovery.

## EASY priority areas

1. AI / LLM
2. Vision / Product DNA / OCR
3. Image generation and editing
4. Video generation
5. Speech-to-text and text-to-speech
6. Web search and market research
7. E-commerce / product / pricing / reviews
8. Advertising and social platforms
9. Payments
10. Delivery and tracking
11. Maps / geocoding
12. Translation
13. Analytics
14. Moderation / safety
15. Product and barcode lookup

## Rule

Do not connect an API to the production EASY seller flow just because it appears in this registry. Each provider must be evaluated for availability, authentication, limits, pricing, commercial-use terms, reliability, privacy, and output quality before integration.

## Architecture

APIs are intended to sit behind provider-neutral adapters so EASY can switch providers without redesigning the seller-facing flow or bypassing Product Integrity.
