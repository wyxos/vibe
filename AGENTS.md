# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Repository: @wyxos/vibe — Vue 3 infinite-scroll masonry layout engine

Commands
- Install deps (npm is used in this repo):
  - npm ci
  - or: npm install
- Start dev server (avoid npm run dev per local preference):
  - vite
  - open http://localhost:5173
- Build (includes a post-step):
  - npm run build
  - Notes: build invokes `vite build` then runs `node write-cname.js` (present for GitHub Pages). If write-cname.js is absent locally, the script may no-op or fail—run `vite build` directly if needed.
- Preview production build:
  - vite preview
- Tests (Vitest + jsdom):
  - all tests: vitest
  - watch mode: vitest --watch
  - run a single test file: vitest tests/calculateLayout.test.js
  - run a single test name: vitest -t "should calculate correct layout positions"

High-level architecture
- Purpose
  - Provides a high-performance, responsive masonry layout component with infinite scrolling and smooth FLIP-style transitions for Vue 3 apps. Demo scaffold exists in src/App.vue, but the core is a reusable <Masonry> component.

- Core pieces
  - Component: src/Masonry.vue
    - Public API (props)
      - getPage(page): async data fetcher returning { items, nextPage } or { items, nextCursor } when using cursor mode
      - loadAtPage: initial page (nullable when paginationType='cursor')
      - items (Array): v-model:items as two-way binding
      - layout (Object, optional): merges with defaults
      - paginationType: 'page' | 'cursor' (default 'page')
      - init ('auto' | 'manual', default 'manual'), maxItems (default 100), pageSize (default 40)
      - transitionDurationMs (default 450), transitionEasing (default cubic-bezier(.22,.61,.36,1))
    - Emits
      - update:items for v-model
    - Exposed methods/refs (via defineExpose)
      - isLoading, refreshLayout, containerHeight, onRemove, removeMany, loadNext, loadPage, reset, initialize, paginationHistory
    - Lifecycle and events
      - On mount: computes columns from layout.sizes, seeds paginationHistory, triggers initial load (if init is 'auto'), sets up debounced scroll/resize listeners
      - If init is 'manual', user must call initialize() to initialize
      - On unmount: removes listeners

- Layout engine: src/calculateLayout.js
    - Inputs: items, container element (for measurements), columnCount, options (gutterX/Y, header/footer, paddings, sizes, placement)
    - Computes:
      - Scrollbar width (prefers measured container offsetWidth-clientWidth; falls back to DOM probe) to get usableWidth
      - Column width: floor((usableWidth - totalGutterX) / columnCount)
      - Auto-respects container CSS paddings: reads computed padding-left/right from the container and subtracts them in addition to any layout.paddingLeft/Right you pass
      - Placement strategies (via layout.placement):
        - 'masonry' (default): shortest-column placement for maximum balance
        - 'sequential-balanced': preserves source order by partitioning the sequence into k contiguous columns while balancing column heights
      - Each item stores: top, left, columnWidth, imageHeight, columnHeight
    - Returns a new array of items augmented with layout fields

  - Responsive sizing/utilities: src/masonryUtils.js
    - getColumnCount(layout): maps window.innerWidth to layout.sizes (base, sm, md, lg, xl, 2xl)
    - calculateContainerHeight(items): returns max item bottom plus a 500px buffer (prevents premature end-of-scroll)
    - getItemAttributes/getItemStyle: computes transform-based absolute positioning and data-* used by transitions and testing
    - calculateColumnHeights(items, columnCount): summarizes column heights; note: it groups by index%columns for summarization, while placement uses shortest-column; used for scroll trigger heuristics

  - Infinite scroll + cleanup: src/useMasonryScroll.js
    - handleScroll():
      - Computes visibleBottom and the longest column height; preloads when whitespace is visible or container bottom reached
      - Enforces maxItems by removing oldest pages in two phases:
        1) Phase 1: setItemsRaw to remove items so they animate out via leave transitions (no layout recompute yet)
        2) Phase 2: refreshLayout to recompute positions of remaining items and animate moves
      - After cleanup/reflow, maintains anchor position to minimize scroll jump (aims ~40% viewport stability)

  - Transitions: src/useMasonryTransitions.js
    - Provides onBeforeEnter/onEnter to fade/scale up into final transform, with a small per-item delay for natural stagger
    - onBeforeLeave/onLeave ensures items animate out cleanly from their current transform; includes a fallback timeout
    - Masonry.vue wires these to a transition-group with :css=false to fully control animations via JS + inline styles

  - Demo app shell: src/App.vue and src/main.js
    - Illustrates usage of <Masonry> with a fixture-driven getPage and an item slot that renders an image and a remove button
    - Not part of the published API; primarily for local development and GitHub Pages demo

- Rendering model
  - Items are absolutely positioned within a relatively positioned inner container with explicit height (containerHeight). Each item’s CSS uses transform: translate3d(left, top, 0) for compositor-friendly moves and smooth FLIP transitions.

- Vite and testing configuration
  - vite.config.js
    - Plugins: @vitejs/plugin-vue, @tailwindcss/vite (Tailwind v4 style integration; no dedicated tailwind.config.js present)
    - Vitest config: environment 'jsdom', globals enabled
  - package.json scripts of note
    - dev: vite (prefer invoking vite directly as noted above)
    - build: vite build && node write-cname.js
    - preview: vite preview
    - test: vitest

- Data and fixtures
  - src/pages.json: multiple pages of image metadata (id, width, height, src). Used by the demo to simulate paginated loading.

- Tests (Vitest + @vue/test-utils)
  - tests/Masonry.test.js: mounts the component, stubs transition-group, mocks lodash-es debounce and window.innerWidth, verifies exposed API and prop behavior, and cursor pagination mode shape
  - tests/calculateLayout.test.js: validates deterministic aspects of layout computation and stacking behavior
  - tests/masonryDistribution.test.js: asserts shortest-column distribution yields balanced column heights compared to round-robin

Conventions and notes for agents
- Use vite for local development instead of npm run dev.
- When debugging layout issues, start with:
  - Column computation: getColumnCount(layout)
  - Width derivation: scrollbar width and usableWidth in calculateLayout()
  - Placement: shortest-column selection and gutter math
  - Transitions: ensure data-left/data-top are present and transform is used (not top/left) for motion
- If adding pagination modes or cleanup policies, ensure useMasonryScroll phases remain in sync with transition timings to avoid jank.

