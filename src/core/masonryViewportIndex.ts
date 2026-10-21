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

interface AppendColumn {
  column: number
  top: number
  bottom: number
}

interface AppendSnapshot {
  count: number
  width: number | undefined
  columns: ReadonlyMap<number, AppendColumn>
}

// Metadata belongs to an immutable index, not mutable caller-owned positions.
// Custom source-index projections keep the existing general continuation path.
const appendSnapshots = new WeakMap<MasonryViewportIndex, AppendSnapshot>()

export interface MasonryViewportQuery {
  indices: number[]
  inspected: number
}

function finalizeColumns(
  columns: Map<number, MasonryViewportIndexEntry[]>,
  count?: number,
  width?: number,
): MasonryViewportIndex {
  const ordered = [...columns.entries()].sort(([left], [right]) => left - right)
  const index = {
    columns: ordered.map(([, entries]) => entries.sort((left, right) => (
      left.top - right.top || left.index - right.index
    ))),
  }
  if (count !== undefined) {
    appendSnapshots.set(index, { count, width,
      columns: new Map(ordered.map(([x, entries], column) => {
        const last = entries[entries.length - 1]!
        return [x, { column, top: last.top, bottom: last.bottom }]
      })),
    })
  }
  return index
}

function appendViewportIndex(
  items: readonly MasonryPosition[],
  previous: MasonryViewportIndex,
  fromIndex: number,
  sourceIndices?: readonly number[],
): MasonryViewportIndex | null {
  const snapshot = sourceIndices === undefined ? appendSnapshots.get(previous) : undefined
  if (!snapshot || snapshot.count !== fromIndex || items.length < fromIndex) return null
  if (items.length === fromIndex) return previous

  const columns = new Map(snapshot.columns)
  const additions = new Map<number, MasonryViewportIndexEntry[]>()
  for (let index = fromIndex; index < items.length; index += 1) {
    const item = items[index]!
    const column = columns.get(item.x)
    const top = item.y
    const bottom = top + item.height
    // A new grid or out-of-order tail needs the general builder.
    // Packed masonry appends advance both bounds in each existing column.
    if (!column || item.width !== snapshot.width || top < column.top || bottom < column.bottom) return null
    const entries = additions.get(column.column) ?? []
    entries.push({ index, top, bottom })
    additions.set(column.column, entries)
    columns.set(item.x, { column: column.column, top, bottom })
  }

  const nextColumns = previous.columns.slice()
  for (const [column, entries] of additions) {
    // Copy only changed column arrays. Retained entries/geometry are not read
    // or sorted, and older index snapshots keep their original arrays.
    nextColumns[column] = [...previous.columns[column]!, ...entries]
  }
  const next = { columns: nextColumns }
  appendSnapshots.set(next, { count: items.length, width: snapshot.width, columns })
  return next
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
  return finalizeColumns(columns, sourceIndices === undefined ? items.length : undefined, items[0]?.width)
}

export function continueMasonryViewportIndex(
  items: readonly MasonryPosition[],
  previous: MasonryViewportIndex,
  fromIndex: number,
  sourceIndices?: readonly number[],
): MasonryViewportIndex {
  if (fromIndex <= 0) return createMasonryViewportIndex(items, sourceIndices)

  const appended = appendViewportIndex(items, previous, fromIndex, sourceIndices)
  if (appended) return appended

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
  return finalizeColumns(columns, sourceIndices === undefined ? items.length : undefined, items[0]?.width)
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
