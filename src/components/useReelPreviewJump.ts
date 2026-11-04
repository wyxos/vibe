import { nextTick, onBeforeUnmount, shallowRef, type ShallowRef } from 'vue'
import { cancelReelScroll } from '../core/reelScrollTransition'

export function useReelPreviewJump(gallery: ShallowRef<HTMLElement | null>, activeIndex: ShallowRef<number>) {
  const layers = shallowRef<number[]>([])
  let animations: Animation[] = []
  let revision = 0

  function stop() {
    revision++
    for (const animation of animations) animation.cancel()
    animations = []
    layers.value = []
    gallery.value?.removeAttribute('data-preview-jump')
  }

  function card(index: number) {
    return gallery.value?.querySelector<HTMLElement>(`.reel-item[data-reel-index="${index}"]`)
  }

  async function jump(target: number, slide: boolean) {
    const element = gallery.value
    if (!element || target === activeIndex.value) return
    const source = activeIndex.value
    const height = element.clientHeight
    const viewportTop = element.getBoundingClientRect().top
    const positions = new Map<number, number>()
    if (slide && height > 0) {
      for (const index of layers.value.length ? layers.value : [source]) {
        const node = card(index)
        if (!node) continue
        const offset = node.getBoundingClientRect().top - viewportTop
        if (Math.abs(offset) < height) positions.set(index, offset)
      }
    }

    stop()
    cancelReelScroll(element)
    const request = revision
    const direction = Math.sign(positions.get(target) || target - source)
    if (positions.size) {
      if (!positions.has(target)) positions.set(target, direction * height)
      layers.value = [...positions.keys()]
    }
    element.setAttribute('data-preview-jump', '')
    activeIndex.value = target
    element.scrollTop = target * height
    await nextTick()
    if (request !== revision) return

    for (const [index, offset] of positions) {
      const node = card(index)
      if (!node?.animate) continue
      const end = index === target ? 0 : -direction * height
      animations.push(node.animate(
        [{ transform: `translateY(${offset}px)` }, { transform: `translateY(${end}px)` }],
        { duration: 300, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)', fill: 'both' },
      ))
    }
    await Promise.allSettled(animations.map(animation => animation.finished))
    if (request === revision) stop()
  }

  onBeforeUnmount(stop)
  return { layers, jump, stop }
}
