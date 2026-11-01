---
name: Vibe showcase
description: Existing Vibe showcase design baseline
colors:
  coral: "#e86b49"
  paper: "#f4f2ec"
  ink: "#191b1b"
  muted: "#676962"
  line: "#d9d8d1"
  stage: "#101313"
  stage-panel: "#171b1b"
  hover: "#e9e7df"
typography:
  display:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "clamp(31px, 3.65vw, 58px)"
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-.035em"
  title:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "25px"
    fontWeight: 500
    letterSpacing: "-.025em"
  body:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "13px"
    lineHeight: 1.6
  label:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "12px"
rounded:
  detail: "2px"
  control: "3px"
  stage: "4px"
spacing:
  page-gutter: "clamp(16px, 3vw, 48px)"
  control-gap: "12px"
  gallery-padding: "10px"
components:
  filter:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    typography: "{typography.label}"
  filter-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
  filter-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.ink}"
  header-install:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    typography: "{typography.label}"
  stage:
    backgroundColor: "{colors.stage}"
    textColor: "{colors.paper}"
    rounded: "{rounded.stage}"
---

# Design System: Vibe showcase

## Overview

**Creative North Star: "The Gallery Exhibition"**

This records the current showcase implementation as the baseline for future work; it does not approve publication. A warm paper surround, ink typography and restrained coral punctuation frame a dense, dark media exhibition. Space Grotesk keeps the frame direct and compact; the actual library feed carries the visual variety.

The product priority is graceful loading, animation and infinite-scroll performance. The visible implementation makes these behaviors inspectable with real library state and DOM counts. See [PRODUCT.md](PRODUCT.md) for scope. Publication to vibe.wyxos.com remains pending explicit user review.

**Key Characteristics:**

- Compact introduction and a dominant interactive media stage.
- Flat paper-and-ink frame with small corners and thin dividers.
- Honest live state, with original repeated fixtures and disclosed simulated latency.

## Colors

### Primary

Coral marks the wordmark punctuation, headline punctuation and keyboard focus. Ink, rather than coral, fills the selected collection control.

### Neutral

Paper is the page ground; ink carries primary text; muted handles supporting copy; line separates sections. Stage and stage-panel establish a dark exhibition surface and its footer. Hover gives quiet feedback to controls on paper.

## Typography

The locally hosted Space Grotesk variable face supplies display, body and controls. The install command uses the platform monospace stack. The frontmatter records the desktop roles; these are observed values rather than a newly imposed modular scale.

On phones the headline uses `clamp(35px, 8.8vw, 48px)`, line height (1.07), and a maximum width of (12ch). Intro copy becomes (11px); controls become (11px). Small card metadata and status labels currently reach (9px); that density is recorded as a review concern, not a recommended text floor.

## Layout

The header, intro, feed toolbar, bounded media stage, caption, install strip and footer form one vertical sequence. Shared fluid page gutters align the frame. The desktop stage height is `max(440px, calc(100dvh - 315px))`; at widths above (1700px), it is capped with `min(760px, calc(100dvh - 315px))`.

At (850px) and below, the header caption, intro note and scroll hint disappear. At (600px) and below, the toolbar becomes two rows, icon controls grow to (44px), the integration strip stacks, gallery padding becomes (6px), and the stage uses `max(420px, calc(100dvh - 390px))`. The phone frame therefore leaves a smaller share of its first viewport for media than desktop; the stage continues below the fold.

The library receives masonry minimum column widths of (240px) on desktop and (145px) on phones, with overscan bounded between (350px) and (650px). These settings are implementation details, not a measured throughput guarantee.

Responsive regression coverage lives in `tests/site/showcase.spec.ts`. Review captures are generated artifacts, not design tokens.

## Elevation & Depth

The showcase stylesheet uses no box shadows. Thin rules, surface changes and the dark stage establish depth. The information sheet uses a constrained column with fixed header and footer; its body scrolls.

## Shapes

Corners remain small: detail controls, cards and the stage use the observed frontmatter radii. Media clips inside the stage. Buttons are rectangular and use thin borders or quiet fills; no pill silhouette appears in the showcase frame.

## Components

- **Collection filters:** transparent at rest, ink-filled when pressed, muted surface on hover. Pressed state is exposed through `aria-pressed`.
- **Layout and restart controls:** compact icon buttons; selected layout has a muted fill. Keyboard focus uses the shared coral outline (2px) with (4px) offset.
- **Auto scroll:** outlined text-and-icon button, changing to Pause while enabled, with a warm pressed fill. It is user controlled.
- **Media stage:** actual Vibe masonry and reel layouts, card footer (56px), provenance information, and a fixed status bar. Opening card information switches to reel and opens its sheet.
- **Status bar:** loaded derives from library item state; rendered counts current masonry items or reel shells. No FPS figure is synthesized. Page fixtures repeat in batches of (12); first load waits (180ms), later pages (450ms). The caption discloses repetition and page latency.
- **Install controls:** header shortcut and a monospace command button share clipboard feedback. Copy failure exposes a selectable command and an alert.

Control transitions use (140ms). The stylesheet reduces transition and animation duration under reduced-motion preference; the underlying library owns feed/media animation.

## Do's and Don'ts

### Do:

- **Do** preserve the quiet paper frame and dark media stage when revising this candidate.
- **Do** keep loading and rendered counts tied to actual state and keep fixture simulation disclosed.
- **Do** review desktop, phone and tablet compositions before approving this direction.

### Don't:

- **Don't** describe this candidate as user-approved or publicly deployed.
- **Don't** present fixture repetition, simulated latency or DOM counts as a production performance benchmark.
- **Don't** treat the current tiny metadata sizes as a typography standard for future surfaces.
