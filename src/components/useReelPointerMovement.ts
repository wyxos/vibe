import { inject, onBeforeUnmount, onMounted, provide, type InjectionKey } from 'vue'

function createPointerMovement() {
  let position = { x: 0, y: 0 }
  let previousEvent: PointerEvent | undefined
  let moved = false
  function record(event: PointerEvent) {
    if (event.pointerType === 'touch') return false
    if (event === previousEvent) return moved
    // Scrolling and DOM replacement can retarget a stationary pointer. Keep
    // coordinates from the feed-opening click as well as subsequent movement.
    moved = event.type === 'pointermove'
      && (event.clientX !== position.x || event.clientY !== position.y)
    position = { x: event.clientX, y: event.clientY }
    previousEvent = event
    return moved
  }
  onMounted(() => {
    document.addEventListener('pointermove', record, true)
    document.addEventListener('pointerdown', record, true)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('pointermove', record, true)
    document.removeEventListener('pointerdown', record, true)
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
