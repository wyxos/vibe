import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import GalleryScrollbar from '@/components/GalleryScrollbar.vue'

type ResizeHandle = { callback: ResizeObserverCallback; targets: Set<Element>; disconnected: boolean }
type MutationHandle = { callback: MutationCallback; target?: Node; options?: MutationObserverInit; records: MutationRecord[]; disconnected: boolean }

describe('GalleryScrollbar measured sizing', () => {
  let content = 2000, viewport = 500, track = 500
  let reads = { content: 0, viewport: 0, track: 0 }
  let resizes: ResizeHandle[] = []
  let mutations: MutationHandle[] = []
  let frames = new Map<number, FrameRequestCallback>()
  let frameId = 0
  const mounted: Array<ReturnType<typeof mount>> = []

  function flushFrames() {
    const pending = [...frames.values()]
    frames.clear()
    pending.forEach(callback => callback(16))
  }
  function resize(target: Element) {
    resizes.filter(value => !value.disconnected && value.targets.has(target))
      .forEach(value => value.callback([], {} as ResizeObserver))
  }
  function mutation(target: Node, type: MutationRecordType, deliver = true) {
    mutations.filter(value => !value.disconnected && value.target
      && (value.target === target || value.options?.subtree && value.target.contains(target))
      && (type === 'attributes' ? value.options?.attributes : type === 'characterData' ? value.options?.characterData : value.options?.childList))
      .forEach(value => {
        value.records.push({ target, type } as MutationRecord)
        if (deliver) value.callback(value.records.splice(0), {} as MutationObserver)
      })
  }
  async function fixture() {
    const element = document.createElement('main')
    element.className = 'fixture-scroll'
    element.append(document.createElement('section'))
    const wrapper = mount(GalleryScrollbar, { props: { contentSize: content, controlsId: 'synthetic-gallery', scrollElement: element } })
    mounted.push(wrapper)
    await nextTick(); await nextTick()
    flushFrames(); await nextTick(); flushFrames(); await nextTick()
    reads = { content: 0, viewport: 0, track: 0 }
    return { element, wrapper, thumb: () => wrapper.get<HTMLElement>('.gallery-scrollbar-thumb') }
  }
  function pointer(element: Element, type: string, pointerId: number, clientY: number) {
    const event = new Event(type, { bubbles: true, cancelable: true })
    Object.defineProperties(event, { pointerId: { value: pointerId }, clientY: { value: clientY } })
    element.dispatchEvent(event)
  }

  beforeEach(() => {
    content = 2000; viewport = 500; track = 500
    reads = { content: 0, viewport: 0, track: 0 }
    resizes = []; mutations = []; frames = new Map(); frameId = 0
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { const id = ++frameId; frames.set(id, callback); return id })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => { frames.delete(id) })
    vi.stubGlobal('ResizeObserver', class {
      handle: ResizeHandle
      constructor(callback: ResizeObserverCallback) { this.handle = { callback, targets: new Set(), disconnected: false }; resizes.push(this.handle) }
      observe(target: Element) { this.handle.targets.add(target) }
      unobserve(target: Element) { this.handle.targets.delete(target) }
      disconnect() { this.handle.disconnected = true; this.handle.targets.clear() }
    })
    vi.stubGlobal('MutationObserver', class {
      handle: MutationHandle
      constructor(callback: MutationCallback) { this.handle = { callback, records: [], disconnected: false }; mutations.push(this.handle) }
      observe(target: Node, options: MutationObserverInit) { Object.assign(this.handle, { target, options }) }
      disconnect() { this.handle.disconnected = true; this.handle.records = [] }
      takeRecords() { return this.handle.records.splice(0) }
    })
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function () {
      if (this.classList.contains('fixture-scroll')) { reads.content++; return content }
      return 0
    })
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function () {
      if (this.classList.contains('fixture-scroll')) { reads.viewport++; return viewport }
      if (this.classList.contains('gallery-scrollbar')) { reads.track++; return track }
      return 0
    })
  })
  afterEach(() => {
    mounted.splice(0).forEach(wrapper => wrapper.unmount())
    vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers()
  })

  it('updates sixty pure scroll positions without rereading validated sizes', async () => {
    const { element, thumb } = await fixture()
    for (let index = 1; index <= 60; index++) {
      element.scrollTop = index * 10
      element.dispatchEvent(new Event('scroll'))
    }
    await nextTick()
    expect(reads).toEqual({ content: 0, viewport: 0, track: 0 })
    expect(thumb().element.style.transform).toBe('translate3d(0, 150px, 0)')
    expect(thumb().attributes('aria-valuenow')).toBe('600')
  })

  it('coalesces content and resize invalidations into one current sizing read', async () => {
    const { element, wrapper, thumb } = await fixture()
    content = 4000
    resize(element); resize(element.firstElementChild!)
    await wrapper.setProps({ contentSize: content })
    await nextTick()
    expect(reads).toEqual({ content: 1, viewport: 1, track: 1 })
    flushFrames(); await nextTick()
    expect(reads).toEqual({ content: 1, viewport: 1, track: 1 })
    expect(thumb().element.style.height).toBe('62.5px')
    expect(thumb().attributes('aria-valuemax')).toBe('3500')
  })

  it('invalidates nested overflow changes and resizes the separate track', async () => {
    const { element, wrapper, thumb } = await fixture()
    const nested = element.firstElementChild!.appendChild(document.createElement('div'))
    content = 4000
    mutation(nested, 'attributes')
    flushFrames(); await nextTick()
    expect(thumb().attributes('aria-valuemax')).toBe('3500')
    track = 300
    resize(wrapper.get('.gallery-scrollbar').element)
    flushFrames(); await nextTick()
    expect(thumb().element.style.height).toBe('37.5px')
    content = 500
    mutation(nested, 'characterData')
    flushFrames(); await nextTick()
    expect(wrapper.get('.gallery-scrollbar').classes()).not.toContain('gallery-scrollbar--visible')
    expect(thumb().attributes('tabindex')).toBe('-1')
  })

  it('consumes queued mutations on scroll before the observer microtask and avoids duplicate measurement', async () => {
    const { element, thumb } = await fixture()
    content = 4000
    mutation(element.firstElementChild!, 'attributes', false)
    element.scrollTop = 1750
    element.dispatchEvent(new Event('scroll'))
    await nextTick(); flushFrames(); await nextTick()
    expect(reads).toEqual({ content: 1, viewport: 1, track: 1 })
    expect(thumb().attributes('aria-valuemax')).toBe('3500')
    expect(thumb().element.style.transform).toBe('translate3d(0, 218.75px, 0)')
  })

  it('remeasures after resource loading without a content-size prop change', async () => {
    const { element, thumb } = await fixture()
    const image = element.firstElementChild!.appendChild(document.createElement('img'))
    content = 3000
    image.dispatchEvent(new Event('load'))
    flushFrames(); await nextTick()
    expect(thumb().attributes('aria-valuemax')).toBe('2500')
  })

  it.each(['transition', 'animation'] as const)('keeps live overflow reads during CSS %s motion and releases removed targets', async kind => {
    const { element, thumb } = await fixture()
    const moving = element.firstElementChild!.appendChild(document.createElement('div'))
    const start = new Event(kind === 'transition' ? 'transitionrun' : 'animationstart', { bubbles: true })
    Object.defineProperties(start, { propertyName: { value: 'transform' }, animationName: { value: 'synthetic-motion' } })
    moving.dispatchEvent(start)
    flushFrames(); await nextTick()
    reads = { content: 0, viewport: 0, track: 0 }
    content = 3000
    element.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(reads).toEqual({ content: 1, viewport: 1, track: 1 })
    expect(thumb().attributes('aria-valuemax')).toBe('2500')
    moving.remove()
    mutation(element.firstElementChild!, 'childList')
    flushFrames(); await nextTick()
    reads = { content: 0, viewport: 0, track: 0 }
    element.dispatchEvent(new Event('scroll'))
    expect(reads).toEqual({ content: 0, viewport: 0, track: 0 })
  })

  it.each(['ResizeObserver', 'MutationObserver'] as const)('keeps live sizing on scroll when %s is unavailable', async observer => {
    vi.stubGlobal(observer, undefined)
    const { element, thumb } = await fixture()
    content = 4000; viewport = 400; track = 300
    for (let index = 0; index < 3; index++) element.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(reads).toEqual({ content: 3, viewport: 3, track: 3 })
    expect(thumb().attributes('aria-valuemax')).toBe('3600')
    expect(thumb().element.style.height).toBe('32px')
  })

  it('retains keyboard track-click auto-hide and suspension behavior using current sizing', async () => {
    vi.useFakeTimers()
    const { element, wrapper, thumb } = await fixture()
    await thumb().trigger('keydown', { key: 'PageDown' })
    expect(element.scrollTop).toBe(500)
    expect(wrapper.classes()).toContain('gallery-scrollbar--interacting')
    await vi.advanceTimersByTimeAsync(120)
    expect(wrapper.classes()).not.toContain('gallery-scrollbar--interacting')
    content = 4000
    resize(element)
    await thumb().trigger('keydown', { key: 'End' })
    expect(element.scrollTop).toBe(3500)
    await thumb().trigger('keydown', { key: 'Home' })
    expect(element.scrollTop).toBe(0)
    pointer(wrapper.element, 'pointerdown', 1, 250)
    expect(element.scrollTop).toBe(1750)
    await wrapper.setProps({ suspended: true })
    expect(thumb().attributes('tabindex')).toBe('-1')
    await thumb().trigger('keydown', { key: 'ArrowDown' })
    expect(element.scrollTop).toBe(1750)
    await wrapper.setProps({ suspended: false })
    expect(thumb().attributes('tabindex')).toBe('0')
  })

  it('freezes drag geometry and applies one pending sizing update on release', async () => {
    const { element, wrapper, thumb } = await fixture()
    pointer(thumb().element, 'pointerdown', 7, 100)
    reads = { content: 0, viewport: 0, track: 0 }
    content = 4000
    resize(element)
    await wrapper.setProps({ contentSize: content })
    pointer(thumb().element, 'pointermove', 7, 200)
    expect(element.scrollTop).toBe(400)
    expect(reads).toEqual({ content: 0, viewport: 0, track: 0 })
    pointer(thumb().element, 'pointerup', 7, 200)
    await nextTick(); flushFrames(); await nextTick()
    expect(reads).toEqual({ content: 1, viewport: 1, track: 1 })
    expect(thumb().attributes('aria-valuemax')).toBe('3500')
    expect(wrapper.classes()).not.toContain('gallery-scrollbar--dragging')
  })

  it('disconnects replaced elements and cancels queued reads when unmounted', async () => {
    const { element, wrapper } = await fixture()
    const oldObservers = [...resizes]
    const replacement = element.cloneNode(true) as HTMLElement
    await wrapper.setProps({ scrollElement: replacement })
    await nextTick(); flushFrames(); await nextTick()
    reads = { content: 0, viewport: 0, track: 0 }
    element.dispatchEvent(new Event('scroll'))
    oldObservers.forEach(observer => observer.callback([], {} as ResizeObserver))
    resize(replacement)
    wrapper.unmount()
    mounted.splice(mounted.indexOf(wrapper), 1)
    flushFrames(); await nextTick()
    expect(reads).toEqual({ content: 0, viewport: 0, track: 0 })
    expect(resizes.every(observer => observer.disconnected)).toBe(true)
    expect(mutations.every(observer => observer.disconnected)).toBe(true)
  })
})
