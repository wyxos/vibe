import { computed, inject, onBeforeUnmount, provide, shallowRef, watch, type InjectionKey } from 'vue'
import type { VibeCardRegion, VibeLayout } from '../types'

type Reveal = { visible: () => boolean; mount: () => void }
type ScheduleReveal = (reveal: Reveal) => () => void
const revealScheduler: InjectionKey<ScheduleReveal> = Symbol('card region reveal')
const CARDS_PER_FRAME = 4

function createRevealScheduler(): ScheduleReveal {
  const pending = new Set<Reveal>()
  let frame: number | undefined
  function flush() {
    frame = undefined
    const batch = [...pending].sort((left, right) => Number(right.visible()) - Number(left.visible()))
    for (const reveal of batch.slice(0, CARDS_PER_FRAME)) {
      pending.delete(reveal)
      reveal.mount()
    }
    if (pending.size) frame = requestAnimationFrame(flush)
  }
  return reveal => {
    pending.add(reveal)
    frame ??= requestAnimationFrame(flush)
    return () => {
      pending.delete(reveal)
      if (!pending.size && frame !== undefined) {
        cancelAnimationFrame(frame)
        frame = undefined
      }
    }
  }
}

export function provideCardRegionReveal() {
  provide(revealScheduler, createRevealScheduler())
}

export function useCardRegionReveal(props: {
  layout: VibeLayout
  cardHeader?: VibeCardRegion
  cardFooter?: VibeCardRegion
  scrolling?: boolean
  autoScrolling?: boolean
  inViewport?: boolean
}) {
  const schedule = inject(revealScheduler, createRevealScheduler, true)
  const deferred = computed(() => props.layout === 'masonry'
    && Boolean(props.cardHeader?.deferMountDuringScroll || props.cardFooter?.deferMountDuringScroll))
  const revealed = shallowRef(!deferred.value || (!props.scrolling && !props.autoScrolling))
  const coordinateMedia = props.scrolling === true
  const ready = computed(() => !deferred.value || revealed.value)
  let cancel: (() => void) | undefined
  const mount = () => { cancel = undefined; revealed.value = true }
  watch([deferred, () => props.scrolling, () => props.autoScrolling], ([defer, scrolling, autoScrolling]) => {
    cancel?.()
    cancel = undefined
    if (revealed.value) return
    if (!defer) { mount(); return }
    if (scrolling) return
    if (autoScrolling && typeof requestIdleCallback === 'function') {
      const handle = requestIdleCallback(mount)
      cancel = () => cancelIdleCallback(handle)
      return
    }
    // After manual scrolling, mount both regions in the same update as the
    // media reveal, with a few cards per frame so waiting for idle cannot starve them.
    cancel = schedule({ visible: () => props.inViewport === true, mount })
  }, { flush: 'sync', immediate: true })
  onBeforeUnmount(() => cancel?.())
  return { regionsReady: ready, canRevealMedia: computed(() => !coordinateMedia || ready.value) }
}
