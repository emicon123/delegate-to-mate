// astro.config.mjs
//
// Base path is configurable at build time so the SAME source can be built
// twice: once for the eventual seohost.pl domain-root deploy (base "/"),
// once for a disposable LiteSpeed subpath test (base "/_test-static/").
//
// Set it via the PUBLIC_BASE_PATH env var, or just use the npm scripts:
//   npm run build              -> base "/"              (root, production shape)
//   npm run build:test-static  -> base "/_test-static/"  (Phase 2 live subpath test)
//
// Do NOT hardcode root-relative asset paths ("/assets/...") anywhere in the
// site — always go through Astro's asset pipeline / import.meta.env.BASE_URL
// so both builds work unmodified.
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const basePath = process.env.PUBLIC_BASE_PATH || '/';

export default defineConfig({
  base: basePath,
  integrations: [react()],
  build: {
    // Explicit (matches Astro's default) — hashed JS/CSS bundles land in
    // dist/<assets>/ with content-hash filenames, e.g. _astro/index.C3n5k1a2.js
    assets: '_astro',
    // Astro's default ('auto') inlines stylesheets under ~4kB straight into
    // the page <style> tag instead of emitting a separate hashed .css file —
    // this walking skeleton's placeholder CSS is small enough to hit that
    // path. Forcing 'never' here so the spike actually exercises and proves
    // the hashed-CSS-bundle code path, which real (larger, Tailwind-based)
    // production CSS will hit anyway regardless of this setting.
    inlineStylesheets: 'never',
  },
});
