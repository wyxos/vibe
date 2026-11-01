---
version: 1
slug: "site-app-vue"
primary_target: "site/App.vue"
related_targets: ["site/site.css","site/useShowcase.ts"]
---

## Goal

The first home-page demo shows the real Vibe feed loading gracefully, its animation, and responsive infinite scrolling. Visitors can use it immediately. Product constraints live in PRODUCT.md; observed visual tokens live in DESIGN.md.

## Mode

Experience: let visitors explore the actual library rather than read a feature pitch first.

## Direction contract

**THESIS:** The working infinite feed is the primary demonstration; a large marketing introduction must not push it out of the first viewport.

**OWN-WORLD:** The implemented gallery frame uses warm paper, ink, restrained coral, small rectangular controls, and a dark media stage. Preserve the current baseline unless the user requests a visual change.

**STORY:** Visitors scroll, observe loading, optionally start automatic scrolling, and explore other media/layouts. Repeated original fixtures and simulated page latency remain explicit.

**FIRST VIEWPORT:** Compact navigation and introduction lead directly to the feed controls and a dominant media stage. Phone controls wrap and keep accessible targets.

**FORM:** Document the existing gallery-exhibition implementation; initialization is not a new concept choice or approval of publication.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Proof and boundaries

Counters report actual loaded items and mounted cards. They are not FPS or production-throughput benchmarks. Preserve the independent library fixtures and package boundary. Verify desktop, phone, reduced motion, filter/reset recovery, and infinite loading through tests/site/. Publishing to vibe.wyxos.com remains pending the user's review and explicit instruction.
