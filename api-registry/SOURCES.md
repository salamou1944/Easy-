# EASY API & Model Sources

This file records durable discovery sources for the EASY API Bank. It is intentionally separate from production integrations.

## Discovery catalogs

- public-apis/public-apis — https://github.com/public-apis/public-apis
- public-api-lists/public-api-lists — https://github.com/public-api-lists/public-api-lists
- public-api-lists JSON catalog — https://public-api-lists.github.io/public-api-lists/api/all.json
- BuiltByEcho/public-api-finder — https://github.com/BuiltByEcho/public-api-finder
- APIs.guru OpenAPI Directory — https://github.com/APIs-guru/openapi-directory
- kawsarlog/Ultimate-API-List — https://github.com/kawsarlog/Ultimate-API-List
- pacocartones/free-llm-api-hub — https://github.com/pacocartones/free-llm-api-hub
- build996/awesome-free-ai-apis — https://github.com/build996/awesome-free-ai-apis
- kax168/awesome-free-ai-apis — https://github.com/kax168/awesome-free-ai-apis
- nexscope-ai/awesome-ecommerce-apis-directory — https://github.com/nexscope-ai/awesome-ecommerce-apis-directory
- happyendpointhq/awesome-ecommerce-data-apis — https://github.com/happyendpointhq/awesome-ecommerce-data-apis
- kawsarlog/social-media-apis — https://github.com/kawsarlog/social-media-apis
- apia-standard — https://github.com/api-evangelist/apis

## EASY-first provider discovery

### AI / multimodal / vision
- Google Gemini API — https://ai.google.dev/
- OpenAI API — https://platform.openai.com/docs/
- Anthropic API — https://docs.anthropic.com/
- Mistral AI API — https://docs.mistral.ai/
- Groq API — https://console.groq.com/docs
- OpenRouter — https://openrouter.ai/docs
- Hugging Face Inference Providers — https://huggingface.co/docs/inference-providers/
- Cloudflare Workers AI — https://developers.cloudflare.com/workers-ai/
- Replicate — https://replicate.com/docs

### Image / video generation
- Replicate model catalog — https://replicate.com/explore
- fal.ai — https://docs.fal.ai/
- Stability AI — https://platform.stability.ai/docs
- Runway API — https://docs.dev.runwayml.com/
- Kling API — https://klingai.com/global/dev

### OCR / document / extraction
- OCR.space — https://ocr.space/ocrapi
- Google Cloud Vision — https://cloud.google.com/vision/docs
- Google Document AI — https://cloud.google.com/document-ai/docs
- Azure AI Vision — https://learn.microsoft.com/azure/ai-services/computer-vision/
- Nanonets — https://nanonets.com/api/

### Search / market research
- Tavily — https://docs.tavily.com/
- Brave Search API — https://api.search.brave.com/app/documentation
- Exa — https://docs.exa.ai/
- Serper — https://serper.dev/

### E-commerce / commerce
- Shopify Admin API — https://shopify.dev/docs/api
- WooCommerce REST API — https://woocommerce.github.io/woocommerce-rest-api-docs/
- BigCommerce APIs — https://developer.bigcommerce.com/docs
- eBay APIs — https://developer.ebay.com/api-docs/static/ebay-rest-landing.html
- Etsy Open API — https://developers.etsy.com/documentation/
- Amazon Selling Partner API — https://developer-docs.amazon.com/sp-api/
- AliExpress Open Platform — https://openservice.aliexpress.com/

### Ads / social
- Meta Marketing API — https://developers.facebook.com/docs/marketing-apis/
- Meta Ad Library — https://www.facebook.com/ads/library/
- Google Ads API — https://developers.google.com/google-ads/api/docs/start
- TikTok for Developers — https://developers.tiktok.com/
- Snapchat Marketing API — https://developers.snap.com/api/marketing-api/
- LinkedIn Marketing API — https://learn.microsoft.com/linkedin/marketing/

### Payments / identity
- Stripe — https://docs.stripe.com/api
- PayPal — https://developer.paypal.com/api/rest/
- Adyen — https://docs.adyen.com/api-explorer/
- Checkout.com — https://www.checkout.com/docs

### Logistics / tracking
- DHL APIs — https://developer.dhl.com/
- FedEx APIs — https://developer.fedex.com/
- UPS APIs — https://developer.ups.com/
- Shippo — https://docs.goshippo.com/
- EasyPost — https://docs.easypost.com/

### Maps / geocoding
- Google Maps Platform — https://developers.google.com/maps
- Mapbox — https://docs.mapbox.com/api/
- OpenStreetMap / Nominatim — https://nominatim.org/release-docs/latest/api/Overview/

### Speech / translation / moderation
- OpenAI Speech — https://platform.openai.com/docs/guides/text-to-speech
- Google Cloud Speech-to-Text — https://cloud.google.com/speech-to-text/docs
- Deepgram — https://developers.deepgram.com/
- ElevenLabs — https://elevenlabs.io/docs/api-reference
- Google Cloud Translation — https://cloud.google.com/translate/docs
- DeepL API — https://developers.deepl.com/docs
- AWS Translate — https://docs.aws.amazon.com/translate/
- Google Cloud Natural Language — https://cloud.google.com/natural-language/docs

## Rules

1. A catalog entry is not an integration decision.
2. Verify current API availability, auth, rate limits, pricing, commercial rights, privacy, reliability and output quality before production use.
3. Never commit API keys, OAuth secrets, passwords, cookies or tokens.
4. Production providers must sit behind provider-neutral EASY adapters.
5. Product Integrity must run before and after generation; no provider may bypass it.
6. Prefer official provider documentation over third-party directories when making an integration decision.
7. Keep free/trial status as metadata, not as a promise; limits and pricing change.
8. For Algeria-specific commerce, logistics and payments, availability must be checked separately before integration.
