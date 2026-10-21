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
  const roots: HTMLElement[] = []

  function flushFrames() {
    const pending = [...frames.values()]
    frames.clear()
    pending.forEach(callback => callback(16))
  }
  function resize(target: Element) {
    resizes.filter(value => !value.disconnected && value.targets.has(target))
      .forEach(value => value.callback([], {} as ResizeObserver))
  }
  function mutation(target: Node, type: MutationRecordType, deliver = true, detail: Partial<MutationRecord> = {}) {
    mutations.filter(value => !value.disconnected && value.target
      && (value.target === target || value.options?.subtree && value.target.contains(target))
      && (type === 'attributes' ? value.options?.attributes : type === 'characterData' ? value.options?.characterData : value.options?.childList))
      .forEach(value => {
        value.records.push({ target, type, ...detail } as MutationRecord)
        if (deliver) value.callback(value.records.splice(0), {} as MutationObserver)
      })
  }
  async function fixture() {
    const element = document.createElement('main')
    element.className = 'fixture-scroll'
    element.append(document.createElement('section'))
    document.body.append(element); roots.push(element)
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
  function motion(target: Element, type: string, property: string) {
    const event = new Event(type, { bubbles: true })
    Object.defineProperties(event, { propertyName: { value: property }, animationName: { value: property } })
    target.dispatchEvent(event)
  }
  function playback(element: HTMLElement) {
    const card = element.firstElementChild!.appendChild(document.createElement('article'))
    card.className = 'media-card masonry-item'; card.style.overflow = 'hidden'
    const controls = card.appendChild(document.createElement('div'))
    controls.className = 'media-controls'
    const seek = controls.appendChild(document.createElement('input'))
    seek.type = 'range'; seek.className = 'media-control-seek'
    const progress = (value: number) => {
      const oldValue = seek.getAttribute('style')
      seek.style.setProperty('--media-range-progress', `${value}%`)
      mutation(seek, 'attributes', true, { attributeName: 'style', oldValue })
    }
    return { card, seek, progress }
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
    roots.splice(0).forEach(element => element.remove())
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

  it('defers repeated observer deliveries to one neutral batch without reading scroll position', async () => {
    const { element } = await fixture(), { progress } = playback(element)
    const styles = vi.spyOn(window, 'getComputedStyle')
    const position = vi.spyOn(element, 'scrollTop', 'get')
    for (let index = 1; index <= 60; index++) progress(index)
    expect(styles).not.toHaveBeenCalled()
    flushFrames(); await nextTick()
    expect(styles).toHaveBeenCalledTimes(1)
    expect(position).not.toHaveBeenCalled()
    expect(reads).toEqual({ content: 0, viewport: 0, track: 0 })
  })

  it.each([false, true])('avoids clipping admission for mixed known/unknown deliveries (unknownFirst=%s)', async unknownFirst => {
    const { element, thumb } = await fixture(), { seek, progress } = playback(element)
    const styles = vi.spyOn(window, 'getComputedStyle')
    const unknown = () => {
      const oldValue = seek.getAttribute('style')
      seek.style.transform = 'translateY(500px)'
      mutation(seek, 'attributes', true, { attributeName: 'style', oldValue })
    }
    content = 4000
    if (unknownFirst) unknown()
    progress(50)
    if (!unknownFirst) unknown()
    expect(styles).not.toHaveBeenCalled()
    flushFrames(); await nextTick()
    expect(styles).not.toHaveBeenCalled()
    expect(reads.content).toBe(1)
    expect(thumb().attributes('aria-valuemax')).toBe('3500')
  })

  it('falls back at the mutation cap and keeps dropped structural changes and cleanup live', async () => {
    const { element, wrapper, thumb } = await fixture(), { card, seek, progress } = playback(element)
    progress(1); flushFrames(); await nextTick()
    expect(resizes.some(value => value.targets.has(seek))).toBe(true)
    const styles = vi.spyOn(window, 'getComputedStyle')
    content = 3000
    for (let index = 2; index <= 1100; index++) progress(index)
    flushFrames(); await nextTick()
    expect(styles).not.toHaveBeenCalled()
    expect(thumb().attributes('aria-valuemax')).toBe('2500')
    for (let index = 2; index <= 1100; index++) progress(index)
    const added = element.appendChild(document.createElement('section'))
    card.remove(); mutation(element, 'childList')
    flushFrames(); await nextTick()
    expect(resizes.filter(value => !value.disconnected).some(value => value.targets.has(added))).toBe(true)
    expect(resizes.filter(value => !value.disconnected).some(value => value.targets.has(seek) || value.targets.has(card))).toBe(false)
    mutation(added, 'attributes'); wrapper.unmount(); mounted.splice(mounted.indexOf(wrapper), 1)
    reads = { content: 0, viewport: 0, track: 0 }
    flushFrames(); await nextTick()
    expect(reads).toEqual({ content: 0, viewport: 0, track: 0 })
  })

  it.each([false, true])('keeps sizing bounded for twenty-three videos over sixty progress frames (delivered=%s)', async deliver => {
    const { element, thumb } = await fixture()
    const playback = Array.from({ length: 23 }, () => {
      const card = element.firstElementChild!.appendChild(document.createElement('article'))
      card.className = 'media-card masonry-item'
      card.style.overflow = 'hidden'
      const video = card.appendChild(document.createElement('video'))
      video.className = 'media-preview'
      const controls = card.appendChild(document.createElement('div'))
      controls.className = 'media-controls'
      const seek = controls.appendChild(document.createElement('input'))
      seek.type = 'range'; seek.className = 'media-control-range media-control-seek'
      return { video, seek }
    })
    mutation(element.firstElementChild!, 'childList'); flushFrames(); await nextTick()
    reads = { content: 0, viewport: 0, track: 0 }
    const getStyle = window.getComputedStyle.bind(window)
    let clippingReads = 0
    vi.spyOn(window, 'getComputedStyle').mockImplementation((target, pseudo) => {
      if (target.matches('.masonry-item.media-card')) clippingReads++
      return getStyle(target, pseudo)
    })
    for (let frame = 1; frame <= 60; frame++) {
      for (const { video, seek } of playback) {
        const oldVideoStyle = video.getAttribute('style')
        video.style.opacity = '0'
        mutation(video, 'attributes', deliver, { attributeName: 'style', oldValue: oldVideoStyle })
        const oldSeekStyle = seek.getAttribute('style')
        seek.style.setProperty('--media-range-progress', `${frame}%`)
        mutation(seek, 'attributes', deliver, { attributeName: 'style', oldValue: oldSeekStyle })
        const oldTime = seek.getAttribute('aria-valuetext')
        seek.setAttribute('aria-valuetext', `${frame} of 120`)
        mutation(seek, 'attributes', deliver, { attributeName: 'aria-valuetext', oldValue: oldTime })
      }
      element.scrollTop = frame * 10
      element.dispatchEvent(new Event('scroll'))
      flushFrames(); await nextTick()
    }
    expect(reads).toEqual({ content: 0, viewport: 0, track: 0 })
    expect(clippingReads).toBe(23)
    expect(thumb().attributes('aria-valuenow')).toBe('600')
    expect(thumb().attributes('aria-valuemax')).toBe('1500')
  })

  it('keeps custom playback sizing observed and falls back for every other style change', async () => {
    const { element, thumb } = await fixture()
    const card = element.firstElementChild!.appendChild(document.createElement('article'))
    card.className = 'media-card masonry-item'
    card.style.overflow = 'hidden'
    const controls = card.appendChild(document.createElement('div'))
    controls.className = 'media-controls'
    const seek = controls.appendChild(document.createElement('input'))
    seek.type = 'range'; seek.className = 'media-control-seek'
    seek.style.setProperty('--media-range-progress', '10%')
    mutation(seek, 'attributes', true, { attributeName: 'style', oldValue: null })
    flushFrames(); await nextTick()
    reads = { content: 0, viewport: 0, track: 0 }
    content = 3000; resize(seek)
    flushFrames(); await nextTick()
    expect(reads.content).toBe(1)
    expect(thumb().attributes('aria-valuemax')).toBe('2500')
    content = 4000; resize(card)
    flushFrames(); await nextTick()
    expect(thumb().attributes('aria-valuemax')).toBe('3500')
    const oldValue = seek.getAttribute('style')
    content = 5000; seek.style.transform = 'translateY(500px)'
    mutation(seek, 'attributes', true, { attributeName: 'style', oldValue })
    flushFrames(); await nextTick()
    expect(thumb().attributes('aria-valuemax')).toBe('4500')
    card.remove(); mutation(element.firstElementChild!, 'childList')
    flushFrames(); await nextTick()
    expect(resizes.filter(value => !value.disconnected).some(value => value.targets.has(seek) || value.targets.has(card))).toBe(false)
  })

  it('retains live overflow invalidation when custom card CSS stops clipping playback', async () => {
    const { element, thumb } = await fixture()
    const card = element.firstElementChild!.appendChild(document.createElement('article'))
    card.className = 'media-card masonry-item'; card.style.overflow = 'hidden'
    const controls = card.appendChild(document.createElement('div'))
    controls.className = 'media-controls'
    const seek = controls.appendChild(document.createElement('input'))
    seek.type = 'range'; seek.className = 'media-control-seek'
    seek.style.transform = 'translateY(var(--media-range-progress))'
    seek.style.setProperty('--media-range-progress', '10%')
    mutation(seek, 'attributes', true, { attributeName: 'style', oldValue: 'transform: translateY(var(--media-range-progress));' })
    flushFrames(); await nextTick()
    const oldCardStyle = card.getAttribute('style')
    card.style.overflow = 'visible'
    mutation(card, 'attributes', true, { attributeName: 'style', oldValue: oldCardStyle })
    flushFrames(); await nextTick()
    const oldSeekStyle = seek.getAttribute('style')
    content = 4000; seek.style.setProperty('--media-range-progress', '90%')
    mutation(seek, 'attributes', true, { attributeName: 'style', oldValue: oldSeekStyle })
    flushFrames(); await nextTick()
    expect(thumb().attributes('aria-valuemax')).toBe('3500')
  })

  it('does not treat custom content or mixed playback changes as neutral paint', async () => {
    const { element, thumb } = await fixture()
    const custom = element.firstElementChild!.appendChild(document.createElement('div'))
    custom.style.setProperty('--media-range-progress', '10%')
    content = 3000
    mutation(custom, 'attributes', true, { attributeName: 'style', oldValue: null })
    flushFrames(); await nextTick()
    expect(thumb().attributes('aria-valuemax')).toBe('2500')
    const video = custom.appendChild(document.createElement('video'))
    video.className = 'media-preview'
    content = 4000; video.style.opacity = '0'
    mutation(video, 'attributes', true, { attributeName: 'style', oldValue: null })
    flushFrames(); await nextTick()
    expect(thumb().attributes('aria-valuemax')).toBe('3500')
  })

  it('rechecks responsive clipping after resize even without a mutation inside the feed', async () => {
    const { element, thumb } = await fixture()
    const css = document.head.appendChild(document.createElement('style'))
    css.textContent = '.scrollbar-clipped .masonry-item { overflow: hidden } .scrollbar-open .masonry-item { overflow: visible }'
    const parent = document.body.appendChild(document.createElement('div'))
    parent.className = 'scrollbar-clipped'; parent.append(element)
    try {
      const card = element.firstElementChild!.appendChild(document.createElement('article'))
      card.className = 'media-card masonry-item'
      const controls = card.appendChild(document.createElement('div'))
      controls.className = 'media-controls'
      const seek = controls.appendChild(document.createElement('input'))
      seek.type = 'range'; seek.className = 'media-control-seek'
      seek.style.transform = 'translateY(var(--media-range-progress))'
      const initialStyle = seek.getAttribute('style')
      seek.style.setProperty('--media-range-progress', '10%')
      mutation(seek, 'attributes', true, { attributeName: 'style', oldValue: initialStyle })
      flushFrames(); await nextTick()
      expect(getComputedStyle(card).overflow).toBe('hidden')
      // This ancestor lies outside the observed feed. Its responsive CSS change
      // is signalled by resizing, not by a subtree MutationRecord.
      parent.className = 'scrollbar-open'; resize(element)
      flushFrames(); await nextTick()
      expect(getComputedStyle(card).overflow).toBe('visible')
      const oldValue = seek.getAttribute('style')
      content = 4000; seek.style.setProperty('--media-range-progress', '90%')
      mutation(seek, 'attributes', true, { attributeName: 'style', oldValue })
      flushFrames(); await nextTick()
      expect(thumb().attributes('aria-valuemax')).toBe('3500')
    } finally { css.remove(); parent.remove() }
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

  it.each([['transition', 'transform'], ['transition', 'height'], ['animation', 'synthetic-motion'], ['animation', 'opacity']] as const)('keeps live overflow reads during CSS %s %s and releases removed targets', async (kind, property) => {
    const { element, thumb } = await fixture()
    const moving = element.firstElementChild!.appendChild(document.createElement('div'))
    motion(moving, 'transitionrun', 'opacity')
    motion(moving, kind === 'transition' ? 'transitionrun' : 'animationstart', property)
    motion(moving, 'transitionend', 'opacity')
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

  it.each(['transitionend', 'transitioncancel'])('avoids geometry invalidation for opacity-only transitions through %s', async end => {
    const { element } = await fixture(), moving = element.firstElementChild!
    motion(moving, 'transitionrun', 'opacity'); flushFrames(); await nextTick()
    expect(reads.content).toBe(0)
    for (let index = 0; index < 3; index++) element.dispatchEvent(new Event('scroll'))
    motion(moving, end, 'opacity'); flushFrames(); await nextTick()
    expect(reads).toEqual({ content: 0, viewport: 0, track: 0 })
  })

  it('ignores comment-only root and nested child changes without reconnecting resize observers or overflowing the queue', async () => {
    const { element } = await fixture(), observerCount = resizes.length
    const empty = [] as unknown as NodeList
    for (const target of [element, element.firstElementChild!]) for (let index = 0; index < 1100; index++) {
      const comment = document.createComment('synthetic-anchor')
      target.append(comment)
      const addedNodes = [comment] as unknown as NodeList
      mutation(target, 'childList', true, { addedNodes, removedNodes: empty })
      comment.remove(); mutation(target, 'childList', true, { addedNodes: empty, removedNodes: addedNodes })
    }
    flushFrames(); await nextTick()
    expect(reads).toEqual({ content: 0, viewport: 0, track: 0 })
    expect(resizes).toHaveLength(observerCount)
  })
  it.each(['text', 'element', 'mixed', 'empty', 'unknown'])('keeps %s child-list records on the conservative extent path', async kind => {
    const { element, thumb } = await fixture()
    const nodes = kind === 'text' ? [document.createTextNode('synthetic')] : kind === 'element' ? [document.createElement('span')]
      : kind === 'mixed' ? [document.createComment('anchor'), document.createTextNode('synthetic')] : []
    const detail = kind === 'unknown' ? {} : { addedNodes: nodes as unknown as NodeList, removedNodes: [] as unknown as NodeList }
    content = 4000; mutation(element, 'childList', true, detail)
    flushFrames(); await nextTick()
    expect(thumb().attributes('aria-valuemax')).toBe('3500')
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
