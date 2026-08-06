<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from 'vue'

import {
  calculateMasonryLayout,
  type MasonryMediaDimensions,
} from '@/core/masonry'
import {
  createMasonryViewportIndex,
  queryMasonryViewportIndex,
  type MasonryViewportIndex,
} from '@/core/masonryViewportIndex'
import {
  createVibe,
  type VibeInstance,
  type VibeItem,
  type VibeState,
} from '@/index'
import { MasonryCadenceTracker } from './masonryPerformanceMetrics'

const props = defineProps<{ infiniteScroll: boolean }>()
const emit = defineEmits<{
  vibeInstanceChange: [instance: VibeInstance | null]
  vibeStateChange: [state: VibeState]
}>()

function syntheticImage(index?: number): string {
  const accent = index === undefined ? '#d9a441' : `hsl(${index % 360} 55% 55%)`
  const marker = index === undefined ? 'shared' : `unique-${index}`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><metadata>${marker}</metadata><rect width="100%" height="100%" fill="#172033"/><path d="M0 760L260 410l170 220 130-160 240 290v240H0z" fill="#365b7d"/><circle cx="620" cy="210" r="90" fill="${accent}"/></svg>`,
  )
}

const SYNTHETIC_IMAGE = syntheticImage()
const target = shallowRef<HTMLElement | null>(null)
const itemCount = ref<80 | 8000>(80)
const mediaMode = ref<'shared' | 'unique'>('shared')
const metrics = reactive({
  inspected: 0,
  loaded: 0,
  longTaskCount: 0,
  longTaskDurationMs: 0,
  longestPlateauMs: 0,
  mediaReadyCount: 0,
  mediaVisibleCount: 0,
  mounted: 0,
  mountedWindowChanges: 0,
  p95FrameMs: 0,
  requestedDistancePx: 0,
  travelledDistancePx: 0,
  visible: 0,
  worstFrameMs: 0,
})
let animationFrame: number | null = null
let autoScrollState: VibeState['autoScroll'] | null = null
let cadence = new MasonryCadenceTracker()
let fixtureGallery: HTMLElement | null = null
let fixtureIndex: MasonryViewportIndex | null = null
let fixtureItems: VibeItem[] = []
let fixtureMasonry: HTMLElement | null = null
let fixtureResizeObserver: ResizeObserver | null = null
let lastMetricsPublishedAt = 0
let longTaskObserver: PerformanceObserver | null = null
let measureFrame: number | null = null
let vibe: VibeInstance | null = null

function syntheticItems(count: number, mode: 'shared' | 'unique'): VibeItem[] {
  return Array.from({ length: count }, (_, index) => {
    const width = 800
    const height = 800 + ((index % 5) * 120)
    const source = mode === 'shared' ? SYNTHETIC_IMAGE : syntheticImage(index)
    return {
      height,
      items: [],
      postId: index + 1,
      preview: { height, src: source, width },
      src: source,
      width,
    }
  })
}

function publishMetrics(): void {
  Object.assign(metrics, cadence.snapshot())
}

function sampleFrames(timestamp: number): void {
  const gallery = fixtureGallery
  if (autoScrollState && gallery) {
    cadence.recordFrame({
      maxScrollTop: Math.max(0, gallery.scrollHeight - gallery.clientHeight),
      running: autoScrollState.enabled && !autoScrollState.paused,
      scrollTop: gallery.scrollTop,
      speedPxPerSecond: autoScrollState.speedPxPerSecond,
      timestamp,
    })
  }
  if (timestamp - lastMetricsPublishedAt >= 500) {
    lastMetricsPublishedAt = timestamp
    publishMetrics()
  }
  animationFrame = requestAnimationFrame(sampleFrames)
}

function rebuildInspectionIndex(): void {
  const masonry = fixtureMasonry
  if (!masonry) return
  const viewportWidth = document.documentElement.clientWidth
  const gap = Math.min(12, Math.max(6, viewportWidth * 0.0075))
  const layout = calculateMasonryLayout(
    fixtureItems as readonly MasonryMediaDimensions[],
    masonry.clientWidth,
    { gap, minColumnWidth: 320 },
  )
  fixtureIndex = createMasonryViewportIndex(layout.items)
}

function inspectWindow(): void {
  measureFrame = null
  const host = target.value
  const gallery = fixtureGallery
  const index = fixtureIndex
  if (!host || !gallery || !index) return

  const cards = [...host.querySelectorAll<HTMLElement>('.masonry-item')]
  const galleryRect = gallery.getBoundingClientRect()
  metrics.loaded = fixtureItems.length
  metrics.mounted = cards.length
  cadence.recordMountedWindow(cards.map((card) => card.dataset.postId ?? '').join('|'))
  metrics.visible = cards.filter((card) => {
    const rect = card.getBoundingClientRect()
    return rect.bottom >= galleryRect.top && rect.top <= galleryRect.bottom
  }).length

  metrics.inspected = queryMasonryViewportIndex(
    index,
    {
      overscan: Math.min(1_000, Math.max(600, gallery.clientHeight * 0.5)),
      scrollTop: gallery.scrollTop,
      viewportHeight: gallery.clientHeight,
    },
  ).inspected
  publishMetrics()
}

function scheduleInspection(): void {
  if (measureFrame !== null) return
  measureFrame = requestAnimationFrame(inspectWindow)
}

async function mountFixture(): Promise<void> {
  const host = target.value
  if (!host) return
  detachFixture()
  vibe?.destroy()
  emit('vibeInstanceChange', null)
  cadence = new MasonryCadenceTracker()
  autoScrollState = null
  lastMetricsPublishedAt = 0
  Object.assign(metrics, {
    inspected: 0,
    loaded: 0,
    longTaskCount: 0,
    longTaskDurationMs: 0,
    longestPlateauMs: 0,
    mediaReadyCount: 0,
    mediaVisibleCount: 0,
    mounted: 0,
    mountedWindowChanges: 0,
    p95FrameMs: 0,
    requestedDistancePx: 0,
    travelledDistancePx: 0,
    visible: 0,
    worstFrameMs: 0,
  })

  const items = syntheticItems(itemCount.value, mediaMode.value)
  fixtureItems = items
  vibe = createVibe({
    autoScroll: { maxSpeedPxPerSecond: 320 },
    infiniteScroll: props.infiniteScroll,
    initialPage: { items, next: null, total: items.length },
    layout: 'masonry',
    masonry: {
      minColumnWidth: 320,
      overscan: { maximumPx: 1_000, minimumPx: 600, viewportMultiplier: 0.5 },
    },
    onMediaReady: () => cadence.recordMediaReady(),
    onMediaVisible: () => cadence.recordMediaVisible(),
    onStateChange: (state) => {
      autoScrollState = state.autoScroll
      emit('vibeStateChange', state)
    },
    target: host,
  })
  emit('vibeInstanceChange', vibe)
  await vibe.mount()
  await nextTick()
  autoScrollState = vibe.getState().autoScroll
  fixtureGallery = host.querySelector<HTMLElement>('.masonry-feed')
  fixtureMasonry = host.querySelector<HTMLElement>('.masonry')
  rebuildInspectionIndex()
  fixtureGallery?.addEventListener('scroll', scheduleInspection)
  if (fixtureMasonry && typeof ResizeObserver !== 'undefined') {
    fixtureResizeObserver = new ResizeObserver(() => {
      rebuildInspectionIndex()
      scheduleInspection()
    })
    fixtureResizeObserver.observe(fixtureMasonry)
  }
  scheduleInspection()
}

function detachFixture(): void {
  fixtureGallery?.removeEventListener('scroll', scheduleInspection)
  fixtureResizeObserver?.disconnect()
  fixtureGallery = null
  fixtureIndex = null
  fixtureItems = []
  fixtureMasonry = null
  fixtureResizeObserver = null
  autoScrollState = null
}

function useFixture(count: 80 | 8000): void {
  if (itemCount.value === count) return
  itemCount.value = count
  void mountFixture()
}

function useMediaMode(mode: 'shared' | 'unique'): void {
  if (mediaMode.value === mode) return
  mediaMode.value = mode
  void mountFixture()
}

watch(() => props.infiniteScroll, (enabled) => vibe?.setInfiniteScroll(enabled))

onMounted(() => {
  void mountFixture()
  animationFrame = requestAnimationFrame(sampleFrames)
  if (
    typeof PerformanceObserver !== 'undefined'
    && PerformanceObserver.supportedEntryTypes?.includes('longtask')
  ) {
    longTaskObserver = new PerformanceObserver((entries) => {
      entries.getEntries().forEach((entry) => cadence.recordLongTask(entry.duration))
    })
    longTaskObserver.observe({ entryTypes: ['longtask'] })
  }
})

onBeforeUnmount(() => {
  if (animationFrame !== null) cancelAnimationFrame(animationFrame)
  if (measureFrame !== null) cancelAnimationFrame(measureFrame)
  longTaskObserver?.disconnect()
  detachFixture()
  emit('vibeInstanceChange', null)
  vibe?.destroy()
  vibe = null
})
</script>

<template>
  <section class="masonry-performance-stage">
    <aside class="masonry-performance-diagnostics" aria-label="Masonry performance diagnostics">
      <strong>Synthetic feed</strong>
      <div class="masonry-performance-actions">
        <button type="button" :aria-pressed="itemCount === 80" @click="useFixture(80)">80</button>
        <button type="button" :aria-pressed="itemCount === 8000" @click="useFixture(8000)">8,000</button>
      </div>
      <div class="masonry-performance-actions">
        <button type="button" :aria-pressed="mediaMode === 'shared'" @click="useMediaMode('shared')">Shared media</button>
        <button type="button" :aria-pressed="mediaMode === 'unique'" @click="useMediaMode('unique')">Unique media</button>
      </div>
      <dl>
        <div><dt>Loaded</dt><dd data-test="performance-loaded">{{ metrics.loaded }}</dd></div>
        <div><dt>Mounted</dt><dd data-test="performance-mounted">{{ metrics.mounted }}</dd></div>
        <div><dt>Visible</dt><dd>{{ metrics.visible }}</dd></div>
        <div><dt>Indexed inspections</dt><dd data-test="performance-inspected">{{ metrics.inspected }}</dd></div>
        <div><dt>Requested distance</dt><dd data-test="performance-requested">{{ metrics.requestedDistancePx.toFixed(1) }}px</dd></div>
        <div><dt>Travelled distance</dt><dd data-test="performance-travelled">{{ metrics.travelledDistancePx.toFixed(1) }}px</dd></div>
        <div><dt>Longest plateau</dt><dd data-test="performance-plateau">{{ metrics.longestPlateauMs.toFixed(1) }}ms</dd></div>
        <div><dt>Frame p95</dt><dd>{{ metrics.p95FrameMs.toFixed(1) }}ms</dd></div>
        <div><dt>Worst frame</dt><dd>{{ metrics.worstFrameMs.toFixed(1) }}ms</dd></div>
        <div><dt>Long tasks</dt><dd>{{ metrics.longTaskCount }} / {{ metrics.longTaskDurationMs.toFixed(1) }}ms</dd></div>
        <div><dt>Mount window changes</dt><dd>{{ metrics.mountedWindowChanges }}</dd></div>
        <div><dt>Media ready</dt><dd>{{ metrics.mediaReadyCount }}</dd></div>
        <div><dt>Media visible</dt><dd>{{ metrics.mediaVisibleCount }}</dd></div>
      </dl>
      <p>Use the header controls to test 1× through 4× automatic scrolling.</p>
    </aside>
    <div ref="target" class="vibe-host masonry-performance-vibe" />
  </section>
</template>
