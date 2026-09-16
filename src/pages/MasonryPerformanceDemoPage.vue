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
  type VibeItemId,
  type VibeState,
} from '@/index'
import { MasonryCadenceTracker } from './masonryPerformanceMetrics'
import {
  createSyntheticMasonryItems,
  releaseSyntheticMasonryMedia,
} from './syntheticMasonryMedia'

const props = defineProps<{ infiniteScroll: boolean }>()
const emit = defineEmits<{
  vibeInstanceChange: [instance: VibeInstance | null]
  vibeStateChange: [state: VibeState]
}>()

const target = shallowRef<HTMLElement | null>(null)
const itemCount = ref<100 | 9000>(100)
const mediaMode = ref<'shared' | 'unique'>('unique')
const removing = ref(false)
const metrics = reactive({
  inspected: 0,
  loaded: 0,
  longTaskCount: 0,
  longTaskDurationMs: 0,
  longestPlateauMs: 0,
  mediaReadyCount: 0,
  mediaVisibleCount: 0,
  mountMs: 0,
  mounted: 0,
  mountedWindowChanges: 0,
  p95FrameMs: 0,
  removalLongTasks: '0 / 0.0ms',
  removalMs: 0,
  removalP95FrameMs: 0,
  removalPlateauMs: 0,
  removalWorstFrameMs: 0,
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
let mountGeneration = 0
let vibe: VibeInstance | null = null

function emptyMetrics(): void {
  Object.assign(metrics, {
    inspected: 0,
    loaded: 0,
    longTaskCount: 0,
    longTaskDurationMs: 0,
    longestPlateauMs: 0,
    mediaReadyCount: 0,
    mediaVisibleCount: 0,
    mountMs: 0,
    mounted: 0,
    mountedWindowChanges: 0,
    p95FrameMs: 0,
    removalLongTasks: '0 / 0.0ms',
    removalMs: 0,
    removalP95FrameMs: 0,
    removalPlateauMs: 0,
    removalWorstFrameMs: 0,
    requestedDistancePx: 0,
    travelledDistancePx: 0,
    visible: 0,
    worstFrameMs: 0,
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

function visiblePostId(): VibeItemId | null {
  const host = target.value
  const gallery = fixtureGallery
  if (!host || !gallery) return null
  const galleryRect = gallery.getBoundingClientRect()
  const card = [...host.querySelectorAll<HTMLElement>('.masonry-item')].find((element) => {
    const rect = element.getBoundingClientRect()
    return rect.bottom >= galleryRect.top && rect.top <= galleryRect.bottom
  })
  const value = card?.dataset.postId
  if (!value) return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : value
}

async function mountFixture(): Promise<void> {
  const host = target.value
  if (!host) return
  const generation = ++mountGeneration
  detachFixture()
  vibe?.destroy()
  emit('vibeInstanceChange', null)
  cadence = new MasonryCadenceTracker()
  autoScrollState = null
  lastMetricsPublishedAt = 0
  emptyMetrics()

  const items = await createSyntheticMasonryItems(itemCount.value, mediaMode.value)
  if (generation !== mountGeneration) {
    releaseSyntheticMasonryMedia()
    return
  }
  fixtureItems = items
  const mountedAt = performance.now()
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
      if (state.autoScroll.enabled && !autoScrollState?.enabled) cadence.reset()
      autoScrollState = state.autoScroll
      emit('vibeStateChange', state)
    },
    target: host,
  })
  emit('vibeInstanceChange', vibe)
  await vibe.mount()
  if (generation !== mountGeneration) return
  await nextTick()
  metrics.mountMs = performance.now() - mountedAt
  cadence.reset()
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

function useFixture(count: 100 | 9000): void {
  if (itemCount.value === count) return
  itemCount.value = count
  void mountFixture()
}

function useMediaMode(mode: 'shared' | 'unique'): void {
  if (mediaMode.value === mode) return
  mediaMode.value = mode
  void mountFixture()
}

async function removeVisibleItem(): Promise<void> {
  const instance = vibe
  const postId = visiblePostId()
  if (!instance || postId == null || removing.value) return
  removing.value = true
  const scrollCadence = cadence
  cadence = new MasonryCadenceTracker()
  const started = performance.now()
  try {
    await instance.removeItems([postId])
    await new Promise((resolve) => {
      window.setTimeout(resolve, 500)
    })
    const snapshot = cadence.snapshot()
    metrics.removalMs = performance.now() - started
    metrics.removalLongTasks = `${snapshot.longTaskCount} / ${snapshot.longTaskDurationMs.toFixed(1)}ms`
    metrics.removalP95FrameMs = snapshot.p95FrameMs
    metrics.removalPlateauMs = snapshot.longestPlateauMs
    metrics.removalWorstFrameMs = snapshot.worstFrameMs
    fixtureItems = [...instance.getState().items]
    rebuildInspectionIndex()
    scheduleInspection()
  }
  finally {
    cadence = scrollCadence
    removing.value = false
  }
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
      if (!fixtureGallery) return
      entries.getEntries().forEach((entry) => cadence.recordLongTask(entry.duration))
    })
    longTaskObserver.observe({ entryTypes: ['longtask'] })
  }
})

