# Integration Architecture

## Objective

Make EASY and future products able to adopt useful external capabilities without coupling the product to a single vendor.

## Layers

1. Discovery layer — catalogs, directories, GitHub projects, OpenAPI specs, research sources.
2. Evaluation layer — verify capability, quality, licensing, commercial use, pricing, limits, privacy, reliability and maintenance.
3. Adapter layer — stable internal interface for each capability.
4. Secret layer — API keys/tokens stored only in runtime secret storage.
5. Product layer — seller/customer/business flows consume internal capabilities, not vendor-specific APIs directly.
6. Validation layer — security, schema validation, Product Integrity where applicable, output quality and fallback handling.

## Provider replacement principle

A provider can be replaced without changing the seller-facing flow whenever practical.

## Example capability interfaces

- VisionProvider
- OCRProvider
- LLMProvider
- ImageGenerationProvider
- VideoGenerationProvider
- SpeechProvider
- SearchProvider
- EcommerceDataProvider
- AdsProvider
- PaymentProvider
- DeliveryTrackingProvider
- MapsProvider
- TranslationProvider
- ModerationProvider
- AnalyticsProvider

## EASY Creative Engine rule

External image/video generation must not bypass Product DNA or Product Integrity. Immutable product attributes remain authoritative. Generated output must be validated before being presented as a final creative.

## Secret rule

No API key, access token or credential belongs in GitHub. Use Replit Secrets or an appropriate production secret manager.
