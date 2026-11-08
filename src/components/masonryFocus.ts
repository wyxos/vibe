import type { VibeItemId } from '../types'

/** Restore the original source-card focus without scrolling a restored feed. */
export function focusMasonryCard(surface: HTMLElement | null, postId: VibeItemId, showFocusRing: boolean): void {
  const cards = surface?.querySelectorAll<HTMLElement>('.masonry-feed [data-post-id]') ?? []
  const card = Array.from(cards).find((candidate) => candidate.dataset.postId === String(postId))
  const target = card?.querySelector<HTMLElement>('.media-card-activator') ?? card
  if (!target) return
  target.classList.toggle('media-card-focus-silent', !showFocusRing)
  if (!showFocusRing) target.addEventListener('blur', () => target.classList.remove('media-card-focus-silent'), { once: true })
  target.focus({ preventScroll: true })
}
