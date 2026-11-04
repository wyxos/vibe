import { inject, nextTick, onBeforeUnmount, onMounted, provide, shallowRef, type InjectionKey } from 'vue'
import { useReelPointerMovement } from './useReelPointerMovement'

function createVisibility() {
  const hidden = shallowRef(false)
  const holds = new Set<symbol>()
  let deadline: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  const pointerMoved = useReelPointerMovement()

  function clearDeadline() {
    if (deadline !== undefined) clearTimeout(deadline)
    deadline = undefined
  }

  function ready() {
    clearDeadline()
    if (disposed || hidden.value || holds.size) return
    // A single inactivity deadline is necessary: there is no native browser
    // event for five seconds without input. Input resets it; this never polls.
    deadline = setTimeout(() => {
      deadline = undefined
      hidden.value = true
    }, 5000)
  }

  function reveal() {
    hidden.value = false
    ready()
  }

  function hold(token: symbol, revealControls = true) {
    holds.add(token)
    if (revealControls) reveal()
    else clearDeadline()
  }

  function release(token: symbol) {
    if (holds.delete(token)) ready()
  }

  onBeforeUnmount(() => { disposed = true; clearDeadline() })
  return { hidden, ready, reveal, hold, release, pointerMoved }
}

type Visibility = ReturnType<typeof createVisibility>
const key: InjectionKey<Visibility> = Symbol('reel-controls-visibility')

/** One visibility preference for the mounted reel, including virtualized items. */
export function provideReelControlsVisibility(element?: () => HTMLElement | null) {
  const visibility = createVisibility()
  provide(key, visibility)
  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return
    const gallery = element?.()
    const owner = gallery?.closest('.vibe-reel-overlay') ?? gallery?.closest('.vibe-surface') ?? gallery
    if (!owner?.contains(document.activeElement)) return
    const wasHidden = visibility.hidden.value
      && !owner.querySelector('.reel-media-controls-host .media-controls:not([inert])')
    visibility.reveal()
    if (!wasHidden) return
    // Vue must remove inert before native Tab traversal can reach the controls.
    event.preventDefault()
    void nextTick(() => {
      const controls = owner.querySelector('.media-controls:not([inert])')
      const targets = [...controls?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])') ?? []]
        .filter(target => target.getClientRects().length > 0 && getComputedStyle(target).visibility === 'visible')
      const target = event.shiftKey ? targets.at(-1) : targets[0]
      target?.focus({ preventScroll: true })
    })
  }
  onMounted(() => document.addEventListener('keydown', onKeydown, true))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown, true))
  return visibility
}

export function useReelControlsVisibility() {
  const inherited = inject(key, null)
  const visibility = inherited ?? createVisibility()
  if (!inherited) provide(key, visibility)
  const focus = Symbol('controls-focus')
  const pointer = Symbol('controls-pointer')
  const popover = Symbol('controls-popover')

  function onFocusIn() { visibility.hold(focus) }
  function onFocusOut(event: FocusEvent) {
    if (!(event.relatedTarget instanceof Node)
      || !(event.currentTarget as HTMLElement).contains(event.relatedTarget)) {
      visibility.release(focus)
    }
  }
  function onPointerUp() {
    visibility.release(pointer)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
  }
  function onPointerDown() {
    visibility.hold(pointer)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }
  function resetInteraction() {
    visibility.release(focus)
    visibility.release(popover)
    onPointerUp()
  }
  function onInteractionChange(open: boolean) {
    if (open) visibility.hold(popover)
    else visibility.release(popover)
  }
  onBeforeUnmount(resetInteraction)
  return { ...visibility, onFocusIn, onFocusOut, onPointerDown, onInteractionChange, resetInteraction }
}
