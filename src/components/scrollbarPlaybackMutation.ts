export interface PlaybackMutation { target: HTMLElement; card: HTMLElement }

/** Comments have no boxes and do not participate in CSS child/empty selectors. */
export function scrollbarCommentMutation(record: MutationRecord): boolean {
  if (record.type !== 'childList' || !record.addedNodes || !record.removedNodes) return false
  let count = 0
  for (const nodes of [record.addedNodes, record.removedNodes]) for (let index = 0; index < nodes.length; index++) {
    if (nodes[index]?.nodeType !== Node.COMMENT_NODE) return false
    count++
  }
  return count > 0
}

/** Only built-in paint motion inside its own media mask can reuse extent. */
export function scrollbarMotionMask(target: Element, keys: Iterable<string>): HTMLElement | null {
  const shimmer = target.matches('span.media-loading-shimmer')
  const preview = target.matches('video.media-preview,img.media-preview,canvas.media-preview')
    && target.parentElement?.classList.contains('media-card-frame')
  if ((!shimmer && !preview) || !target.closest('.masonry-item.media-card')) return null
  const expected = shimmer ? 'a:media-loading-shimmer:' : 't:transform:'
  for (const key of keys) if (key !== expected) return null
  const mask = shimmer ? target.parentElement : target.closest<HTMLElement>('.media-card-media')
  return mask?.classList.contains(shimmer ? 'media-loading' : 'media-card-media') ? mask : null
}

/** Recognize paint-only candidates without reading computed styles or geometry. */
export function scrollbarPlaybackMutation(
  record: MutationRecord,
  element: HTMLElement,
  previousStyle: () => CSSStyleDeclaration,
): PlaybackMutation | null | false {
  if (record.type !== 'attributes' || !record.attributeName) return false
  const target = record.target
  if (!(target instanceof HTMLElement)) return false
  if (record.oldValue === target.getAttribute(record.attributeName)) return null
  const card = target.closest<HTMLElement>('.masonry-item.media-card')
  if (!card || !element.contains(card)) return false
  const seek = target instanceof HTMLInputElement && target.type === 'range'
    && target.classList.contains('media-control-seek') && target.closest('.media-controls')
  const opacity = target instanceof HTMLVideoElement && target.classList.contains('media-preview')
  if (!(seek && (record.attributeName === 'aria-valuetext' || record.attributeName === 'value'))) {
    if (record.attributeName !== 'style' || (!seek && !opacity)) return false
    const property = seek ? '--media-range-progress' : 'opacity'
    const before = previousStyle()
    before.cssText = record.oldValue ?? ''
    const unchanged = (style: CSSStyleDeclaration, other: CSSStyleDeclaration) => {
      for (let index = 0; index < style.length; index++) {
        const name = style[index]!
        if (name !== property && (style.getPropertyValue(name) !== other.getPropertyValue(name)
          || style.getPropertyPriority(name) !== other.getPropertyPriority(name))) return false
      }
      return true
    }
    if (!unchanged(before, target.style) || !unchanged(target.style, before)) return false
  }
  return { target, card }
}
