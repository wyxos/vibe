import type { DocumentationCodeLanguage } from '@/demo/documentationCode'

export interface DocumentationSection {
  id: string
  label: string
  title: string
  description: string[]
  code: string
  language: DocumentationCodeLanguage
  notes?: string[]
}

export interface DocumentationGroup {
  title: string
  items: DocumentationSection[]
}

export const documentationGroups: DocumentationGroup[] = [
  {
    title: 'Getting Started',
    items: [
      {
        id: 'installation',
        label: 'Installation',
        title: 'Installation',
        description: [
          'Install the package and import the bundled stylesheet once in your app entry.',
          'The package ships its own compiled CSS, so you do not need Tailwind scanning for the component styles.',
        ],
        code: `npm i @wyxos/vibe`,
        language: 'bash',
      },
      {
        id: 'quick-start',
        label: 'Quick Start',
        title: 'Quick Start',
        description: [
          'The default export is the plugin, so the shortest setup is plugin-first.',
          'That registers the global component as VibeLayout.',
        ],
        code: `import { createApp } from 'vue'
import App from './App.vue'

import Vibe from '@wyxos/vibe'
import '@wyxos/vibe/style.css'

createApp(App)
  .use(Vibe)
  .mount('#app')`,
        language: 'ts',
      },
    ],
  },
  {
    title: 'Data Flow',
    items: [
      {
        id: 'item-contract',
        label: 'Item Contract',
        title: 'Item Contract',
        description: [
          'Vibe only needs a small media contract: id, type, url, and optional title, preview, and dimensions.',
          'The type surface is intentionally capped at image, video, audio, and other.',
        ],
        code: `type VibeViewerItem = {
  id: string
  type: 'image' | 'video' | 'audio' | 'other'
  title?: string
  url: string
  width?: number
  height?: number
  preview?: {
    url: string
    width?: number
    height?: number
  }
  [key: string]: unknown
}`,
        language: 'ts',
        notes: [
          'Grid prefers preview.url, then falls back to url.',
          'Fullscreen uses url.',
          'Grid layout prefers preview dimensions, then root dimensions, then a square fallback tile.',
        ],
      },
      {
        id: 'auto-resolve',
        label: 'Auto Resolve',
        title: 'Auto Resolve',
        description: [
          'Use resolve when you want Vibe to own the common paging loop internally.',
          'The cursor is opaque, so the app can return page numbers or string cursors, and Vibe will preserve them in status.',
        ],
        code: `import {
  VibeLayout,
  type VibeResolveParams,
  type VibeResolveResult,
} from '@wyxos/vibe'

async function resolve({ cursor, pageSize }: VibeResolveParams): Promise<VibeResolveResult> {
  const response = await fetch(\`/api/feed?cursor=\${cursor ?? ''}&pageSize=\${pageSize}\`)
  return await response.json()
}

<VibeLayout :resolve="resolve" />`,
        language: 'vue',
        notes: [
          'Resolve must return items and nextPage.',
          'previousPage is optional and enables previous-page loading.',
          'Auto mode defaults to dynamic feed behavior.',
        ],
      },
      {
        id: 'feed-strategies',
        label: 'Feed Strategies',
        title: 'Dynamic And Static Feed Strategies',
        description: [
          'Dynamic mode keeps resolving forward or backward until it has enough items to satisfy the current page size, then commits that batch once.',
          'Static mode reloads the current edge cursor in place before advancing when local removals have underfilled the current boundary page.',
        ],
        code: `<VibeLayout
  :resolve="resolve"
  mode="dynamic"
  :page-size="25"
  :fill-delay-ms="2000"
  :fill-delay-step-ms="1000"
  :show-end-badge="false"
  :show-status-badges="false"
/>`,
        language: 'vue',
        notes: [
          'dynamic is the default mode.',
          'fill-delay-ms controls the base delay before the first chained fill request.',
          'fill-delay-step-ms adds extra delay for each additional chained request in the same fill cycle.',
          'Defaults are 2000ms and 1000ms.',
          'A trailing-edge retry after exhaustion reloads the current boundary cursor so newly available pages can appear.',
          'show-end-badge controls the fullscreen End reached badge.',
          'show-status-badges controls the built-in lifecycle status overlays.',
          'Status exposes phase, raw cursors, fill counts, and the live delay countdown.',
          'Phase distinguishes initializing, loading, filling, refreshing, failed, and idle.',
        ],
      },
      {
        id: 'seeded-state',
        label: 'Seeded State',
        title: 'Seeded State',
        description: [
          'Use initialState when the app already knows a restored slice of the feed and wants Vibe to hydrate from that snapshot immediately.',
          'This keeps one library-owned data model while still letting the parent seed items, cursors, and the starting active index.',
        ],
        code: `<VibeLayout
  :resolve="resolve"
  :initial-state="{
    cursor: 'page-10',
    items: restoredItems,
    nextCursor: 'page-11',
    previousCursor: 'page-9',
    activeIndex: 4,
  }"
/>`,
        language: 'vue',
        notes: [
          'resolve is optional if you only need a seeded snapshot.',
          'When resolve is present, Vibe continues paging from the seeded cursors.',
        ],
      },
    ],
  },
  {
    title: 'Customization',
    items: [
      {
        id: 'item-icon',
        label: 'Item Icon',
        title: 'Item Icon Slot',
        description: [
          'Use item-icon when the app wants to customize icons, especially for richer other subtypes.',
          'The slot receives the current item and Vibe’s fallback icon component.',
        ],
        code: `<VibeLayout :resolve="resolve">
  <template #item-icon="{ item, icon }">
    <component :is="item.type === 'other' ? MyCustomIcon : icon" />
  </template>
</VibeLayout>`,
        language: 'vue',
      },
      {
        id: 'grid-overlay',
        label: 'Grid Overlay',
        title: 'Grid Overlay Slot',
        description: [
          'Use grid-item-overlay to add per-item controls such as reactions, moderation actions, or badges.',
          'The overlay runs on desktop grid mode only and receives hover, focus, and openFullscreen helpers.',
        ],
        code: `<VibeLayout :resolve="resolve">
  <template #grid-item-overlay="{ item, hovered }">
    <div v-if="hovered" class="absolute inset-x-0 bottom-0 p-3">
      <div class="pointer-events-auto bg-black/45 px-3 py-2 backdrop-blur">
        <button type="button">Like {{ item.title }}</button>
      </div>
    </div>
  </template>
</VibeLayout>`,
        language: 'vue',
      },
      {
        id: 'grid-footer',
        label: 'Grid Footer',
        title: 'Grid Footer Slot',
        description: [
          'Use grid-footer to render app-owned UI under the masonry surface.',
          'This is useful for status bars, feed telemetry, or context-specific actions.',
        ],
        code: `<VibeLayout ref="vibe" :resolve="resolve">
  <template #grid-footer>
    <div class="bg-black/55 px-4 py-3 backdrop-blur">
      Items loaded: {{ vibe?.status.itemCount ?? 0 }}
    </div>
  </template>
</VibeLayout>`,
        language: 'vue',
      },
    ],
  },
  {
    title: 'API Reference',
    items: [
      {
        id: 'api-components',
        label: 'Components',
        title: 'Components',
        description: [
          'The package exports a plugin-first surface and a named component export.',
          'Use the plugin for global registration or import VibeLayout directly for local registration.',
        ],
        code: `import Vibe, { VibeLayout, VibePlugin } from '@wyxos/vibe'

app.use(Vibe)
// or
app.use(VibePlugin)
// or direct component usage
// <VibeLayout />`,
        language: 'ts',
      },
      {
        id: 'api-props',
        label: 'Props',
        title: 'Props',
        description: [
          'VibeLayout has one library-owned data model.',
          'Use resolve for live paging, and optionally initialState to hydrate a known snapshot before Vibe continues from there.',
        ],
        code: `type VibeProps = {
  resolve?: (params: VibeResolveParams) => Promise<VibeResolveResult>
  initialState?: VibeInitialState
  initialCursor?: string | null
  mode?: 'dynamic' | 'static'
  pageSize?: number
  fillDelayMs?: number
  fillDelayStepMs?: number
  paginationDetail?: string | null
  showEndBadge?: boolean
  showStatusBadges?: boolean
}`,
        language: 'ts',
      },
      {
        id: 'api-events',
        label: 'Events',
        title: 'Events',
        description: [
          'The public event surface stays intentionally small, but it now includes batched preload success and failure reporting.',
          'Use update:activeIndex to observe the visible item, asset-loads for grouped preload successes, and asset-errors for grouped preload failures.',
        ],
        code: `<script setup lang="ts">
import { ref } from 'vue'
import type { VibeAssetErrorEvent, VibeAssetLoadEvent } from '@wyxos/vibe'

const activeIndex = ref(0)

function onAssetLoads(loads: VibeAssetLoadEvent[]) {
  console.log(loads)
}

function onAssetErrors(errors: VibeAssetErrorEvent[]) {
  console.log(errors)
}
</script>

<template>
  <VibeLayout
    :resolve="resolve"
    @asset-loads="onAssetLoads"
    @asset-errors="onAssetErrors"
    @update:active-index="activeIndex = $event"
  />
</template>`,
        language: 'vue',
        notes: [
          'asset-loads emits an array payload, not a single success event.',
          'asset-errors emits an array payload, not a single error.',
          'Both batches are micro-buffered and deduped within the same short window.',
          'If the same item fails again later, it may emit again in a later batch.',
        ],
      },
      {
        id: 'api-asset-loads',
        label: 'Asset Loads',
        title: 'Asset Load Events',
        description: [
          'asset-loads is emitted as a batched array so consumer apps can react to successful asset readiness without one event per loaded preview or fullscreen asset.',
          'The payload includes the loaded item, the occurrence key, the asset URL, and the surface where it loaded.',
        ],
        code: `type VibeAssetLoadEvent = {
  item: VibeViewerItem
  occurrenceKey: string
  url: string
  surface: 'grid' | 'fullscreen'
}

function onAssetLoads(loads: VibeAssetLoadEvent[]) {
  console.log(loads)
}`,
        language: 'ts',
        notes: [
          'Grid load events usually report preview.url when a preview exists.',
          'Fullscreen load events report the original item.url.',
          'Identical successes are deduped inside the same batch window.',
        ],
      },
      {
        id: 'api-asset-errors',
        label: 'Asset Errors',
        title: 'Asset Error Events',
        description: [
          'asset-errors is emitted as a batched array so consumer apps can handle bursts of preload failures without getting one event per failed asset.',
          'The payload includes the failed item, the occurrence key, the asset URL, the resolved error kind, and the surface where it failed.',
        ],
        code: `type VibeAssetErrorEvent = {
  item: VibeViewerItem
  occurrenceKey: string
  url: string
  kind: 'generic' | 'not-found'
  surface: 'grid' | 'fullscreen'
}

function onAssetErrors(errors: VibeAssetErrorEvent[]) {
  console.log(errors)
}`,
        language: 'ts',
        notes: [
          'Multiple failures inside the same short window are emitted together.',
          'Identical failures are deduped inside the same batch.',
          'If the same item fails again later, it may emit again in a later batch.',
          'Built-in Vibe error surfaces allow retrying generic failures, but not not-found.',
        ],
      },
      {
        id: 'api-slots',
        label: 'Slots',
        title: 'Slots',
        description: [
          'The current customization surface is slot-based and intentionally focused on grid and icon composition.',
          'The slot names are item-icon, grid-item-overlay, and grid-footer.',
        ],
        code: `<VibeLayout :resolve="resolve">
  <template #item-icon="{ item, icon }">
    <component :is="icon" />
  </template>

  <template #grid-item-overlay="{ item, hovered }">
    <div v-if="hovered">{{ item.title }}</div>
  </template>

  <template #grid-footer>
    <div>Footer UI</div>
  </template>
</VibeLayout>`,
        language: 'vue',
      },
      {
        id: 'api-handle',
        label: 'Handle',
        title: 'Exposed Handle',
        description: [
          'VibeLayout exposes a handle for remove, restore, undo, and lightweight status inspection.',
          'Removal works by item id and preserves original order when items are restored.',
        ],
        code: `import { ref } from 'vue'
import type { VibeHandle } from '@wyxos/vibe'

const vibe = ref<VibeHandle | null>(null)

vibe.value?.remove(['item-2', 'item-5'])
vibe.value?.undo()
console.log(vibe.value?.status.nextCursor)
console.log(vibe.value?.status.fillDelayRemainingMs)`,
        language: 'ts',
        notes: [
          'Handle methods: remove, restore, undo, getRemovedIds, clearRemoved.',
          'Status exposes activeIndex, currentCursor, nextCursor, previousCursor, mode, phase, fill counts, loadState, itemCount, removedCount, and surfaceMode.',
          'Phase differentiates the first load from later requests and end-of-list refreshes.',
        ],
      },
      {
        id: 'api-types',
        label: 'Types',
        title: 'Types',
        description: [
          'The main public types are exported from the package entrypoint.',
          'Import only the pieces your app needs: item contract, resolve contract, props, or handle.',
        ],
        code: `import type {
  VibeAssetErrorEvent,
  VibeAssetErrorKind,
  VibeAssetErrorSurface,
  VibeAssetLoadEvent,
  VibeAssetLoadSurface,
  VibeViewerItem,
  VibeResolveParams,
  VibeResolveResult,
  VibeProps,
  VibeHandle,
} from '@wyxos/vibe'`,
        language: 'ts',
      },
    ],
  },
]
