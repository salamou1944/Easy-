# EASY Creative Image Integrity Gate

Status: provider job/artifact retrieval implemented; provider-neutral visual verification adapter implemented; a real vision analyzer remains the production gate.

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

## ComfyUI execution boundary

The ComfyUI adapter can optionally wait for `/history/{prompt_id}` and extract the generated image artifact plus a `/view` URL. The wait is opt-in so unit tests and non-blocking callers can retain submission semantics. Production use must enable completion waiting and enforce a finite timeout.

## Next production gate

Connect a real vision/image analyzer to `createVisualIntegrityVerifier`, then run a real product image through the full gate. The adapter deliberately refuses to manufacture evidence: analyzer output must explicitly prove each required preservation flag. No production claim until that evidence exists.
