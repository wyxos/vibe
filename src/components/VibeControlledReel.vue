<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { transitionReelScroll, prefersReducedReelMotion } from '../core/reelScrollTransition'
import { waitForControlledReelNavigation } from '../core/controlledReel'
import { reelIndexAtScrollOffset } from '../core/reelViewport'
import type {
  VibeControlledReelDirection, VibeControlledReelProps, VibeControlledReelRequest,
  VibeControlledReelSlotProps,
} from '../core/controlledReel'

const props = withDefaults(defineProps<VibeControlledReelProps>(), { label: 'Media queue' })
const emit = defineEmits<{ navigationError: [error: unknown] }>()
defineSlots<{
  default(props: VibeControlledReelSlotProps): unknown
  previous?(props: VibeControlledReelSlotProps): unknown
  next?(props: VibeControlledReelSlotProps): unknown
}>()
const viewport = shallowRef<HTMLElement | null>(null)
const pending = shallowRef(false)
let request: AbortController | null = null
let observer: ResizeObserver | null = null
let disposed = false
let touching = false
let canceledTouch = false
const anchor = computed(() => props.state.current && props.state.canPrevious ? 1 : 0)
const navigationIdentity = [() => props.state.revision, () => props.state.current?.id,
  () => props.state.canPrevious, () => props.state.canNext]
const positionLabel = computed(() => {
  const { position, total } = props.state
  return position === undefined ? '' : `${position + 1}${total === undefined ? '' : ` of ${total}`}`
})

function center(): void {
  const element = viewport.value
  if (element) element.scrollTop = anchor.value * element.clientHeight
}

function invalidate(): void {
  // A native pan can remain active before it crosses the selection threshold.
  // Its remaining movement/inertia must not select from a replacement queue.
  if (touching) canceledTouch = true
  request?.abort()
  request = null
  pending.value = false
}

async function requestNavigation(direction: VibeControlledReelDirection, animate: boolean): Promise<void> {
  const element = viewport.value
  const state = props.state
  if (!element || disposed || pending.value || !state.current
    || !(direction === 'next' ? state.canNext : state.canPrevious)) return

  const controller = new AbortController()
  request = controller
  pending.value = true
  // Copy the bounded projection: later host mutation cannot change a captured intent.
  const snapshot = Object.freeze({
    ...state,
    current: Object.freeze({ ...state.current }),
    previous: state.previous ? Object.freeze({ ...state.previous }) : state.previous,
    next: state.next ? Object.freeze({ ...state.next }) : state.next,
  })
  const context: VibeControlledReelRequest = { direction, snapshot, signal: controller.signal }
  try {
    if (animate) await transitionReelScroll(element,
      (anchor.value + (direction === 'next' ? 1 : -1)) * element.clientHeight,
      prefersReducedReelMotion(), controller.signal)
    if (controller.signal.aborted) return
    // The callback alone never changes current. Only the host's next state can do that.
    await waitForControlledReelNavigation(props.onNavigate, context)
  } catch (error) {
    if (!controller.signal.aborted) emit('navigationError', error)
  } finally {
    if (request === controller) {
      await transitionReelScroll(element, anchor.value * element.clientHeight,
        prefersReducedReelMotion(), controller.signal)
      if (request === controller) {
        request = null
        pending.value = false
      }
    }
  }
}

function navigate(direction: VibeControlledReelDirection): Promise<void> {
  return requestNavigation(direction, true)
}

function onScroll(): void {
  const element = viewport.value
  if (canceledTouch) { center(); return }
  if (!element || pending.value || element.clientHeight <= 0) return
  const index = reelIndexAtScrollOffset(element.scrollTop, element.clientHeight,
    anchor.value + 1 + (props.state.canNext ? 1 : 0))
  if (index === anchor.value) return
  void requestNavigation(index > anchor.value ? 'next' : 'previous', false)
}

function beginTouch(): void {
  touching = true
  canceledTouch = false
}

function endTouch(): void {
  touching = false
  if (canceledTouch) center()
  // Retain suppression for native inertia until a new deliberate interaction.
}

function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  const target = event.target
  if (target instanceof HTMLElement && (target.isContentEditable
    || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A', 'VIDEO', 'AUDIO'].includes(target.tagName))) return
  const direction = event.key === 'ArrowDown' || event.key === 'PageDown' ? 'next'
    : event.key === 'ArrowUp' || event.key === 'PageUp' ? 'previous' : null
  if (!direction) return
  event.preventDefault()
  void navigate(direction)
}

watch(navigationIdentity, invalidate, { flush: 'sync' })
watch(navigationIdentity, center, { flush: 'post' })
onMounted(() => {
  center()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(center)
    if (viewport.value) observer.observe(viewport.value)
  }
})
onBeforeUnmount(() => {
  disposed = true
  request?.abort()
  request = null
  observer?.disconnect()
})
defineExpose({ navigate })
</script>

<template>
  <section
    ref="viewport"
    class="vibe-controlled-reel"
    :aria-label="label"
    :aria-busy="pending"
    :data-current-id="state.current?.id"
    :data-pending="pending || undefined"
    tabindex="0"
    @scroll.passive="onScroll"
    @touchstart.passive="beginTouch"
    @touchend.passive="endTouch"
    @touchcancel.passive="endTouch"
    @wheel.passive="!touching && (canceledTouch = false)"
    @keydown="onKeydown"
  >
    <div v-if="state.current && state.canPrevious" class="vibe-controlled-reel-frame" aria-hidden="true" inert>
      <slot name="previous" :item="state.previous ?? null" :pending="pending">
        <img v-if="state.previous?.artwork" :src="state.previous.artwork" alt="" draggable="false">
      </slot>
    </div>
    <!-- Always unkeyed: the host's one media node and Teleport target survive selection changes. -->
    <div class="vibe-controlled-reel-frame vibe-controlled-reel-current">
      <slot :item="state.current" :pending="pending" />
    </div>
    <div v-if="state.current && state.canNext" class="vibe-controlled-reel-frame" aria-hidden="true" inert>
      <slot name="next" :item="state.next ?? null" :pending="pending">
        <img v-if="state.next?.artwork" :src="state.next.artwork" alt="" draggable="false">
      </slot>
    </div>
    <span class="vibe-controlled-reel-status" aria-live="polite">{{ positionLabel }}</span>
  </section>
</template>
