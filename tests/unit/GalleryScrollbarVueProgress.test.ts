import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import GalleryScrollbar from '@/components/GalleryScrollbar.vue'
import MediaControls from '@/components/MediaControls.vue'

type ResizeHandle = { callback: ResizeObserverCallback; targets: Set<Element> }
let frames = new Map<number, FrameRequestCallback>(), frameId = 0
let resizes: ResizeHandle[] = [], content = 2000, extentReads = 0
const cleanup: Array<() => void> = []

// Keep the actual DOM MutationObserver: Vue must produce the records under test.
async function settle() {
  await nextTick(); await Promise.resolve()
  const pending = [...frames.values()]
  frames.clear()
  pending.forEach(callback => callback(16))
  await nextTick(); await Promise.resolve()
}
function resize(target: Element) {
  resizes.filter(handle => handle.targets.has(target))
    .forEach(handle => handle.callback([], {} as ResizeObserver))
}
async function fixture(options: { clipped?: boolean; customInput?: boolean; observed?: boolean } = {}) {
  if (options.observed === false) vi.stubGlobal('ResizeObserver', undefined)
  const host = document.body.appendChild(document.createElement('main'))
  host.className = 'synthetic-progress-feed'
  const card = host.appendChild(document.createElement('article'))
  card.className = 'masonry-item media-card'
  card.style.overflow = options.clipped === false ? 'visible' : 'hidden'
  const controls = mount(MediaControls, { attachTo: card, props: {
    currentTime: 0, duration: 120, layout: 'masonry', mediaType: 'video',
    muted: true, playing: true, volume: 1,
  } })
  const seek = controls.get<HTMLInputElement>('.media-control-seek')
  if (options.customInput) seek.element.classList.remove('media-control-seek')
  const records: MutationRecord[] = []
  const audit = new MutationObserver(delivered => records.push(...delivered))
  audit.observe(card, { attributes: true, subtree: true, attributeOldValue: true })
  const scrollbar = mount(GalleryScrollbar, { props: {
    contentSize: content, controlsId: 'synthetic-progress-feed', scrollElement: host,
  } })
  cleanup.push(() => { audit.disconnect(); scrollbar.unmount(); controls.unmount(); host.remove() })
  await settle(); await settle()
  await controls.setProps({ currentTime: 1 }); await settle()
  // Simulate initial border-box observer delivery, then re-prime clipping.
  for (const handle of resizes) handle.callback([], {} as ResizeObserver)
  await settle()
  await controls.setProps({ currentTime: 2 }); await settle()
  extentReads = 0; records.length = 0
  const tick = async (currentTime: number) => { await controls.setProps({ currentTime }); await settle() }
  return { host, card, controls, seek, scrollbar, records, tick }
}

beforeEach(() => {
  frames = new Map(); frameId = 0; resizes = []; content = 2000; extentReads = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++frameId; frames.set(id, callback); return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { frames.delete(id) })
  vi.stubGlobal('ResizeObserver', class {
    handle: ResizeHandle
    constructor(callback: ResizeObserverCallback) {
      this.handle = { callback, targets: new Set() }; resizes.push(this.handle)
    }
    observe(target: Element) { this.handle.targets.add(target) }
    unobserve(target: Element) { this.handle.targets.delete(target) }
    disconnect() { this.handle.targets.clear() }
  })
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function () {
    if (this.classList.contains('synthetic-progress-feed')) { extentReads++; return content }
    return 0
  })
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
})
afterEach(() => {
  cleanup.splice(0).forEach(stop => stop())
  vi.restoreAllMocks(); vi.unstubAllGlobals()
})

describe('real Vue seek mutations and scrollbar sizing', () => {
  it('keeps real value property/attribute and progress updates without rereading stable extent', async () => {
    const f = await fixture()
    const computedStyle = vi.spyOn(window, 'getComputedStyle')
    for (const time of [3, 7.5, 63]) {
      await f.tick(time)
      expect(Number(f.seek.element.value)).toBe(time)
      expect(f.seek.attributes('value')).toBe(String(time))
      expect(f.seek.element.style.getPropertyValue('--media-range-progress')).toBe(
        String(time / 120 * 100) + '%',
      )
    }
    expect(f.seek.attributes('aria-valuetext')).toBe('1:03 of 2:00')
    expect(f.records.filter(record => record.target === f.seek.element && record.attributeName === 'value'))
      .toHaveLength(3)
    expect(extentReads).toBe(0)
    expect(computedStyle).not.toHaveBeenCalled()
    expect(resizes.some(handle => handle.targets.has(f.seek.element))).toBe(true)
    expect(resizes.some(handle => handle.targets.has(f.card))).toBe(true)
    await f.seek.setValue('42')
    expect(f.controls.emitted('seek')?.at(-1)).toEqual([42])
    await f.tick(42)
    expect(f.seek.attributes('aria-valuetext')).toBe('0:42 of 2:00')
    expect(extentReads).toBe(0)
    f.host.scrollTop = 300; f.host.dispatchEvent(new Event('scroll')); await nextTick()
    expect(f.scrollbar.get('.gallery-scrollbar-thumb').attributes('aria-valuenow')).toBe('300')
    expect(extentReads).toBe(0)
  })

  it.each(['min', 'max', 'step', 'disabled', 'class', 'data-custom'])(
    'retains geometry invalidation for a changed %s attribute mixed with real progress', async attribute => {
      const f = await fixture()
      content = 3000
      const values: Record<string, string> = {
        min: '-10', max: '240', step: '0.5', disabled: '',
        class: f.seek.element.className + ' custom-seek', 'data-custom': 'changed',
      }
      f.seek.element.setAttribute(attribute, values[attribute]!)
      await f.tick(7)
      expect(extentReads).toBe(1)
      expect(f.scrollbar.get('.gallery-scrollbar-thumb').attributes('aria-valuemax')).toBe('2500')
    },
  )

  it.each([{ clipped: false }, { customInput: true }, { observed: false }])(
    'keeps live sizing outside guarded built-in clipped inputs (%j)', async options => {
      const f = await fixture(options)
      content = 3500; await f.tick(10)
      expect(extentReads).toBe(1)
      expect(f.scrollbar.get('.gallery-scrollbar-thumb').attributes('aria-valuemax')).toBe('3000')
    },
  )

  it.each(['seek', 'card'] as const)('refreshes extent when the admitted %s border box resizes', async target => {
    const f = await fixture()
    const node = target === 'seek' ? f.seek.element : f.card
    expect(resizes.some(handle => handle.targets.has(node))).toBe(true)
    content = 4000; resize(node); await settle()
    expect(extentReads).toBe(1)
    expect(f.scrollbar.get('.gallery-scrollbar-thumb').attributes('aria-valuemax')).toBe('3500')
    await f.tick(12)
    const stableReads = extentReads
    await f.tick(13)
    expect(extentReads).toBe(stableReads)
  })

  it('rechecks clipping after custom overflow changes and ignores queued work after disposal', async () => {
    const f = await fixture()
    content = 3000; f.card.style.overflow = 'visible'; await settle()
    extentReads = 0; content = 4000; await f.tick(11)
    expect(extentReads).toBe(1)
    expect(f.scrollbar.get('.gallery-scrollbar-thumb').attributes('aria-valuemax')).toBe('3500')
    await f.controls.setProps({ currentTime: 12 }); await Promise.resolve()
    const queued = [...frames.values()]
    f.scrollbar.unmount(); extentReads = 0
    queued.forEach(callback => callback(16)); await settle()
    expect(extentReads).toBe(0)
    expect(resizes.every(handle => handle.targets.size === 0)).toBe(true)
  })
})
