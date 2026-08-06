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
} from '@/core/masonryViewportIndex'
import {
  createVibe,
  type VibeInstance,
  type VibeItem,
  type VibeState,
} from '@/index'

const props = defineProps<{ infiniteScroll: boolean }>()
const emit = defineEmits<{
  vibeInstanceChange: [instance: VibeInstance | null]
  vibeStateChange: [state: VibeState]
}>()

const SYNTHETIC_IMAGE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="100%" height="100%" fill="#172033"/><path d="M0 760L260 410l170 220 130-160 240 290v240H0z" fill="#365b7d"/><circle cx="620" cy="210" r="90" fill="#d9a441"/></svg>',
)
const target = shallowRef<HTMLElement | null>(null)
const itemCount = ref<80 | 8000>(80)
const metrics = reactive({
  inspected: 0,
  loaded: 0,
  mounted: 0,
  p95FrameMs: 0,
  visible: 0,
  worstFrameMs: 0,
})
let animationFrame: number | null = null
let lastFrameAt: number | null = null
let measureFrame: number | null = null
let samples: number[] = []
let vibe: VibeInstance | null = null

function syntheticItems(count: number): VibeItem[] {
  return Array.from({ length: count }, (_, index) => {
    const width = 800
    const height = 800 + ((index % 5) * 120)
    return {
      height,
      items: [],
      postId: index + 1,
      preview: { height, src: SYNTHETIC_IMAGE, width },
      src: SYNTHETIC_IMAGE,
      width,
    }
  })
}

function percentile(values: readonly number[], percentileValue: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.min(
    sorted.length - 1,
    Math.floor((sorted.length - 1) * percentileValue),
  )] ?? 0
}

function sampleFrames(timestamp: number): void {
  if (lastFrameAt !== null) {
    samples.push(timestamp - lastFrameAt)
    if (samples.length > 1_800) samples = samples.slice(-1_800)
    if (samples.length % 30 === 0) {
      metrics.p95FrameMs = percentile(samples, 0.95)
      metrics.worstFrameMs = Math.max(...samples)
    }
  }
  lastFrameAt = timestamp
  animationFrame = requestAnimationFrame(sampleFrames)
}

function inspectWindow(): void {
  measureFrame = null
  const host = target.value
  const gallery = host?.querySelector<HTMLElement>('.masonry-feed')
  const masonry = host?.querySelector<HTMLElement>('.masonry')
  if (!host || !gallery || !masonry) return

  const cards = [...host.querySelectorAll<HTMLElement>('.masonry-item')]
  const galleryRect = gallery.getBoundingClientRect()
  metrics.loaded = vibe?.getState().items.length ?? 0
  metrics.mounted = cards.length
  metrics.visible = cards.filter((card) => {
    const rect = card.getBoundingClientRect()
    return rect.bottom >= galleryRect.top && rect.top <= galleryRect.bottom
  }).length

  const items = vibe?.getState().items ?? []
  const media = items as readonly MasonryMediaDimensions[]
  const viewportWidth = document.documentElement.clientWidth
  const gap = Math.min(12, Math.max(6, viewportWidth * 0.0075))
  const layout = calculateMasonryLayout(media, masonry.clientWidth, {
    gap,
    minColumnWidth: 400,
  })
  metrics.inspected = queryMasonryViewportIndex(
    createMasonryViewportIndex(layout.items),
    {
      overscan: Math.min(1_000, Math.max(600, gallery.clientHeight * 0.5)),
      scrollTop: gallery.scrollTop,
      viewportHeight: gallery.clientHeight,
    },
  ).inspected
}

function scheduleInspection(): void {
  if (measureFrame !== null) return
  measureFrame = requestAnimationFrame(inspectWindow)
}

async function mountFixture(): Promise<void> {
  const host = target.value
  if (!host) return
  vibe?.destroy()
  emit('vibeInstanceChange', null)
  samples = []
  lastFrameAt = null
  Object.assign(metrics, {
    inspected: 0,
    loaded: 0,
    mounted: 0,
    p95FrameMs: 0,
    visible: 0,
    worstFrameMs: 0,
  })

  const items = syntheticItems(itemCount.value)
  vibe = createVibe({
    autoScroll: { maxSpeedPxPerSecond: 320 },
    infiniteScroll: props.infiniteScroll,
    initialPage: { items, next: null, total: items.length },
    layout: 'masonry',
    masonry: {
      minColumnWidth: 400,
      overscan: { maximumPx: 1_000, minimumPx: 600, viewportMultiplier: 0.5 },
    },
    onStateChange: (state) => emit('vibeStateChange', state),
    target: host,
  })
  emit('vibeInstanceChange', vibe)
  await vibe.mount()
  await nextTick()
  host.querySelector('.masonry-feed')?.addEventListener('scroll', scheduleInspection)
  scheduleInspection()
}

function useFixture(count: 80 | 8000): void {
  if (itemCount.value === count) return
  itemCount.value = count
  void mountFixture()
}

watch(() => props.infiniteScroll, (enabled) => vibe?.setInfiniteScroll(enabled))

onMounted(() => {
  void mountFixture()
  animationFrame = requestAnimationFrame(sampleFrames)
})

onBeforeUnmount(() => {
  if (animationFrame !== null) cancelAnimationFrame(animationFrame)
  if (measureFrame !== null) cancelAnimationFrame(measureFrame)
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
      <dl>
        <div><dt>Loaded</dt><dd data-test="performance-loaded">{{ metrics.loaded }}</dd></div>
        <div><dt>Mounted</dt><dd data-test="performance-mounted">{{ metrics.mounted }}</dd></div>
        <div><dt>Visible</dt><dd>{{ metrics.visible }}</dd></div>
        <div><dt>Indexed inspections</dt><dd data-test="performance-inspected">{{ metrics.inspected }}</dd></div>
        <div><dt>Frame p95</dt><dd>{{ metrics.p95FrameMs.toFixed(1) }}ms</dd></div>
        <div><dt>Worst frame</dt><dd>{{ metrics.worstFrameMs.toFixed(1) }}ms</dd></div>
      </dl>
      <p>Use the header controls to test 1× through 4× automatic scrolling.</p>
    </aside>
    <div ref="target" class="vibe-host masonry-performance-vibe" />
  </section>
</template>
