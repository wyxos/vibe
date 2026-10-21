import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import GalleryScrollbar from '@/components/GalleryScrollbar.vue'
import { createAutoScrollState, VibeAutoScrollController } from '@/core/autoScroll'
import { cancelScrollFrame, claimScrollFrameWriter, hasScrollFrameWriter, requestScrollFrame } from '@/core/scrollFrame'

const frames = new Map<number, FrameRequestCallback>()
const cleanup: Array<() => void> = []
let frameId = 0
let operations: string[] = []
async function frame(time: number) {
  const pending = [...frames.values()]
  frames.clear()
  for (const callback of pending) {
    callback(time)
    // Browser callbacks have a microtask checkpoint between callbacks.
    await nextTick(); await Promise.resolve()
  }
  return pending.length
}
async function fixture() {
  const host = document.body.appendChild(document.createElement('main'))
  const section = host.appendChild(document.createElement('section'))
  let position = 0
  Object.defineProperties(host, {
    scrollHeight: { configurable: true, get() { operations.push('read:extent'); return 2000 } },
    clientHeight: { configurable: true, get() { operations.push('read:viewport'); return 500 } },
    scrollTop: { configurable: true, get() { operations.push('read:top'); return position },
      set(value: number) { operations.push('write:top'); position = Math.round(Math.max(0, Math.min(1500, value))) } },
  })
  const scrollbar = mount(GalleryScrollbar, { props: { contentSize: 2000, controlsId: 'synthetic-batched-feed', scrollElement: host } })
  cleanup.push(() => { scrollbar.unmount(); host.remove() })
  await nextTick(); await frame(0); await frame(0)
  const thumb = scrollbar.get<HTMLElement>('.gallery-scrollbar-thumb')
  const audit: MutationRecord[] = []
  const observer = new MutationObserver(records => { audit.push(...records); operations.push('publish:dom') })
  observer.observe(thumb.element, { attributes: true })
  cleanup.push(() => observer.disconnect())
  const state = createAutoScrollState({ enabled: true, speedPxPerSecond: 20 })
  const controller = new VibeAutoScrollController({ state, getScrollElement: () => host })
  cleanup.push(() => controller.destroy())
  controller.mount(); await frame(0)
  operations = []; audit.length = 0
  return { host, section, thumb, scrollbar, controller, audit, external(value: number) { position = value } }
}

beforeEach(() => {
  frames.clear(); frameId = 0; operations = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++frameId; frames.set(id, callback); return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { frames.delete(id) })
  vi.stubGlobal('ResizeObserver', class {
    observe() {} unobserve() {} disconnect() {}
  })
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
})
afterEach(() => {
  cleanup.splice(0).reverse().forEach(stop => stop())
  vi.restoreAllMocks(); vi.unstubAllGlobals()
})

