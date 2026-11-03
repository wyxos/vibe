import { inject, onBeforeUnmount, onMounted, provide, type InjectionKey } from 'vue'

function createPointerMovement() {
  let position = { x: 0, y: 0 }
  let previousEvent: PointerEvent | undefined
  let moved = false
  let wheelNavigation = false
  function onWheel() { wheelNavigation = true }
  function record(event: PointerEvent & { sourceCapabilities?: { firesTouchEvents: boolean } | null }) {
    if (event.pointerType === 'touch' || event.sourceCapabilities?.firesTouchEvents) return false
    if (event === previousEvent) return moved
    // Scrolling and DOM replacement can retarget a stationary pointer. Keep
    // coordinates from the feed-opening click as well as subsequent movement.
    const retargeted = wheelNavigation && event.movementX === 0 && event.movementY === 0
    moved = event.type === 'pointermove' && !retargeted
      && (event.clientX !== position.x || event.clientY !== position.y)
    if (moved || event.type === 'pointerdown') wheelNavigation = false
    position = { x: event.clientX, y: event.clientY }
    previousEvent = event
    return moved
  }
  onMounted(() => {
    document.addEventListener('pointermove', record, true)
    document.addEventListener('pointerdown', record, true)
    document.addEventListener('wheel', onWheel, { capture: true, passive: true })
  })
  onBeforeUnmount(() => {
    document.removeEventListener('pointermove', record, true)
    document.removeEventListener('pointerdown', record, true)
    document.removeEventListener('wheel', onWheel, true)
  })
  return record
}

const key: InjectionKey<ReturnType<typeof createPointerMovement>> = Symbol('reel-pointer-movement')

export function provideReelPointerMovement() {
  provide(key, createPointerMovement())
}

export function useReelPointerMovement() {
  return inject(key, null) ?? createPointerMovement()
}
