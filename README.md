# Orbit Studio — spatial portfolio template

A fictional portfolio with 16 spatial projects and six full sample case studies. The bundled photography is a fixed, locally hosted collection sourced from Unsplash under the Unsplash License; photographer and source links are listed in `PHOTOGRAPHY-CREDITS.md`. No personal portfolio assets, AI-generated imagery, commercial fonts, site credentials, or hosting identity are included.

## Run
Serve this folder with a static web server (for example `python3 -m http.server 8766`). Open its localhost URL. No build step is required.

## Customize
- `projects.js`: names, descriptions, categories, memberships and colors. Keep names aligned with category memberships and the media lookup.
- `media.js`: thumbnail assets; add optional `video` filenames for looping video previews.
- `case-studies.js`: Index selection, case-study text and gallery media. Supports images and `type: "video"` entries.
- `index.html`: studio name, biography, email and social destinations.
- `assets/photos/`: replace the licensed sample photography with your own work.
- `app.js`: email copied to clipboard and biography image swaps.
- `theme.js`: theme persistence key.

Contact destinations intentionally use example.com. Replace them before publishing your own portfolio.

Desktop: hover, drag, immersive zoom, descriptions and random Next navigation. Mobile/tablet: rotate and tap previews without immersive zoom. Both: Index, case studies, info/contact overlays, clipboard email, dark mode, animated link underlines and opening sequence.

The original portfolio remains separate. This template is prepared for further editing and has not been published to Figma Community.
