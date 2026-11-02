# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Vibe serves Vue application developers building media feeds and visitors evaluating the library through its public showcase. The showcase's confirmed first-minute goal is to demonstrate graceful loading, animation, and responsive infinite scrolling.

## Product Purpose

Vibe is an initializable Vue 3 media-feed library with virtualized masonry and reel layouts. Its public showcase uses the real library so visitors can experience its behavior directly.

## Operating Context

The reusable package lives in `src/`; its public API is `src/index.ts`. The showcase is an independent consumer in `site/`. `npm run dev` serves the showcase on an available local port; `npm run dev:lib` watches library bundles and declarations. Library builds, tests, and package exports remain independent of the showcase.

## Capabilities and Constraints

- Preserve virtualization, continuous pagination, grouped media, images, video, audio, responsive layouts, and the library's existing public API.
- Preserve independent library regression tests and synthetic fixtures in `tests/`.
- Demonstrate actual library state. Loaded-item and mounted-card counts are observations, not FPS or production throughput claims.
- The first demo starts in an infinite masonry feed. Clicking media or its information action opens a closable reel; do not offer a permanent layout switch or automatic scrolling in this demo.
- The opening page mixes photographs, geometric artwork, video, audio and grouped posts. The finite original catalogue repeats during pagination; media information holds provenance and simulation details rather than the main status strip.
- Use originally authored, AI-generated, or explicitly licensed public media with provenance. Public visibility alone does not establish reuse permission.
- Keep private application data out of public assets and the published library package.
- The intended public showcase domain is `vibe.wyxos.com`. Publication requires the user's review and explicit instruction.

## Brand Commitments

The product name is Vibe and the package is `@wyxos/vibe`. Preserve the original blue/cyan masonry-block logo at `site/public/logo.svg`, recovered from the earlier project branding. The user specifies variations of blue for the interface and a quiet frame focused on the working demo. Warm paper/coral styling and prominent promotional copy were explicitly rejected. Document the implementation in `DESIGN.md`; initialization does not constitute approval of publication.

## Evidence on Hand

Library unit tests live in `tests/unit/`; source and built-library browser checks share the independent harness in `tests/browser/`. Showcase checks live in `tests/site/`. The current showcase's media-generation records are in `site/public/media/provenance.json`, with other asset credits in `site/public/credits.json`.

## Product Principles

- Let visitors use the feed immediately.
- Keep loading, movement, and recovery understandable.
- Make performance evidence observable and state its conditions.
- Keep the reusable library separate from its showcase and application policy.
- Preserve media provenance and accessible interaction.

## Accessibility & Inclusion

Keep keyboard access, visible focus, reduced-motion behavior, and usable phone controls. Verify the showcase at desktop, tablet, and phone sizes.
