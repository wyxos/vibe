import { createVibe } from '@vibe-under-test'
import { ref } from 'vue'
import '@vibe-style'
import type { VibeInstance, VibeState } from '../../src/index'
import './harness.css'
import { Header, Footer, InfoSheet, TrackDrawer } from './chrome'
import { audio, image, items, video } from './media'
import { selectionHarness } from './selectionHarness'

declare global {
  interface Window {
    __vibe: VibeInstance
    __state: VibeState
    __requests: number
    __resolvePage?: () => void
    __masonryObservations: {
      changes: boolean[]
      fullyVisible: Array<{ postId: string | number, scrolling: boolean }>
      pages: boolean[]
    }
  }
}

const params = new URLSearchParams(location.search)
const scenario = params.get('scenario')
const subtitles = ref(false)
const initial = scenario === 'audio' ? audio()
  : scenario === 'grouped-controls' ? [{ ...image(1), postId: 1, items: [audio()[0]!, video(2)] }]
  : scenario === 'controls' ? [video(1), { ...items(2, 1)[0]!, items: [] }, audio()[0]!]
  : scenario === 'video' ? [video(1), video(2), video(3)]
    : scenario === 'mixed' ? [items(1, 1)[0]!, video(2), ...items(3, 8)]
      : items()
if (scenario === 'error') {
  initial.splice(0, initial.length, {
    postId: 1, src: '/broken.jpg', preview: { src: '/broken.jpg', width: 400, height: 600 },
    width: 400, height: 600, items: [],
  })
}
window.__requests = 0
window.__masonryObservations = { changes: [], fullyVisible: [], pages: [] }
let scrolling = false
window.__vibe = createVibe({
  target: '#target',
  layout: params.get('layout') === 'reel' ? 'reel'
    : params.get('layout') === 'masonry' ? 'masonry' : 'responsive',
  infiniteScroll: params.has('infinite'),
  reelPreviewPlacement: params.get('previewPlacement') === 'bottom' ? 'bottom' : 'right',
  initialPage: { items: initial, next: 'next', total: initial.length + 10 },
  cardHeader: params.has('chrome') ? { component: Header, height: 48, background: 'transparent' } : undefined,
  cardFooter: params.has('chrome') ? { component: Footer, height: 48, background: 'transparent' } : undefined,
  reelInfoSheet: { component: InfoSheet },
  reelAutoAdvance: { intervalMs: 3000 },
  mediaCard: {
    feedPreload: 'visible-post',
    controls: params.has('controlActions') ? {
      drawer: params.has('customDrawer') ? { component: TrackDrawer, class: 'test-track-drawer' } : undefined,
      showMute: false,
      playbackRates: [1, 2],
      actions: ({ item, mediaIndex }) => [
        {
          id: 'subtitles', label: 'English subtitles', selected: subtitles.value, keepOpen: true,
          onSelect: () => { subtitles.value = !subtitles.value },
        },
        {
          id: 'audio', label: 'Choose audio track',
          onSelect: () => { document.body.dataset.trackTarget = `${item.postId}:${mediaIndex}` },
        },
      ],
    } : undefined,
  },
  masonry: {
    bottomSpacePx: Number(params.get('bottomSpace') ?? 0),
    loadMoreThresholdPx: Number(params.get('threshold') ?? 240),
    minColumnWidth: 240,
  },
  onStateChange: (state: VibeState) => { window.__state = state },
  onMasonryScrollChange: (active) => {
    scrolling = active
    window.__masonryObservations.changes.push(active)
  },
  onMediaFullyVisible: ({ postId }) => {
    window.__masonryObservations.fullyVisible.push({ postId, scrolling })
  },
  loadPage: async () => {
    window.__requests++
    window.__masonryObservations.pages.push(scrolling)
    if (params.has('defer')) await new Promise<void>((resolve) => { window.__resolvePage = resolve })
    return { items: items(100, 10), next: null, total: initial.length + 10 }
  },
  ...(scenario === 'selection' ? selectionHarness(params) : {}),
})
await window.__vibe.mount()
document.body.dataset.ready = 'true'
