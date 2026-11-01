---
name: Vibe showcase
description: Blue branding and a demo-first frame
colors:
  page: "#071321"
  surface: "#0c1e33"
  supporting: "#152e4a"
  text: "#e9f2ff"
  muted: "#adc4de"
  primary: "#3b82f6"
  cyan: "#06b6d4"
  line: "#234260"
  action: "#2563d4"
  selected: "#1b3d63"
  selected-text: "#b9d7ff"
  selection: "#245b9c"
  scrollbar: "#45688d"
  action-hover: "#1d56bc"
  action-pressed: "#1e4d8b"
  busy: "#76b0ff"
  white: "#ffffff"
  error-surface: "#48212c"
  error-border: "#d17b8f"
typography:
  sheet-title:
    fontSize: "21px"
  phone-brand:
    fontSize: "22px"
  phone-label:
    fontSize: "11px"
  disclosure:
    fontSize: "9px"
  error:
    fontSize: "13px"
  brand:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "23px"
    fontWeight: 600
    letterSpacing: "-.03em"
  body:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: 1.75
  label:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "12px"
  status:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "10px"
    lineHeight: 1.4
rounded:
  indicator: "1px"
  detail: "2px"
  control: "3px"
spacing:
  desktop-toolbar: "10px 18px"
  phone-toolbar: "8px 10px"
  gallery-padding: "10px"
components:
  filter-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    height: "44px"
  auto-scroll:
    backgroundColor: "{colors.action}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    height: "44px"
  stage:
    backgroundColor: "{colors.page}"
    textColor: "{colors.text}"
---

# Design System: Vibe showcase

## Overview

The working demo leads. A compact blue control bar and the original blue/cyan masonry logo frame a viewport-filling media feed. The user explicitly rejected the earlier warm paper/coral palette and prominent promotional copy.

This records the implemented correction and confirmed brand requirements; publication still requires user review. PRODUCT.md owns product constraints, and the showcase surface brief owns page strategy.

## Colors

Use navy for the page, deeper blue surfaces for controls and card footers, and lighter blue for supporting surfaces. Primary blue and cyan come from the original logo. Pale blue text provides contrast. Active actions use the stronger action blue; selected filters use the selected blue surface.

Media retains its original colors. Interface branding must not recolor the displayed artwork.

## Typography

Use the locally hosted Space Grotesk face. The largest visible text is the compact brand name; there is no display headline. Controls and card titles use small, readable labels. The provenance sheet uses 14px body copy and a 21px title. Status text is subordinate to the feed, never a promotional heading.

## Layout

The page is a 100dvh flex column: a compact toolbar followed immediately by a feed filling the remaining space. The feed owns scrolling. There is no marketing introduction, install section, or promotional footer.

Desktop toolbar minimum height is 68px. At 700px and below, the brand and actions occupy the first row and filters the second; controls retain 44px targets. At 900px and below, spacing tightens and the secondary GitHub link hides. The status strip stays at the bottom of the stage, with the fixture disclosure wrapping to its own row on phones.

## Elevation & Depth

Use flat blue surfaces and thin blue dividers. No decorative shadows, glow, or glass effects are needed. The original logo's existing gradient remains part of the brand asset.

## Shapes

Keep controls and media corners small: 2px for detail controls and 3px for ordinary controls and cards. The stage fills its container without a decorative outer card.

## Components

- Original logo: use site/public/logo.svg, restored from project history; do not replace it with an invented mark.
- Filters: transparent at rest, supporting-blue hover, selected-blue pressed state, aria-pressed semantics.
- Auto scroll: one clear blue action; Pause appears while enabled.
- Layout, reset, and project controls: compact icons with accessible names and 44px targets.
- Card footer: title and information action; omit repeated collection text from the visible frame.
- Status: actual loaded and rendered counts, request state, and a quiet disclosure of repeated fixtures and simulated latency.
- Information sheet: blue surfaces, fixed header/footer, scrolling body, and media provenance.

Control transitions use 140ms; focus uses a 2px cyan outline. Feed-to-reel opening preserves the original 160ms slide from the left. Keep the existing reel image fade and zoom, with both settling together over 160ms instead of running at different speeds. Post navigation uses elapsed-time animation so its duration stays consistent across refresh rates. Respect reduced motion. Vibe itself owns feed and media animation.

## Do's and Don'ts

- Do preserve the original logo and variations of blue.
- Do give the feed the overwhelming share of the viewport.
- Do keep essential controls, source disclosure, and performance observations honest.
- Don't restore warm paper/coral framing, large marketing headings, taglines, or promotional sections.
- Don't convert fixture counts or simulated latency into production-performance claims.
- Don't publish the showcase before the user's review and explicit instruction.