onBeforeUnmount(() => {
  mountGeneration += 1
  if (animationFrame !== null) cancelAnimationFrame(animationFrame)
  if (measureFrame !== null) cancelAnimationFrame(measureFrame)
  longTaskObserver?.disconnect()
  detachFixture()
  releaseSyntheticMasonryMedia()
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
        <button type="button" :aria-pressed="itemCount === 100" @click="useFixture(100)">100</button>
        <button type="button" :aria-pressed="itemCount === 9000" @click="useFixture(9000)">9,000</button>
      </div>
      <div class="masonry-performance-actions">
        <button type="button" :aria-pressed="mediaMode === 'shared'" @click="useMediaMode('shared')">Shared JPEG</button>
        <button type="button" :aria-pressed="mediaMode === 'unique'" @click="useMediaMode('unique')">Unique JPEG</button>
      </div>
      <div class="masonry-performance-actions">
        <button
          type="button"
          data-test="performance-remove-visible"
          :disabled="removing || metrics.visible === 0"
          @click="removeVisibleItem"
        >
          Remove visible
        </button>
      </div>
      <dl>
        <div><dt>Loaded</dt><dd data-test="performance-loaded">{{ metrics.loaded }}</dd></div>
        <div><dt>Mounted</dt><dd data-test="performance-mounted">{{ metrics.mounted }}</dd></div>
        <div><dt>Visible</dt><dd data-test="performance-visible">{{ metrics.visible }}</dd></div>
        <div><dt>Mount</dt><dd data-test="performance-mount">{{ metrics.mountMs.toFixed(0) }}ms</dd></div>
        <div><dt>Indexed inspections</dt><dd data-test="performance-inspected">{{ metrics.inspected }}</dd></div>
        <div><dt>Requested distance</dt><dd data-test="performance-requested">{{ metrics.requestedDistancePx.toFixed(1) }}px</dd></div>
        <div><dt>Travelled distance</dt><dd data-test="performance-travelled">{{ metrics.travelledDistancePx.toFixed(1) }}px</dd></div>
        <div><dt>Longest plateau</dt><dd data-test="performance-plateau">{{ metrics.longestPlateauMs.toFixed(1) }}ms</dd></div>
        <div><dt>Frame p95</dt><dd data-test="performance-p95">{{ metrics.p95FrameMs.toFixed(1) }}ms</dd></div>
        <div><dt>Worst frame</dt><dd data-test="performance-worst">{{ metrics.worstFrameMs.toFixed(1) }}ms</dd></div>
        <div><dt>Long tasks</dt><dd data-test="performance-long-tasks">{{ metrics.longTaskCount }} / {{ metrics.longTaskDurationMs.toFixed(1) }}ms</dd></div>
        <div><dt>Mount window changes</dt><dd data-test="performance-window-changes">{{ metrics.mountedWindowChanges }}</dd></div>
        <div><dt>Media ready</dt><dd data-test="performance-media-ready">{{ metrics.mediaReadyCount }}</dd></div>
        <div><dt>Media visible</dt><dd data-test="performance-media-visible">{{ metrics.mediaVisibleCount }}</dd></div>
        <div><dt>Removal</dt><dd data-test="performance-removal">{{ metrics.removalMs.toFixed(0) }}ms</dd></div>
        <div><dt>Removal p95</dt><dd data-test="performance-removal-p95">{{ metrics.removalP95FrameMs.toFixed(1) }}ms</dd></div>
        <div><dt>Removal worst</dt><dd data-test="performance-removal-worst">{{ metrics.removalWorstFrameMs.toFixed(1) }}ms</dd></div>
        <div><dt>Removal plateau</dt><dd data-test="performance-removal-plateau">{{ metrics.removalPlateauMs.toFixed(1) }}ms</dd></div>
        <div><dt>Removal long tasks</dt><dd data-test="performance-removal-long-tasks">{{ metrics.removalLongTasks }}</dd></div>
      </dl>
      <p>Unique JPEGs are 450px Atlas-sized rasters. Remove a visible card after scrolling to measure reflow.</p>
    </aside>
    <div ref="target" class="vibe-host masonry-performance-vibe" />
  </section>
</template>
