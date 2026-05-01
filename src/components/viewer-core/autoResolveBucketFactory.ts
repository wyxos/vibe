import type { VibeViewerItem } from '../viewer'
import { type VibeAutoBucket } from './autoBuckets'
import { createAutoResolveBucket } from './autoResolveState'

export interface AutoResolveBucketInput {
  cursor: string | null
  nextCursor: string | null
  nextCursorExhausted?: boolean
  nextItems: VibeViewerItem[]
  previousCursor: string | null
  previousItems: VibeViewerItem[]
}

export type CreateAutoResolveBucket = (options: AutoResolveBucketInput) => VibeAutoBucket

export function createAutoResolveBucketFactory(options: {
  getSequence: () => number
  setSequence: (sequence: number) => void
}): CreateAutoResolveBucket {
  return (bucketOptions) => {
    const created = createAutoResolveBucket({
      cursor: bucketOptions.cursor,
      nextCursor: bucketOptions.nextCursor,
      nextCursorExhausted: bucketOptions.nextCursorExhausted ?? false,
      nextItems: bucketOptions.nextItems,
      previousCursor: bucketOptions.previousCursor,
      previousItems: bucketOptions.previousItems,
      sequence: options.getSequence(),
    })

    options.setSequence(created.nextSequence)
    return created.bucket
  }
}
