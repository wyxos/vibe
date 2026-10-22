import { flushPromises } from '@vue/test-utils'
import { effectScope, nextTick, ref, shallowRef } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { emitMediaPlaybackDiagnostic } from '@/components/mediaPlaybackDiagnostic'
import { useMediaLoading } from '@/components/useMediaLoading'
import { useReelTimedMediaActivity } from '@/components/useReelVideoActivity'
import { useTimedMediaCard } from '@/components/useTimedMediaCard'

const scopes: ReturnType<typeof effectScope>[] = []
function scoped<T>(run: () => T): T {
  const scope = effectScope()
  scopes.push(scope)
  return scope.run(run)!
}
function events(media: HTMLMediaElement) {
  const reports: unknown[] = []
  media.addEventListener('vibe:playback-diagnostic', event => reports.push((event as CustomEvent).detail))
  return reports
}
afterEach(() => {
  for (const scope of scopes.splice(0)) scope.stop()
  vi.restoreAllMocks(); vi.unstubAllEnvs()
})

describe('development media lifecycle diagnostics', () => {
  it('emits only fixed details that bubble to a containing feed without touching media state', () => {
    const media = document.createElement('video'), root = document.createElement('div')
    root.append(media)
    media.src = 'https://private.invalid/private.mp4'; media.id = 'private-id'
    Object.defineProperty(media, 'currentSrc', { get() { throw new Error('must not read source') } })
    const listener = vi.fn()
    root.addEventListener('vibe:playback-diagnostic', listener)
    const html = root.innerHTML
    emitMediaPlaybackDiagnostic(media, 'load-requested')
    expect(listener).toHaveBeenCalledOnce()
    expect(listener.mock.calls[0]![0].detail).toEqual({ action: 'load-requested', reason: 'none' })
    expect(root.innerHTML).toBe(html)
    expect(media.play).not.toHaveBeenCalled()
    expect(media.pause).not.toHaveBeenCalled()
  })

  it.each([
    [new DOMException('private message', 'AbortError'), 'aborted'],
    [new DOMException('private message', 'NotAllowedError'), 'not-allowed'],
    [new DOMException('private message', 'NotSupportedError'), 'unsupported'],
    [new Error('private message'), 'other'],
    ['private string', 'other'],
    [null, 'other'],
    [Object.defineProperty({}, 'name', { get() { throw new Error('private getter') } }), 'other'],
    [new Proxy({}, { has() { throw new Error('private proxy') } }), 'other'],
  ])('reduces rejection to safe category %#', (error, reason) => {
    const media = document.createElement('video'), reports = events(media)
    emitMediaPlaybackDiagnostic(media, 'play-rejected', error)
    expect(reports).toEqual([{ action: 'play-rejected', reason }])
    expect(JSON.stringify(reports)).not.toContain('private')
  })

  it('does no event dispatch or error inspection outside development', () => {
    vi.stubEnv('DEV', false)
    const media = document.createElement('video'), dispatch = vi.spyOn(media, 'dispatchEvent')
    const getter = vi.fn(() => 'NotAllowedError')
    emitMediaPlaybackDiagnostic(media, 'play-rejected', Object.defineProperty({}, 'name', { get: getter }))
    expect(dispatch).not.toHaveBeenCalled(); expect(getter).not.toHaveBeenCalled()
  })

  it('emits the preload handoff before the existing load call', async () => {
    const media = document.createElement('video'), reports = events(media)
    const priority = ref<'high' | 'low'>('low')
    const load = vi.spyOn(media, 'load').mockImplementation(() => {
      expect(reports).toEqual([{ action: 'load-requested', reason: 'none' }])
    })
    scoped(() => useMediaLoading({
      active: () => true, fetchPriority: () => priority.value, layout: () => 'masonry',
      mediaSource: () => 'fixture.mp4', mediaType: () => 'video', mediaElement: shallowRef(media),
    }))
    priority.value = 'high'
    await nextTick(); await nextTick()
    expect(load).toHaveBeenCalledOnce()
  })

  it('reports autoplay rejection on the captured media after the active element changes', async () => {
    const first = document.createElement('video'), second = document.createElement('video')
    const firstReports = events(first), secondReports = events(second)
    let rejectPlay!: (error: unknown) => void
    vi.spyOn(first, 'play').mockImplementation(() => new Promise((_resolve, reject) => { rejectPlay = reject }))
    const active = ref(false), mediaElement = shallowRef<HTMLMediaElement | null>(first), playing = ref(true)
    scoped(() => useReelTimedMediaActivity({
      active: () => active.value, inViewport: () => true, layout: () => 'reel',
      mediaElement, mediaIsMuted: ref(true), mediaIsPlaying: playing,
    }))
    active.value = true
    await nextTick(); await nextTick()
    expect(firstReports).toEqual([{ action: 'play-requested', reason: 'none' }])
    mediaElement.value = second
    rejectPlay(new DOMException('private', 'NotAllowedError'))
    await flushPromises()
    expect(firstReports).toEqual([
      { action: 'play-requested', reason: 'none' }, { action: 'play-rejected', reason: 'not-allowed' },
    ])
    expect(secondReports).toEqual([])
    expect(playing.value).toBe(false)
  })

  it('preserves manual playback completion and rejection handling', async () => {
    const media = document.createElement('video'), reports = events(media)
    const play = vi.spyOn(media, 'play').mockResolvedValue()
    const card = scoped(() => useTimedMediaCard({
      active: () => true, inViewport: () => true, layout: () => 'reel', mediaCard: () => undefined,
      mediaElement: shallowRef(media), onAudioChange: () => {}, onEnded: () => {}, onReady: () => {},
      reelAudioState: () => undefined,
    }))
    await card.togglePlayback()
    expect(reports).toEqual([
      { action: 'play-requested', reason: 'none' }, { action: 'play-resolved', reason: 'none' },
    ])
    play.mockRejectedValueOnce(new DOMException('private', 'AbortError'))
    await expect(card.togglePlayback()).resolves.toBeUndefined()
    expect(reports.slice(-2)).toEqual([
      { action: 'play-requested', reason: 'none' }, { action: 'play-rejected', reason: 'aborted' },
    ])
    expect(card.isPlaying.value).toBe(false)
  })
})
