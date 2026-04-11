import type { VibeViewerItem } from '../viewer'
import type { VibeLoadPhase } from './removalState'

export const DEFAULT_PAGE_SIZE = 25
export const PREFETCH_OFFSET = 3
export const INITIAL_CURSOR_KEY = '__vibe_initial_cursor__'

export type ResolveFn = (params: {
  cursor: string | null
  pageSize: number
  signal?: AbortSignal
}) => Promise<{
  items: VibeViewerItem[]
  nextPage: string | null
  previousPage?: string | null
}>

export type VibeAutoDirection = 'backward' | 'forward'

export function isActiveLoadPhase(phase: VibeLoadPhase) {
  return phase === 'filling' || phase === 'initializing' || phase === 'loading' || phase === 'refreshing'
}

export function normalizePageSize(value: number | undefined) {
  if (!value || !Number.isFinite(value) || value < 1) {
    return DEFAULT_PAGE_SIZE
  }

  return Math.floor(value)
}

export function getCursorKey(cursor: string | null) {
  return cursor ?? INITIAL_CURSOR_KEY
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
