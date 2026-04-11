import { describe, expect, it } from 'vitest'

import { createDemoFeedStatusEntries } from '@/demo/feedStatus'

describe('createDemoFeedStatusEntries', () => {
  it('surfaces end-of-list in the status value when the feed is exhausted', () => {
    const entries = createDemoFeedStatusEntries({
      activeIndex: 24,
      currentCursor: '4',
      hasNextPage: false,
      hasPreviousPage: true,
      itemCount: 25,
      loadState: 'loaded',
      mode: 'dynamic',
      nextCursor: null,
      phase: 'idle',
      previousCursor: '3',
    }, {
      baseCursor: 4,
      labels: {
        current: 'Viewing',
        delay: 'Delay',
        fill: 'Fill',
        next: 'Next',
        previous: 'Previous',
        status: 'Status',
        total: 'Total',
      },
      mode: 'dynamic',
      pageSize: 25,
      testIdPrefix: 'dynamic-demo-status',
    })

    expect(entries.find((entry) => entry.key === 'status')?.value).toBe('dynamic · end of list')
    expect(entries.find((entry) => entry.key === 'next')?.value).toBe('N/A')
  })
})
