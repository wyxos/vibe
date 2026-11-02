import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MediaCard from '@/components/MediaCard.vue'

describe('opt-in card video motion playback', () => {
  let wrapper: VueWrapper | undefined
  afterEach(() => { wrapper?.unmount(); vi.restoreAllMocks() })

  async function setup(enabled = true, entering = true) {
    wrapper = mount(MediaCard, { props: {
      entering, inViewport: true, fetchPriority: 'high', index: 0, layout: 'masonry',
      loadedCount: 1, mediaIndex: 0, previewState: 'ready', total: null,
      mediaCard: { pauseVideoDuringTransitions: enabled },
      item: { postId: 1, src: 'https://example.test/video.mp4', type: 'video', width: 640, height: 480, items: [] },
    } })
    await flushPromises()
    const media = wrapper.get('video').element
    const play = vi.spyOn(media, 'play').mockResolvedValue(undefined)
    const pause = vi.spyOn(media, 'pause').mockImplementation(() => undefined)
    return { media, play, pause, card: wrapper.element as HTMLElement }
  }

  function animation(target: Element, property = 'transform') {
    let finish!: () => void
    let cancel!: (reason?: unknown) => void
    const finished = new Promise<void>((resolve, reject) => { finish = resolve; cancel = reject })
    void finished.catch(() => {})
    return { transitionProperty: property, effect: { target }, finished, finish, cancel }
  }

  it('keeps entry paused until its native root transform actually finishes', async () => {
    const { media, play, card } = await setup()
    expect(media.autoplay).toBe(false)
    const motion = animation(card)
    Object.defineProperty(card, 'getAnimations', { value: () => [motion] })
    await wrapper!.setProps({ entering: false })
    await flushPromises()
    expect(media.autoplay).toBe(false)
    expect(play).not.toHaveBeenCalled()
    motion.finish()
    await flushPromises()
    expect(media.autoplay).toBe(true)
    expect(play).toHaveBeenCalledOnce()
  })

  it('ignores descendant and non-transform motion when the card has no transition', async () => {
    const { media, play, card } = await setup()
    Object.defineProperty(card, 'getAnimations', { value: () => [
      animation(media), animation(card, 'opacity'),
    ] })
    await wrapper!.setProps({ entering: false })
    await flushPromises()
    expect(media.autoplay).toBe(true)
    expect(play).toHaveBeenCalledOnce()
  })

  it('releases a canceled transition but follows a replacement transform first', async () => {
    const { play, card } = await setup()
    const first = animation(card)
    const replacement = animation(card)
    let animations = [first]
    Object.defineProperty(card, 'getAnimations', { value: () => animations })
    await wrapper!.setProps({ entering: false })
    await flushPromises()
    animations = [replacement]
    first.cancel()
    await flushPromises()
    expect(play).not.toHaveBeenCalled()
    replacement.cancel()
    await flushPromises()
    expect(play).toHaveBeenCalledOnce()
  })

  it('pauses immediately on exit and ignores a stale entry completion', async () => {
    const { media, play, pause, card } = await setup()
    const motion = animation(card)
    Object.defineProperty(card, 'getAnimations', { value: () => [motion] })
    await wrapper!.setProps({ entering: false })
    await flushPromises()
    await wrapper!.setProps({ leaving: true })
    motion.finish()
    await flushPromises()
    expect(media.autoplay).toBe(false)
    expect(play).not.toHaveBeenCalled()
    await wrapper!.setProps({ leaving: false })
    await flushPromises()
    expect(play).toHaveBeenCalledOnce()
    await wrapper!.setProps({ leaving: true })
    expect(pause).toHaveBeenCalledOnce()
  })

  it('waits for a replacement transform installed by a queued Vue style update', async () => {
    const { play, card } = await setup()
    const first = animation(card)
    const replacement = animation(card)
    let animations = [first]
    Object.defineProperty(card, 'getAnimations', { value: () => animations })
    await wrapper!.setProps({ entering: false })
    await flushPromises()
    first.cancel()
    void Promise.resolve().then(() => {
      void wrapper!.setProps({ itemStyle: { transform: 'translate3d(0, 100px, 0)' } })
      void wrapper!.vm.$nextTick(() => { animations = [replacement] })
    })
    await flushPromises()
    expect(play).not.toHaveBeenCalled()
    replacement.finish()
    await flushPromises()
    expect(play).toHaveBeenCalledOnce()
  })

  it('never resumes an offscreen or unmounted card after motion finishes', async () => {
    const { play, card } = await setup()
    const motion = animation(card)
    Object.defineProperty(card, 'getAnimations', { configurable: true, value: () => [motion] })
    await wrapper!.setProps({ entering: false })
    await flushPromises()
    await wrapper!.setProps({ inViewport: false })
    motion.finish()
    await flushPromises()
    expect(play).not.toHaveBeenCalled()
    const nextMotion = animation(card)
    Object.defineProperty(card, 'getAnimations', { configurable: true, value: () => [nextMotion] })
    await wrapper!.setProps({ entering: true, inViewport: true })
    await wrapper!.setProps({ entering: false })
    await flushPromises()
    wrapper!.unmount()
    wrapper = undefined
    nextMotion.finish()
    await flushPromises()
    expect(play).not.toHaveBeenCalled()
  })

  it('keeps V1 playback eligibility unchanged during entry and exit', async () => {
    const { media, play, pause } = await setup(false)
    expect(media.autoplay).toBe(true)
    await wrapper!.setProps({ entering: false, leaving: true })
    await flushPromises()
    expect(media.autoplay).toBe(true)
    expect(play).not.toHaveBeenCalled()
    expect(pause).not.toHaveBeenCalled()
  })
})
