import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import GalleryScrollbar from '@/components/GalleryScrollbar.vue'
import MediaCard from '@/components/MediaCard.vue'

type Resize = { callback: ResizeObserverCallback; targets: Set<Element> }
let frames: FrameRequestCallback[] = [], resizes: Resize[] = [], content = 2000, reads = 0
const cleanup: Array<() => void> = []
async function flush() { const pending = frames; frames = []; pending.forEach(callback => callback(16)); await nextTick() }
function motion(target: Element, kind: 'shimmer' | 'preview', name?: string) {
  const event = new Event(kind === 'shimmer' ? 'animationstart' : 'transitionrun', { bubbles: true })
  Object.defineProperties(event, { animationName: { value: name ?? 'media-loading-shimmer' }, propertyName: { value: name ?? 'transform' } })
  target.dispatchEvent(event)
}
async function fixture() {
  const host = document.body.appendChild(document.createElement('main'))
  host.className = 'synthetic-feed'
  const css = document.head.appendChild(document.createElement('style'))
  css.textContent = '.media-loading,.media-card-media { overflow:hidden }'
  const card = mount(MediaCard, { attachTo: host, attrs: { class: 'masonry-item' }, props: {
    entering: false, fetchPriority: 'low', inViewport: false, index: 0,
    item: { postId: 1, src: 'data:,synthetic-video', type: 'video', width: 400, height: 600, items: [] },
    layout: 'masonry', loadedCount: 1, mediaIndex: 0, previewState: 'loading', total: null,
  } })
  const scrollbar = mount(GalleryScrollbar, { props: { controlsId: 'synthetic-feed', contentSize: content, scrollElement: host } })
  cleanup.push(() => { scrollbar.unmount(); card.unmount(); host.remove(); css.remove() })
  await nextTick(); await nextTick(); await flush(); await flush()
  const targets = { shimmer: card.get('.media-loading-shimmer').element, preview: card.get('video').element }
  const masks = { shimmer: card.get<HTMLElement>('.media-loading').element, preview: card.get<HTMLElement>('.media-card-media').element }
  const scroll = async (count = 60) => { for (let index = 0; index < count; index++) { host.scrollTop += 5; host.dispatchEvent(new Event('scroll')) }; await nextTick() }
  reads = 0
  return { host, card, scrollbar, targets, masks, scroll }
}
beforeEach(() => {
  frames = []; resizes = []; content = 2000; reads = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.push(callback); return frames.length })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.stubGlobal('MutationObserver', class { observe() {} disconnect() {} takeRecords() { return [] } })
  vi.stubGlobal('ResizeObserver', class {
    record: Resize
    constructor(callback: ResizeObserverCallback) { this.record = { callback, targets: new Set() }; resizes.push(this.record) }
    observe(target: Element) { this.record.targets.add(target) }
    unobserve(target: Element) { this.record.targets.delete(target) }
    disconnect() { this.record.targets.clear() }
  })
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function () {
    if (this.classList.contains('synthetic-feed')) { reads++; return content }; return 0
  })
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
})
afterEach(() => { cleanup.splice(0).forEach(stop => stop()); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('real MediaCard motion and scrollbar geometry', () => {
  it.each(['shimmer', 'preview'] as const)('reuses measured extent during the built-in clipped %s motion', async kind => {
    const f = await fixture()
    expect(f.card.get('video').attributes('preload')).toBe('none')
    expect(getComputedStyle(f.masks[kind]).overflow).toBe('hidden')
    motion(f.targets[kind], kind); await flush(); reads = 0
    await f.scroll()
    expect(reads).toBe(0)
    expect(f.scrollbar.get('.gallery-scrollbar-thumb').attributes('aria-valuenow')).toBe('300')
    expect(f.card.find('.media-loading-shimmer').exists()).toBe(true)
    // Retain the running motion so a responsive/custom clipping change resumes
    // live overflow tracking without requiring a second animationstart event.
    f.masks[kind].style.overflow = 'visible'
    const observers = resizes.filter(value => value.targets.has(f.masks[kind]))
    expect(observers.length).toBeGreaterThan(0)
    observers.forEach(value => value.callback([], {} as ResizeObserver))
    await flush(); reads = 0; content = 4000
    await f.scroll(2)
    expect(reads).toBe(2)
    expect(f.scrollbar.get('.gallery-scrollbar-thumb').attributes('aria-valuemax')).toBe('3500')
  })

  it.each(['shimmer', 'preview'] as const)('keeps live geometry for custom visible-overflow %s motion', async kind => {
    const f = await fixture()
    f.masks[kind].style.overflow = 'visible'
    motion(f.targets[kind], kind); await flush(); reads = 0; content = 3000
    await f.scroll(2)
    expect(reads).toBe(2)
    expect(f.scrollbar.get('.gallery-scrollbar-thumb').attributes('aria-valuemax')).toBe('2500')
  })

  it('keeps unknown/custom animation names live even on the built-in clipped loader', async () => {
    const f = await fixture()
    motion(f.targets.shimmer, 'shimmer', 'custom-motion'); await flush(); reads = 0; content = 3000
    await f.scroll(2)
    expect(reads).toBe(2)
  })

  it('releases removed motion masks even when MutationObserver is unavailable', async () => {
    vi.stubGlobal('MutationObserver', undefined)
    const f = await fixture()
    motion(f.targets.shimmer, 'shimmer'); await flush()
    expect(resizes.some(value => value.targets.has(f.masks.shimmer))).toBe(true)
    f.card.element.remove(); await f.scroll(1)
    expect(resizes.some(value => value.targets.has(f.masks.shimmer))).toBe(false)
  })
})
