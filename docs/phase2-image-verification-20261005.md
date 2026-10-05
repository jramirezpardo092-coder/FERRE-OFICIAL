# Final researched media release

This follow-up preserves the verified UI release and adds 264 approved image assignments from two frozen research sets: 139 in phase 2 and 125 in phase 3. Across both, 146 references are in stock and 118 have zero stock; none of those stock values changes.

Frozen source hashes:
- Phase 2: `41518b035bc792966156f70ea3a7ed70051a0aa30bf91ab1510c17386d74c29e`
- Phase 3: `17bbd5aad3c504558f8eee263c4aec0b7e7dd9f5912a89a1cefa4168c3c530b2`

- Approved media coverage becomes 537 of 1,319 products, with 782 still missing an accepted image. Media includes photos, diagrams, scoped component views and clearly labelled illustrations.
- All 12 withdrawn references remain untouched. Their identity/generation conflicts are recorded in the accompanying provenance file.
- Commercial source files, product identities, prices, taxes, units, stock and canonical slugs are unchanged.
- The 264 paths require only 206 new Git image objects. Existing and identical objects are reused, avoiding 58 repeated binary transfers.
- All 548 referenced image files decode. Original dimensions and pixels are preserved by the lossless WebP importer.
- 197 exact captions and 194 media-kind labels survive the importer, enrichment and public API. Captions disclose shared-size/no-scale views, incomplete kits, single pieces of pairs and excluded installation furniture.
- Cards place caveats in their readable text column, rather than the 88-pixel mobile thumbnail. Captions follow the active or fallback image. Details and quick views retain the complete caption.
- `15389` explicitly states “No incluye cama ni colchón.”
- Public provenance contains source URLs, hashes and evidence. Local file locations and research-only metadata are not part of the public product DTO. Source copyright remains in force; these files are not represented as openly licensed.

## Verification before remote CI

- 256 Node tests and 20 Python importer tests passed.
- Type checking and production build passed; all 1,319 product routes remain generated.
- ESLint: no errors, 17 existing compiler-rule warnings.
- All 264 original-to-WebP RGBA pixel comparisons passed with identical dimensions.
- All 264 live local API galleries match the canonical source exactly.
- Local HTTP protocol checks passed 149/149.
- Every new product detail was checked over local production HTTP: 264/264 routes, captions, kinds and image paths passed.
- Local Next ISR returns `x-nextjs-cache: HIT` and a 300-second shared-cache lifetime. The HTTP verifier's `--require-isr` flag is specifically for Vercel CDN delivery and is reserved for the final public deployment check.
- A dedicated required browser gate checks caption/image rendering and accessibility, including the installed-bed exclusion and genuinely zero-stock products, in both themes and mobile/desktop layouts. Its remote result must be reviewed before merging.

Together with the first published 81-image batch, the researched additions total 345 distinct SKU mappings. Remaining references need the documented product-identity, variant, source-access or reuse clarification; they retain honest missing-image states.

## Remaining source work

`product-images-pending-20261005.csv` contains the exact 782 unresolved SKUs (491 stocked), with Spanish reasons, information needed and public source references. Follow `product-images-pending-README.txt` to preserve the 61 leading-zero SKUs when importing it. No accepted SKU or private research path is included.
