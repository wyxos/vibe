import { createVibe } from '@vibe-under-test'
import '@vibe-style'
import type { VibeInstance, VibeState } from '../../src/index'
import './harness.css'
import { Header, Footer, InfoSheet } from './chrome'
import { audio, items, video } from './media'

declare global {
  interface Window {
    __vibe: VibeInstance
    __state: VibeState
    __requests: number
    __resolvePage?: () => void
  }
}

const params = new URLSearchParams(location.search)
const scenario = params.get('scenario')
const initial = scenario === 'audio' ? audio()
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
window.__vibe = createVibe({
  target: '#target',
  layout: params.get('layout') === 'reel' ? 'reel'
    : params.get('layout') === 'masonry' ? 'masonry' : 'responsive',
  infiniteScroll: false,
  initialPage: { items: initial, next: 'next', total: initial.length + 10 },
  cardHeader: params.has('chrome') ? { component: Header, height: 48, background: 'transparent' } : undefined,
  cardFooter: params.has('chrome') ? { component: Footer, height: 48, background: 'transparent' } : undefined,
  reelInfoSheet: { component: InfoSheet },
  reelAutoAdvance: { intervalMs: 3000 },
  mediaCard: { feedPreload: 'visible-post' },
  masonry: {
    bottomSpacePx: Number(params.get('bottomSpace') ?? 0),
    loadMoreThresholdPx: Number(params.get('threshold') ?? 240),
    minColumnWidth: 240,
  },
  onStateChange: (state: VibeState) => { window.__state = state },
  loadPage: async () => {
    window.__requests++
    if (params.has('defer')) await new Promise<void>((resolve) => { window.__resolvePage = resolve })
    return { items: items(100, 10), next: null, total: initial.length + 10 }
  },
})
await window.__vibe.mount()
document.body.dataset.ready = 'true'
