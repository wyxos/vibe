
import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

const duration = 480
const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'
const cardSelector = '.masonry-item:not(.media-card--leaving, .media-card--preparing)'
const mediaClass = 'media-card-media'

function size(box: { width: number, height: number }): Keyframe {
  return { width: `${box.width}px`, height: `${box.height}px` }
}

function position(box: DOMRect, parent: DOMRect): Keyframe {
  return {
    ...size(box),
    left: `${box.left - parent.left}px`,
    top: `${box.top - parent.top}px`,
  }
}

function readCard(card: HTMLElement) {
  const content = card.querySelector<HTMLElement>('.media-card-content')
  if (!content) return
  return {
    card,
    content,
    box: content.getBoundingClientRect(),
    transform: getComputedStyle(card).transform,
    style: getComputedStyle(card),
    regions: Array.from(content.children, element => ({
      element,
      box: element.getBoundingClientRect(),
      media: element.classList.contains(mediaClass),
    })),
  }
}

type CardGeometry = NonNullable<ReturnType<typeof readCard>>

function animateCard(before: CardGeometry, after: CardGeometry, toList: boolean): Animation[] {
  const list = toList ? after : before
  const preview = list.regions.find(region => region.media)?.box
  const compact = size({
    width: Math.min(preview?.width ?? list.box.width, list.box.height),
    height: list.box.height,
  })
  const middle = toList ? 0.6 : 0.4

  function animate(element: Element, start: Keyframe, docked: Keyframe, end: Keyframe) {
    return element.animate([
      { ...start, easing: ease },
      { ...docked, offset: middle, easing: ease },
      end,
    ], duration)
  }

  const packed = { backgroundColor: 'transparent', overflow: 'visible', zIndex: 1 }
  const packedStart = { ...packed, transform: before.transform }
  const packedEnd = { ...packed, transform: after.transform }
  const surface = {
    backgroundColor: after.style.backgroundColor,
    borderRadius: after.style.borderRadius,
    overflow: 'hidden',
  }
  const running = [
    animate(after.card, packedStart, toList ? packedEnd : packedStart, packedEnd),
    animate(after.content, { ...surface, ...size(before.box) }, { ...surface, ...compact }, { ...surface, ...size(after.box) }),
  ]
  const overlay = { position: 'absolute', gridArea: 'auto', right: 'auto', bottom: 'auto', boxSizing: 'border-box' }
  for (const region of after.regions) {
    const original = before.regions.find(candidate => candidate.element === region.element)
    if (!original) continue
    const listBox = toList ? region.box : original.box
    const docked = region.media ? { left: '0px', top: '0px', ...compact }
      : { ...position(listBox, list.box), opacity: 0 }
    running.push(animate(
      region.element,
      { ...overlay, ...position(original.box, before.box), opacity: 1 },
      { ...overlay, ...docked },
      { ...overlay, ...position(region.box, after.box), opacity: 1 },
    ))
  }
  return running
}

export function useFeedLayoutResize(
  layout: Readonly<Ref<'masonry' | 'list'>>,
  gallery: Readonly<Ref<HTMLElement | null>>,
) {
  let animations: Animation[] = []
  function cancelResize() {
    animations.forEach(animation => animation.cancel())
    animations = []
  }

  watch(layout, async (mode, _, onCleanup) => {
    const section = gallery.value
    if (!section?.animate || section.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cancelResize()
      return
    }

    const before = Array.from(section.querySelectorAll<HTMLElement>(cardSelector), readCard)
      .filter((entry): entry is CardGeometry => !!entry?.box.width && entry.box.height > 0)
    let superseded = false
    onCleanup(() => { superseded = true })
    await nextTick()
    if (superseded) return

    cancelResize()
    const retained = before.filter(entry => entry.card.parentElement === section)
    // Replace the normal transform transition for this switch only.
    for (const { card } of retained) {
      for (const animation of card.getAnimations()) {
        if ('transitionProperty' in animation && animation.transitionProperty === 'transform') animation.cancel()
      }
    }
    const pairs = retained.flatMap(entry => {
      const after = readCard(entry.card)
      return after?.box.width && after.box.height ? [{ before: entry, after }] : []
    })
    const running = pairs.flatMap(pair => animateCard(pair.before, pair.after, mode === 'list'))
    animations = running
    void Promise.allSettled(running.map(animation => animation.finished)).then(() => {
      if (animations === running) animations = []
    })
  })

  onBeforeUnmount(cancelResize)
}
