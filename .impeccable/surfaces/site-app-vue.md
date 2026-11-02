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

**OWN-WORLD:** Use the original blue/cyan masonry-block logo with a restrained navy and blue interface. The user has rejected warm paper/coral framing. Keep small rectangular controls and leave visual variety to the media.

**STORY:** Visitors scroll the mixed-media infinite masonry feed, observe loading, and open media or information in a closable reel. No permanent layout switch or automatic scrolling appears in this first demo. Provenance and simulated-feed details live in media information.

**FIRST VIEWPORT:** A compact brand-and-controls bar leads directly into a viewport-filling feed. No marketing heading, introductory paragraphs, install section, or promotional footer. Phone controls wrap and keep accessible targets.

**FORM:** Follow the user's specified blue branding and minimal demo frame. Use the saved comp-first workflow to visualize the correction before implementation; publication still requires review.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Proof and boundaries

Counters report actual loaded items and mounted cards. They are not FPS or production-throughput benchmarks. Preserve the independent library fixtures and package boundary. Verify desktop, phone, reduced motion, filter/reset recovery, and infinite loading through tests/site/. Publishing to vibe.wyxos.com remains pending the user's review and explicit instruction.