describe('shared scrollbar and auto-scroll frame ordering', () => {
  it('batches real mutation and scroll work before the quantized write and Vue DOM publication', async () => {
    const f = await fixture()
    f.external(10.2)
    f.host.dispatchEvent(new Event('scroll'))
    f.section.appendChild(document.createElement('span')) // Actual MutationObserver delivery.
    await nextTick(); await Promise.resolve()
    expect(operations.filter(value => value.startsWith('read:'))).toEqual([])
    expect(await frame(10)).toBe(1)
    expect(operations.filter(value => value === 'read:extent')).toHaveLength(1)
    expect(operations.filter(value => value === 'read:top')).toHaveLength(2)
    const write = operations.indexOf('write:top'), publish = operations.indexOf('publish:dom')
    expect(write).toBeGreaterThan(operations.indexOf('read:extent'))
    expect(operations.slice(write + 1, publish)).toEqual(['read:top']) // Exact required native readback only.
    expect(f.thumb.attributes('aria-valuenow')).toBe('10')
    expect(f.thumb.element.style.transform).toBe('translate3d(0, 2.5px, 0)')
    expect(f.audit.some(record => record.attributeName === 'aria-valuenow')).toBe(true)
  })

  it('cancels pending geometry on unmount without cancelling the other owner', async () => {
    const f = await fixture()
    f.host.dispatchEvent(new Event('scroll'))
    f.scrollbar.unmount()
    operations = []
    expect(await frame(50)).toBe(1)
    expect(operations.filter(value => value === 'write:top')).toHaveLength(1)
    expect(operations).not.toContain('publish:dom')
  })

  it('keeps keyboard changes synchronous while auto-scroll remains active', async () => {
    const f = await fixture()
    await f.thumb.trigger('keydown', { key: 'ArrowDown' })
    expect(f.thumb.attributes('aria-valuenow')).toBe('40')
    expect(f.host.scrollTop).toBe(40)
    await frame(10)
    expect(f.host.scrollTop).toBe(40)
  })

  it('returns to synchronous manual scrolling as soon as auto-scroll pauses', async () => {
    const f = await fixture()
    f.controller.setPaused(true)
    f.external(23.75)
    f.host.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(f.thumb.attributes('aria-valuenow')).toBe('24')
    expect(frames.size).toBe(0)
  })

  it('retains the explicit nextTick content sizing path before an auto frame', async () => {
    const f = await fixture()
    await f.scrollbar.setProps({ contentSize: 3000 })
    await nextTick()
    expect(operations).toContain('read:extent')
    expect(operations).not.toContain('write:top')
  })

  it('cancels queued publication while suspended and remeasures after resume', async () => {
    const f = await fixture()
    f.external(20)
    f.host.dispatchEvent(new Event('scroll'))
    await f.scrollbar.setProps({ suspended: true })
    operations = []
    await frame(10)
    expect(f.thumb.attributes('aria-valuenow')).toBe('0')
    expect(operations).not.toContain('publish:dom')
    await f.scrollbar.setProps({ suspended: false })
    await frame(20)
    expect(f.thumb.attributes('aria-valuenow')).toBe('20')
  })

  it.each(['read', 'write', 'publish'] as const)('finishes independent owners then rethrows a %s failure', stage => {
    const calls: string[] = [], error = new Error('synthetic owner failure')
    requestScrollFrame(() => {
      calls.push('bad:read')
      if (stage === 'read') throw error
      return { write() { calls.push('bad:write'); if (stage === 'write') throw error },
        publish() { calls.push('bad:publish'); if (stage === 'publish') throw error } }
    })
    requestScrollFrame(() => {
      calls.push('good:read')
      return { write() { calls.push('good:write') }, publish() { calls.push('good:publish') } }
    })
    expect(frames.size).toBe(1)
    const callback = [...frames.values()][0]!
    frames.clear()
    expect(() => callback(10)).toThrow(error)
    expect(calls.filter(value => value.startsWith('good:'))).toEqual(['good:read', 'good:write', 'good:publish'])
    if (stage !== 'publish') expect(calls).not.toContain('bad:publish')
  })

  it('honors cancellation after reading without suppressing another owner', async () => {
    const calls: string[] = []
    const cancelled = requestScrollFrame(() => ({ write() { calls.push('cancelled:write') }, publish() { calls.push('cancelled:publish') } }))
    requestScrollFrame(() => {
      cancelScrollFrame(cancelled)
      return { write() { calls.push('live:write') }, publish() { calls.push('live:publish') } }
    })
    await frame(10)
    expect(calls).toEqual(['live:write', 'live:publish'])
  })

  it('preserves multiple failures instead of swallowing later owners', () => {
    const errors = [new Error('first synthetic failure'), new Error('second synthetic failure')]
    errors.forEach(error => requestScrollFrame(() => { throw error }))
    const callback = [...frames.values()][0]!
    frames.clear()
    try { callback(10); expect.fail('Expected aggregate failure') }
    catch (error) { expect(error).toBeInstanceOf(AggregateError); expect((error as AggregateError).errors).toEqual(errors) }
  })

  it('releases only its own writer registration, including repeated cleanup', () => {
    const element = document.createElement('div')
    const first = claimScrollFrameWriter(element)
    first()
    const second = claimScrollFrameWriter(element)
    first()
    expect(hasScrollFrameWriter(element)).toBe(true)
    second()
    expect(hasScrollFrameWriter(element)).toBe(false)
  })

  it('stops a failed auto writer without suppressing the independent scrollbar or hiding its error', async () => {
    const f = await fixture()
    const error = new Error('synthetic native setter failure')
    Object.defineProperty(f.host, 'scrollTop', { configurable: true, get: () => 0, set() { throw error } })
    f.host.dispatchEvent(new Event('scroll'))
    const callback = [...frames.values()][0]!
    frames.clear()
    expect(() => callback(10)).toThrow(error)
    await nextTick()
    expect(f.thumb.attributes('aria-valuenow')).toBe('0')
    expect(hasScrollFrameWriter(f.host)).toBe(false)
    expect(frames.size).toBe(0)
  })

  it.each(['pause', 'destroy'] as const)('rejects a stale auto write when another read job requests %s', async action => {
    const f = await fixture()
    f.host.dispatchEvent(new Event('scroll'))
    requestScrollFrame(() => {
      // The auto job has read its target and queued its write by this point.
      expect(operations).toContain('read:top')
      if (action === 'pause') f.controller.setPaused(true)
      else f.controller.destroy()
      return { publish() { operations.push('live:publish') } }
    })
    expect(await frame(50)).toBe(1)
    expect(operations).not.toContain('write:top')
    expect(operations.filter(value => value === 'read:top')).toHaveLength(1)
    expect(f.thumb.attributes('aria-valuenow')).toBe('0')
    expect(f.thumb.element.style.transform).toBe('translate3d(0, 0px, 0)')
    expect(f.audit).toHaveLength(0)
    expect(operations).toContain('live:publish')
    expect(hasScrollFrameWriter(f.host)).toBe(false)
    expect(frames.size).toBe(0)
  })
})
