# EASY Platform Leverage

Use mature self-hostable components to close generic gaps instead of rebuilding commerce, support, creative, document, and automation primitives.

## Candidates
- Commerce: Medusa, Vendure, Saleor, WooCommerce/PrestaShop.
- Support/CRM: Chatwoot, Twenty, EspoCRM.
- Automation: n8n and compatible workflow engines.
- Creative: rembg, Upscayl, ComfyUI, FFmpeg, whisper.cpp, Piper.
- Documents: OCRmyPDF, Docling, Tesseract.
- API/control plane: APISIX, STOA, LiteLLM, local-model runtimes.

## Implemented slice
EASY now exposes an explicit local-image operation boundary through `src/local-image-ops.mjs`.
Background removal and upscaling are optional local capabilities configured through `REMBG_COMMAND` and `UPSCAYL_COMMAND`. No cloud API is assumed and missing tools return `blocked`; execution errors remain failures.

## Acceptance gates
1. Benchmark rembg on representative seller images.
2. Benchmark Upscayl on representative seller images.
3. If both pass, wire them into the Creative Engine as explicit stages.
4. Evaluate one commerce foundation against EASY requirements before replacing existing connector boundaries.
5. Evaluate Chatwoot/Twenty only against a concrete support/CRM gap.
