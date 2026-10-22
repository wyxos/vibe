import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, shallowRef, watch } from 'vue'

import MediaCard from '@/components/MediaCard.vue'
import { useMediaLoading } from '@/components/useMediaLoading'
import type { VibeLayout } from '@/types'

/** Model a slow start: load() cancels an unresolved native play() request. */
function deferredPlayback() {
  const calls: string[] = []
  let pending: { resolve: () => void; reject: (error: DOMException) => void } | null = null
  let aborts = 0
  let playing = false
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => {
    calls.push('play')
    return new Promise<void>((resolve, reject) => { pending = { resolve, reject } })
  })
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {
    calls.push('load')
    playing = false
    if (!pending) return
    aborts += 1
    pending.reject(new DOMException('Playback interrupted by load', 'AbortError'))
    pending = null
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {
    calls.push('pause')
    playing = false
  })
  return {
    calls,
    get aborts() { return aborts },
    get playing() { return playing },
    finishStarting() {
      if (!pending) return
      playing = true
      pending.resolve()
      pending = null
    },
  }
}

function card(layout: VibeLayout) {
  // Mount the real component so activity and loading watchers are registered
  // in the same order and share the same media ref as production playback.
  return mount(MediaCard, {
    props: {
      active: false,
      entering: false,
      fetchPriority: 'low',
      inViewport: false,
      index: 0,
      item: { postId: 1, src: '/synthetic.mp4', width: 320, height: 180, items: [] },
      layout,
      loadedCount: 1,
      mediaIndex: 0,
      previewState: 'ready',
      total: null,
    },
  })
}

afterEach(() => vi.restoreAllMocks())

describe.each(['masonry', 'reel'] as const)('%s media activation ordering', layout => {
  it('starts playback without a competing preload load aborting play', async () => {
    const playback = deferredPlayback()
    const wrapper = card(layout)
    try {
      expect(wrapper.get('video').attributes('preload')).toBe('none')
      await wrapper.setProps({ active: true, inViewport: true, fetchPriority: 'high' })
      await flushPromises()
      playback.finishStarting()
      await flushPromises()

      expect(playback.calls).toContain('play')
      expect(playback.aborts, `Native call order: ${playback.calls.join(' → ')}`).toBe(0)
      expect(playback.playing).toBe(true)
    } finally { wrapper.unmount() }
  })

  it('resumes on viewport or active-card reentry after returning to preload none', async () => {
    const playback = deferredPlayback()
    const wrapper = card(layout)
    try {
      // Warm the source before activation so the first start is uncontentious.
      if (layout === 'masonry') {
        await wrapper.setProps({ fetchPriority: 'high' })
        await flushPromises()
      }
      await wrapper.setProps({ active: true, inViewport: true, fetchPriority: 'high' })
      await flushPromises()
      playback.finishStarting()
      await flushPromises()

      await wrapper.setProps({ active: false, inViewport: false, fetchPriority: 'low' })
      await flushPromises()
      const previousAborts = playback.aborts
      playback.calls.length = 0
      await wrapper.setProps({ active: true, inViewport: true, fetchPriority: 'high' })
      await flushPromises()
      playback.finishStarting()
      await flushPromises()

      expect(playback.calls).toContain('play')
      expect(playback.aborts - previousAborts, `Reentry call order: ${playback.calls.join(' → ')}`).toBe(0)
      expect(playback.playing).toBe(true)
    } finally { wrapper.unmount() }
  })
})

it('keeps a pending feed start when preload priority follows viewport entry', async () => {
  const playback = deferredPlayback()
  const wrapper = card('masonry')
  try {
    // Viewport and preload regions are separate inputs. Let the real activity
    // watcher start first, then update priority while native play is pending.
    await wrapper.setProps({ inViewport: true })
    await flushPromises()
    expect(playback.calls).toEqual(['play'])
    await wrapper.setProps({ fetchPriority: 'high' })
    await flushPromises()
    playback.finishStarting()
    await flushPromises()

    expect(playback.aborts, `Native call order: ${playback.calls.join(' → ')}`).toBe(0)
    expect(playback.playing).toBe(true)
  } finally { wrapper.unmount() }
})

describe('background preload handoff', () => {
  function backgroundPreload() {
    const scope = effectScope()
    const media = document.createElement('video')
    const priority = ref<'high' | 'low'>('low')
    const playbackAllowed = ref(false)
    scope.run(() => useMediaLoading({
      active: () => false,
      fetchPriority: () => priority.value,
      layout: () => 'masonry',
      mediaSource: () => '/synthetic.mp4',
      mediaType: () => 'video',
      mediaElement: shallowRef(media),
      playbackAllowed: () => playbackAllowed.value,
    }))
    return { scope, priority, playbackAllowed }
  }

  it('still explicitly loads an inactive source when preload changes from none to auto', async () => {
    const playback = deferredPlayback()
    const background = backgroundPreload()
    try {
      background.priority.value = 'high'
      await nextTick()
      await flushPromises()

      expect(playback.calls).toEqual(['load'])
      expect(playback.aborts).toBe(0)
    } finally { background.scope.stop() }
  })

  it('does not execute a queued background load after preload returns to none', async () => {
    const playback = deferredPlayback()
    const background = backgroundPreload()
    try {
      // A post-flush change occurs after the preload watcher requests its
      // nextTick handoff but before that deferred callback is allowed to run.
      background.scope.run(() => watch(background.priority, priority => {
        if (priority === 'high') background.priority.value = 'low'
      }, { flush: 'post' }))
      background.priority.value = 'high'
      await nextTick()
      await flushPromises()

      expect(background.priority.value).toBe('low')
      expect(playback.calls).toEqual([])
    } finally { background.scope.stop() }
  })

  it('does not execute a queued background load after playback becomes allowed', async () => {
    const playback = deferredPlayback()
    const background = backgroundPreload()
    try {
      background.scope.run(() => watch(background.priority, () => {
        background.playbackAllowed.value = true
      }, { flush: 'post' }))
      background.priority.value = 'high'
      await nextTick()
      await flushPromises()

      expect(background.playbackAllowed.value).toBe(true)
      expect(playback.calls).toEqual([])
    } finally { background.scope.stop() }
  })
})
