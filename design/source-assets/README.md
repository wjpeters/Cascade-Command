# Original game images

The original PNG files are preserved here, outside the published `public/` tree.
Only the WebP derivatives in `public/assets/` ship to browsers.

Conversion on 2026-10-01 used Sharp with these settings:

- Background: original 1254 × 1254, WebP quality 80, effort 6.
- Logo: resized from 2048 × 518 to 512 × 130, lossless WebP, effort 6.
- Sprites: extract the top-left node and bottom-right shield from the original
  2 × 2 atlas (627 × 627 per tile), resize each to 512 × 512, and composite
  them left-to-right on a transparent 1024 × 512 canvas. WebP quality 88,
  alpha quality 100, effort 6. The unused two tiles are omitted.

The filenames contain the first 12 hexadecimal characters of each derivative's
SHA-256. Update `src/assets.js`, the sprite preload and logo in `public/index.html`,
and both background references in `public/style.css` together when replacing
images. The renderer expects two square tiles arranged left-to-right.

`manifest.json` records the size and SHA-256 of the preserved originals.
