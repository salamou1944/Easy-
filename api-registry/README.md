# EASY API Registry

The central API Bank for EASY. This repository stores discovery metadata and integration candidates; it does not store secrets.

## What is stored here

- Curated APIs and model providers relevant to EASY.
- Official documentation links.
- EASY priority (`P0` = immediate architecture relevance, `P1` = important, `P2` = later, `P3` = optional).
- Discovery sources for expanding the bank.
- Rules for evaluating providers before integration.

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

## Architecture rule

An API appearing in this registry does **not** mean EASY should integrate it immediately.

Production integrations must use provider-neutral adapters. Seller Flow must remain provider-agnostic, and Product Integrity must never be bypassed.

## Provider evaluation checklist

Before production integration, verify:

- API is currently available.
- Authentication mechanism and required scopes.
- Rate limits and quotas.
- Current pricing and free/trial limits.
- Commercial-use rights and model licenses.
- Privacy and data-retention behavior.
- Reliability and operational maturity.
- Input/output quality for the exact EASY task.
- Geographic availability, especially Algeria where relevant.
- Whether the provider supports the required image/video/text/audio formats.

## Secrets policy

**Never commit** API keys, access tokens, OAuth client secrets, passwords, cookies, private certificates or other credentials to GitHub.

Secrets belong in Replit Secrets/environment variables or another dedicated secret manager.

## Discovery sources

See `SOURCES.md` for the maintained list of public catalogs, official provider documentation and model discovery sources.

The bank is deliberately curated rather than blindly importing tens of thousands of APIs. A huge catalog is useful for discovery, but every production candidate must still be verified individually.
