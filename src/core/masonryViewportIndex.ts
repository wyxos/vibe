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

function finalizeColumns(
  columns: Map<number, MasonryViewportIndexEntry[]>,
): MasonryViewportIndex {
  return {
    columns: [...columns.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, entries]) => entries.sort((left, right) => (
        left.top - right.top || left.index - right.index
      ))),
  }
}

function pushEntry(
  columns: Map<number, MasonryViewportIndexEntry[]>,
  item: MasonryPosition,
  index: number,
): void {
  const column = columns.get(item.x) ?? []
  column.push({
    bottom: item.y + item.height,
    index,
    top: item.y,
  })
  columns.set(item.x, column)
}

export function createMasonryViewportIndex(
  items: readonly MasonryPosition[],
  sourceIndices?: readonly number[],
): MasonryViewportIndex {
  const columns = new Map<number, MasonryViewportIndexEntry[]>()
  items.forEach((item, index) => {
    pushEntry(columns, item, sourceIndices?.[index] ?? index)
  })
  return finalizeColumns(columns)
}

export function continueMasonryViewportIndex(
  items: readonly MasonryPosition[],
  previous: MasonryViewportIndex,
  fromIndex: number,
  sourceIndices?: readonly number[],
): MasonryViewportIndex {
  if (fromIndex <= 0) return createMasonryViewportIndex(items, sourceIndices)

  const columns = new Map<number, MasonryViewportIndexEntry[]>()
  previous.columns.forEach((entries) => {
    entries.forEach((entry) => {
      if (entry.index >= fromIndex) return
      const item = items[entry.index]
      if (!item) return
      const column = columns.get(item.x) ?? []
      column.push(entry)
      columns.set(item.x, column)
    })
  })
  for (let index = fromIndex; index < items.length; index += 1) {
    pushEntry(columns, items[index]!, sourceIndices?.[index] ?? index)
  }
  return finalizeColumns(columns)
}

export function projectMasonryViewportIndex(
  items: readonly MasonryPosition[],
  retainedIndices: readonly number[],
  previous: MasonryViewportIndex,
  fromIndex: number,
): MasonryViewportIndex {
  if (fromIndex <= 0) {
    return createMasonryViewportIndex(
      retainedIndices.map((index) => items[index]!),
      retainedIndices,
    )
  }

  const columns = new Map<number, MasonryViewportIndexEntry[]>()
  previous.columns.forEach((entries) => {
    entries.forEach((entry) => {
      if (entry.index >= fromIndex) return
      const item = items[entry.index]
      if (!item) return
      const column = columns.get(item.x) ?? []
      column.push(entry)
      columns.set(item.x, column)
    })
  })
  retainedIndices.forEach((index) => {
    if (index < fromIndex) return
    pushEntry(columns, items[index]!, index)
  })
  return finalizeColumns(columns)
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
    if (entries[middle]!.bottom <= viewportTop) lower = middle + 1
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
      if (entry.top >= viewportBottom) break
      indices.push(entry.index)
    }
  })

  return {
    indices: indices.sort((left, right) => left - right),
    inspected,
  }
}
