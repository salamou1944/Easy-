# EASY Creative Image Integrity Gate

Status: design contract ready for implementation.

The Creative Engine must treat image generation as a gated operation, not a successful HTTP request.

## Required flow

Product input -> Product DNA -> image provider -> visual integrity verification -> seller review -> publish.

A generated image is never publishable unless the integrity verifier has positively verified preservation of product color, logo, printed text/letters/numbers, brand name, shape, major components, and distinctive details.

## Provider boundary

The provider adapter must return an image artifact plus generation metadata. It must not self-certify visual integrity.

## Fail-closed rules

- provider timeout/error -> BLOCKED
- missing image artifact -> BLOCKED
- missing integrity verification -> BLOCKED
- integrity failure -> BLOCKED
- deterministic placeholder/fallback -> DEMO ONLY, never publishable
- successful provider HTTP response alone -> insufficient evidence

## Collection leverage

The current Collection identifies ComfyUI for composable local image generation/editing, rembg for background removal, and Upscayl for local upscaling. These should be evaluated as adapters/components rather than copied into EASY.

## Next production gate

Implement a provider-neutral image adapter and a real visual verification adapter, then run a real product image through the full gate. No production claim until that evidence exists.
