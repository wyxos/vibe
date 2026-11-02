import { computed, nextTick, onBeforeUnmount, shallowRef, watch } from 'vue'

interface CardVideoMotionOptions {
  enabled: () => boolean
  entering: () => boolean
  preparing: () => boolean
  leaving: () => boolean
  identity: () => string
}

/** Delay playback, independently of preview readiness, until card motion settles. */
export function useCardVideoMotion(options: CardVideoMotionOptions) {
  const element = shallowRef<HTMLElement | null>(null)
  const settling = shallowRef(false)
  let generation = 0
  let disposed = false
  const blocked = computed(() => options.enabled() && (
    options.entering() || options.preparing() || options.leaving() || settling.value
  ))

  async function waitForTransform(current: number): Promise<void> {
    await nextTick()
    if (disposed || current !== generation) return
    const card = element.value
    if (!card) { settling.value = false; return }
    const observed = new Set<Animation>()
    while (!disposed && current === generation && element.value === card) {
      // Flush the released entry style before asking for native transitions.
      void getComputedStyle(card).transform
      const animations = (card.getAnimations?.() ?? []).filter((animation) => (
        !observed.has(animation)
        && (animation.effect as KeyframeEffect | null)?.target === card
        && 'transitionProperty' in animation && animation.transitionProperty === 'transform'
      ))
      if (animations.length === 0) break
      animations.forEach((animation) => observed.add(animation))
      await Promise.allSettled(animations.map((animation) => animation.finished))
      await nextTick()
      // Cancellation can replace a transform; inspect its successor only after
      // the native completion event, without polling or a duration timer.
    }
    if (!disposed && current === generation) settling.value = false
  }

  watch([
    options.enabled, options.entering, options.preparing, options.leaving, options.identity,
  ], ([enabled, entering, preparing, leaving], previous) => {
    const current = ++generation
    if (!enabled || entering || preparing || leaving) {
      settling.value = false
      return
    }
    if (settling.value || (previous?.[0] && (previous[1] || previous[2] || previous[3]))) {
      settling.value = true
      void waitForTransform(current)
    }
  }, { immediate: true, flush: 'sync' })

  onBeforeUnmount(() => { disposed = true; generation++ })
  return { blocked, element }
}
