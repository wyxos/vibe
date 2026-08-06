import type {
  MasonryPosition,
  MasonryViewportOptions,
} from './masonry'

interface MasonryViewportIndexEntry {
  bottom: number
  index: number
  top: number
}

export interface MasonryViewportIndex {
  columns: readonly (readonly MasonryViewportIndexEntry[])[]
}

export interface MasonryViewportQuery {
  indices: number[]
  inspected: number
}

export function createMasonryViewportIndex(
  items: readonly MasonryPosition[],
  sourceIndices?: readonly number[],
): MasonryViewportIndex {
  const columns = new Map<number, MasonryViewportIndexEntry[]>()

  items.forEach((item, index) => {
    const column = columns.get(item.x) ?? []
    column.push({
      bottom: item.y + item.height,
      index: sourceIndices?.[index] ?? index,
      top: item.y,
    })
    columns.set(item.x, column)
  })

  return {
    columns: [...columns.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, entries]) => entries.sort((left, right) => (
        left.top - right.top || left.index - right.index
      ))),
  }
}

function firstIntersectingEntry(
  entries: readonly MasonryViewportIndexEntry[],
  viewportTop: number,
): { index: number, inspected: number } {
  let inspected = 0
  let lower = 0
  let upper = entries.length

  while (lower < upper) {
    const middle = Math.floor((lower + upper) / 2)
    inspected += 1
    if (entries[middle]!.bottom < viewportTop) lower = middle + 1
    else upper = middle
  }

  return { index: lower, inspected }
}

export function queryMasonryViewportIndex(
  index: MasonryViewportIndex,
  options: MasonryViewportOptions,
): MasonryViewportQuery {
  const overscan = Math.max(0, options.overscan)
  const viewportTop = options.scrollTop - overscan
  const viewportBottom = options.scrollTop
    + Math.max(0, options.viewportHeight)
    + overscan
  const indices: number[] = []
  let inspected = 0

  index.columns.forEach((entries) => {
    const first = firstIntersectingEntry(entries, viewportTop)
    inspected += first.inspected

    for (let entryIndex = first.index; entryIndex < entries.length; entryIndex += 1) {
      const entry = entries[entryIndex]!
      inspected += 1
      if (entry.top > viewportBottom) break
      indices.push(entry.index)
    }
  })

  return {
    indices: indices.sort((left, right) => left - right),
    inspected,
  }
}
