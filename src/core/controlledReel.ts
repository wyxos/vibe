import type { VibeItemId } from '../types'

export type VibeControlledReelDirection = 'next' | 'previous'

export interface VibeControlledReelItem {
  id: VibeItemId
  artwork?: string
  label?: string
}

/** A bounded projection of a host-owned queue. No full queue is required. */
export interface VibeControlledReelState {
  /** Change whenever source, order, membership or selection invalidates navigation. */
  revision: string | number
  current: VibeControlledReelItem | null
  previous?: VibeControlledReelItem | null
  next?: VibeControlledReelItem | null
  canPrevious: boolean
  canNext: boolean
  /** Zero-based position, when known. */
  position?: number
  total?: number
}

export interface VibeControlledReelRequest {
  direction: VibeControlledReelDirection
  snapshot: Readonly<VibeControlledReelState>
  signal: AbortSignal
}

export interface VibeControlledReelProps {
  state: VibeControlledReelState
  /** Commit through the host queue, then push state. false declines the intent. */
  onNavigate: (request: VibeControlledReelRequest) => boolean | void | Promise<boolean | void>
  label?: string
}

export interface VibeControlledReelSlotProps {
  item: VibeControlledReelItem | null
  pending: boolean
}

export interface VibeControlledReelExpose {
  /** The pushed host state, rather than this promise, acknowledges selection. */
  navigate: (direction: VibeControlledReelDirection) => Promise<void>
}

/** Settle on abort even if an obsolete host callback ignores its signal. */
export function waitForControlledReelNavigation(
  navigate: VibeControlledReelProps['onNavigate'],
  context: VibeControlledReelRequest,
): Promise<boolean | void> {
  const { signal } = context
  return new Promise((resolve, reject) => {
    const abort = () => resolve(false)
    signal.addEventListener('abort', abort, { once: true })
    const cleanup = () => signal.removeEventListener('abort', abort)
    Promise.resolve().then(() => signal.aborted ? false : navigate(context)).then(
      value => { cleanup(); resolve(value) },
      error => { cleanup(); reject(error) },
    )
    if (signal.aborted) { cleanup(); resolve(false) }
  })
}
