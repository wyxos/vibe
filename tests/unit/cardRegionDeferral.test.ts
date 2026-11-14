import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { afterEach, expect, it, vi } from 'vitest'
import CardRegion from '@/components/CardRegion.vue'

afterEach(() => vi.unstubAllGlobals())
const item = { postId: 1, src: '/image.jpg', width: 400, height: 600, items: [] }
const Child = defineComponent({ props: ['mediaItem'], setup: props => () => h('button', props.mediaItem.src) })
function region(placement: 'header' | 'footer', deferred = true, layout: 'masonry' | 'reel' = 'masonry') {
  return mount(CardRegion, { props: { index: 0, item, layout, loadedCount: 1, mediaIndex: 0, total: 1,
    scrolling: true, placement, region: { component: Child, height: 40, deferMountDuringScroll: deferred } } })
}

it.each(['header', 'footer'] as const)('defers the first %s mount, cancels renewed scroll and retains mounted controls', async placement => {
  const callbacks = new Map<number, () => void>()
  let sequence = 0
  vi.stubGlobal('requestIdleCallback', (callback: () => void) => { callbacks.set(++sequence, callback); return sequence })
  vi.stubGlobal('cancelIdleCallback', (id: number) => callbacks.delete(id))
  const wrapper = region(placement)
  expect(wrapper.find('button').exists()).toBe(false)
  expect(wrapper.element.style.height).toBe('40px')
  await wrapper.setProps({ scrolling: false })
  expect(callbacks.size).toBe(1)
  await wrapper.setProps({ scrolling: true })
  expect(callbacks.size).toBe(0)
  await wrapper.setProps({ scrolling: false })
  const run = callbacks.values().next().value!
  callbacks.clear()
  run()
  await nextTick()
  expect(wrapper.get('button').text()).toBe('/image.jpg')
  await wrapper.setProps({ scrolling: true })
  expect(wrapper.find('button').exists()).toBe(true)
  wrapper.unmount()
})

it('renders immediately by default and in reels', () => {
  for (const wrapper of [region('header', false), region('footer', true, 'reel')]) {
    expect(wrapper.find('button').exists()).toBe(true)
    wrapper.unmount()
  }
})

it('cancels the animation-frame fallback when unmounted', async () => {
  vi.stubGlobal('requestIdleCallback', undefined)
  const request = vi.fn().mockReturnValue(12)
  const cancel = vi.fn()
  vi.stubGlobal('requestAnimationFrame', request)
  vi.stubGlobal('cancelAnimationFrame', cancel)
  const wrapper = region('footer')
  await wrapper.setProps({ scrolling: false })
  expect(request).toHaveBeenCalledOnce()
  wrapper.unmount()
  expect(cancel).toHaveBeenCalledWith(12)
})

it('renders pending controls immediately when switching to a reel', async () => {
  const wrapper = region('header')
  await wrapper.setProps({ layout: 'reel' })
  expect(wrapper.find('button').exists()).toBe(true)
  wrapper.unmount()
})

it.each(['header', 'footer'] as const)('mounts a new %s during idle while automatic scrolling continues', async placement => {
  const callbacks = new Map<number, () => void>()
  vi.stubGlobal('requestIdleCallback', (callback: () => void) => { callbacks.set(1, callback); return 1 })
  vi.stubGlobal('cancelIdleCallback', (id: number) => callbacks.delete(id))
  const wrapper = mount(CardRegion, { props: { index: 0, item, layout: 'masonry', loadedCount: 1,
    mediaIndex: 0, total: 1, scrolling: false, autoScrolling: true, placement,
    region: { component: Child, height: 40, deferMountDuringScroll: true } } })
  expect(wrapper.find('button').exists()).toBe(false)
  expect(callbacks.size).toBe(1)
  callbacks.get(1)!()
  await nextTick()
  expect(wrapper.get('button').text()).toBe('/image.jpg')
  await wrapper.setProps({ scrolling: true })
  expect(wrapper.find('button').exists()).toBe(true)
  wrapper.unmount()
})
