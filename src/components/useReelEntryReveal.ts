import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, watch, type Ref } from 'vue'
import { mediaAssetAt } from '../core/mediaAsset'
import type { VibeRuntimeState } from '../core/runtime'
import type { VibeItemId } from '../types'

/** Stage the existing masonry viewer slide without changing standalone reels. */
export function useReelEntryReveal(
  state: VibeRuntimeState,
  overlay: Ref<HTMLElement | null>,
) {
  const phase = shallowRef<'waiting' | 'revealing' | 'ready'>('waiting')
  const motion = typeof matchMedia === 'function'
    ? matchMedia('(prefers-reduced-motion: reduce)') : null
  let slideDone = false
  let settledKey: string | null = null
  const activeKey = computed(() => {
    const item = state.items.find(item => item.postId === state.activeReelPostId)
    if (!item) return null
    const index = state.mediaIndices.get(item.postId) ?? 0
    const asset = mediaAssetAt(item, index)
    return JSON.stringify([item.postId, index, asset.src, asset.type])
  })

  function sync() {
    if (state.reelOrigin !== 'masonry' || !slideDone || phase.value !== 'waiting') return
    if (activeKey.value === null || settledKey !== activeKey.value) return
    const main = overlay.value?.querySelector<HTMLElement>('.reel-layout-main')
    if (!main) return
    // Establish the hidden starting style before revealing cached media. Native
    // transition events, not guessed timers or frame counts, finish the reveal.
    void getComputedStyle(main).opacity
    phase.value = motion?.matches ? 'ready' : 'revealing'
  }

  function markSettled(postId: VibeItemId, mediaIndex: number) {
    if (state.reelOrigin !== 'masonry' || postId !== state.activeReelPostId
      || mediaIndex !== (state.mediaIndices.get(postId) ?? 0)) return
    // Each opening waits for the mounted card's native readiness/error event.
    // A post/index cache alone can describe an older URL after source repair.
    settledKey = activeKey.value
    void nextTick(sync)
  }

  function finishSlide() {
    slideDone = true
    sync()
  }

  function finishFade(event: TransitionEvent) {
    if (event.target instanceof HTMLElement && event.target.matches('.reel-layout-main')
      && event.propertyName === 'opacity' && phase.value === 'revealing') phase.value = 'ready'
  }

  function motionChanged() {
    if (motion?.matches && phase.value === 'revealing') phase.value = 'ready'
  }

  watch(() => state.reelOrigin, (origin) => {
    if (origin === 'masonry') {
      slideDone = false
      settledKey = null
      phase.value = 'waiting'
    }
  }, { flush: 'sync' })
  watch(activeKey, () => {
    settledKey = null
    if (phase.value === 'revealing') phase.value = 'waiting'
  }, { flush: 'sync' })
  onMounted(() => motion?.addEventListener('change', motionChanged))
  onBeforeUnmount(() => motion?.removeEventListener('change', motionChanged))

  return { phase, finishSlide, finishFade, markSettled }
}
