import type { CSSProperties } from 'vue'

interface Geometry { width: number, height: number, x: number, y: number }
interface CachedStyle extends Geometry { delay: number, style: CSSProperties }

/** Styles live only for the virtualized mounted window, never the full feed. */
export function createMasonryItemStyleCache() {
  const styles = new Map<number, CachedStyle>()
  return {
    retain(indices: readonly number[]): void {
      const mounted = new Set(indices)
      for (const index of styles.keys()) if (!mounted.has(index)) styles.delete(index)
    },
    get(index: number, geometry: Geometry, entryOffset: number, delay: number): CSSProperties {
      const { width, height, x } = geometry
      const y = geometry.y + entryOffset
      const previous = styles.get(index)
      if (previous && previous.width === width && previous.height === height
        && previous.x === x && previous.y === y && previous.delay === delay) return previous.style
      const style: CSSProperties = {
        '--masonry-entry-delay': `${delay}ms`,
        width: `${width}px`, height: `${height}px`,
        transform: `translate3d(${x}px, ${y}px, 0)`,
      }
      styles.set(index, { width, height, x, y, delay, style })
      return style
    },
  }
}
