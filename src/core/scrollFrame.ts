export interface ScrollFrameContext {
  position(element: HTMLElement): number
  extent(element: HTMLElement): { contentSize: number; viewportSize: number }
  written(element: HTMLElement, position: number): void
}
interface Commit { write?: () => void; publish?: () => void }
type Read = (timestamp: number, context: ScrollFrameContext) => Commit | void
interface Job { read: Read; cancelled: boolean }
const jobs = new Map<number, Job>()
const pending = new Map<number, Job>()
const writers = new WeakMap<HTMLElement, Set<object>>()
let nextId = 0
let requested: number | null = null
let flushing = false

export function claimScrollFrameWriter(element: HTMLElement): () => void {
  const token = {}
  let owners = writers.get(element)
  if (!owners) { owners = new Set(); writers.set(element, owners) }
  owners.add(token)
  let active = true
  return () => {
    if (!active) return
    active = false
    owners.delete(token)
    if (!owners.size && writers.get(element) === owners) writers.delete(element)
  }
}
export const hasScrollFrameWriter = (element: HTMLElement) => !!writers.get(element)?.size

type Sizes = { contentSize: number; trackSize: number; viewportSize: number }
/** Capture size reads now; resolve position after an optional exact native write. */
export function readScrollFrameGeometry(element: HTMLElement, track: HTMLElement, sizes: Sizes | null,
  minimumThumbSize: number, frame?: ScrollFrameContext) {
  if (!sizes) {
    const extent = frame?.extent(element)
    sizes = { contentSize: extent?.contentSize ?? element.scrollHeight,
      trackSize: track.clientHeight, viewportSize: extent?.viewportSize ?? element.clientHeight }
  }
  const snapshot = sizes
  const position = frame?.position(element) ?? element.scrollTop
  return { sizes, sample: () => {
    const actual = frame?.position(element) ?? position
    return { geometry: calculateScrollbarGeometry({ ...snapshot, minimumThumbSize, scrollPosition: actual }), position: actual }
  } }
}

function context(): ScrollFrameContext {
  const positions = new Map<HTMLElement, number>()
  const extents = new Map<HTMLElement, { contentSize: number; viewportSize: number }>()
  return {
    position(element) {
      if (!positions.has(element)) positions.set(element, element.scrollTop)
      return positions.get(element)!
    },
    extent(element) {
      let value = extents.get(element)
      if (!value) {
        value = { contentSize: element.scrollHeight, viewportSize: element.clientHeight }
        extents.set(element, value)
      }
      return value
    },
    written(element, position) { positions.set(element, position) },
  }
}

function schedule(): void {
  if (requested !== null || flushing || !pending.size || typeof requestAnimationFrame !== 'function') return
  requested = -1
  const handle = requestAnimationFrame(flush)
  if (requested !== null) requested = handle
}

function flush(timestamp: number): void {
  requested = null
  flushing = true
  const batch = [...pending.entries()]
  pending.clear()
  const commits: Array<{ job: Job; commit: Commit; failed: boolean }> = []
  const errors: unknown[] = []
  const frame = context()
  try {
    for (const [, job] of batch) {
      if (job.cancelled) continue
      try {
        const commit = job.read(timestamp, frame)
        if (commit) commits.push({ job, commit, failed: false })
      } catch (error) { errors.push(error) }
    }
    for (const work of commits) {
      if (work.job.cancelled) continue
      try { work.commit.write?.() } catch (error) { work.failed = true; errors.push(error) }
    }
    for (const work of commits) {
      if (work.job.cancelled || work.failed) continue
      try { work.commit.publish?.() } catch (error) { errors.push(error) }
    }
  } finally {
    for (const [id] of batch) jobs.delete(id)
    flushing = false
    schedule()
  }
  if (errors.length === 1) throw errors[0]
  if (errors.length) throw new AggregateError(errors, 'Vibe scroll frame failed.')
}

/** Share a browser callback, never a DOM-write phase, between independent owners. */
export function requestScrollFrame(read: Read): number {
  if (typeof requestAnimationFrame !== 'function') throw new Error('Vibe scroll frames require requestAnimationFrame.')
  const id = ++nextId
  const job = { read, cancelled: false }
  jobs.set(id, job); pending.set(id, job)
  schedule()
  return id
}

export function cancelScrollFrame(id: number): void {
  const job = jobs.get(id)
  if (job) job.cancelled = true
  jobs.delete(id); pending.delete(id)
  if (!pending.size && requested !== null) {
    cancelAnimationFrame(requested)
    requested = null
  }
}
import { calculateScrollbarGeometry, type ScrollbarGeometry } from './scrollbar'

export const emptyScrollFrameGeometry: ScrollbarGeometry = {
  maximumScrollPosition: 0,
  scrollable: false,
  thumbOffset: 0,
  thumbSize: 0,
  thumbTravel: 0,
}

