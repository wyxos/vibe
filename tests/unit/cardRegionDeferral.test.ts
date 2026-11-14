import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { afterEach, expect, it, vi } from 'vitest'
import CardRegion from '@/components/CardRegion.vue'
import MediaCard from '@/components/MediaCard.vue'
import { useCardRegionReveal } from '@/components/useCardRegionReveal'

afterEach(() => vi.unstubAllGlobals())
const item = { postId: 1, src: '/image.jpg', width: 400, height: 600, items: [] }
const Child = defineComponent({ props: ['mediaItem'], setup: props => () => h('button', props.mediaItem.src) })
const Region = defineComponent({
  props: { scrolling: Boolean, autoScrolling: Boolean, layout: { type: String as () => 'masonry' | 'reel', required: true }, placement: { type: String as () => 'header' | 'footer', required: true }, deferred: Boolean },
  setup(props) {
    const region = { component: Child, height: 40, deferMountDuringScroll: props.deferred }
    const reveal = useCardRegionReveal(reactive({ get layout() { return props.layout }, get scrolling() { return props.scrolling },
      get autoScrolling() { return props.autoScrolling }, cardHeader: region }))
    return () => h(CardRegion, { index: 0, item, layout: props.layout, loadedCount: 1, mediaIndex: 0, total: 1,
      placement: props.placement, region, deferMount: !reveal.regionsReady.value,
      'data-media-reveal': String(reveal.canRevealMedia.value) })
  },
})
function region(placement: 'header' | 'footer', deferred = true, layout: 'masonry' | 'reel' = 'masonry') {
  return mount(Region, { props: { layout, scrolling: true, placement, deferred } })
}

it.each(['header', 'footer'] as const)('defers the first %s mount, cancels renewed scroll and retains mounted controls', async placement => {
  const callbacks = new Map<number, () => void>()
  let sequence = 0
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => { callbacks.set(++sequence, callback); return sequence })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id))
  const wrapper = region(placement)
  expect(wrapper.find('button').exists()).toBe(false)
  expect(wrapper.attributes('data-media-reveal')).toBe('false')
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
  expect(wrapper.attributes('data-media-reveal')).toBe('true')
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
  const wrapper = mount(Region, { props: { layout: 'masonry', autoScrolling: true, placement, deferred: true } })
  expect(wrapper.find('button').exists()).toBe(false)
  expect(wrapper.attributes('data-media-reveal')).toBe('true')
  expect(callbacks.size).toBe(1)
  callbacks.get(1)!()
  await nextTick()
  expect(wrapper.get('button').text()).toBe('/image.jpg')
  await wrapper.setProps({ scrolling: true })
  expect(wrapper.find('button').exists()).toBe(true)
  wrapper.unmount()
})

it('reveals a ready preview with its deferred footer while an opted-out header stays available', async () => {
  let reveal: (() => void) | undefined
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => { reveal = callback; return 1 })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  const wrapper = mount(MediaCard, { props: {
    item, layout: 'masonry', index: 0, loadedCount: 1, mediaIndex: 0, total: 1,
    previewState: 'ready', entering: false, fetchPriority: 'high', scrolling: true,
    cardHeader: { component: Child, height: 30 },
    cardFooter: { component: Child, height: 40, deferMountDuringScroll: true },
  } })
  expect(wrapper.find('.media-card-header button').exists()).toBe(true)
  expect(wrapper.find('.media-card-footer button').exists()).toBe(false)
  expect(wrapper.get('img').classes()).not.toContain('media-preview--ready')
  await wrapper.setProps({ scrolling: false })
  reveal?.()
  await nextTick()
  expect(wrapper.find('.media-card-footer button').exists()).toBe(true)
  expect(wrapper.get('img').classes()).toContain('media-preview--ready')
  wrapper.unmount()
})
