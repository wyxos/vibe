import { describe, expect, it, vi } from 'vitest'

import { getVibeOccurrenceKey } from '@/components/viewer-core/itemIdentity'

import { mountUseDataSource } from '../helpers/mountUseDataSource'
import { createSimpleItem } from '../helpers/useDataSourceTestUtils'

describe('useDataSource current items handle', () => {
  it('exposes current visible items and resolves them by occurrence key', async () => {
    const resolve = vi.fn(async () => ({
      items: [
        createSimpleItem('1'),
        createSimpleItem('2'),
        createSimpleItem('3'),
      ],
      nextPage: null,
      previousPage: null,
    }))

    const source = await mountUseDataSource({
      resolve,
      pageSize: 3,
    })

    await source.flush()

    const visibleItems = source.api.getItems()
    const secondItem = visibleItems[1]!
    const secondOccurrenceKey = getVibeOccurrenceKey(secondItem)

    expect(visibleItems).toEqual(source.api.items.value)
    expect(visibleItems).not.toBe(source.api.items.value)
    expect(source.api.getItemByOccurrenceKey(secondOccurrenceKey)).toBe(secondItem)

    expect(source.api.remove('2').ids).toEqual(['2'])
    await source.flush()

    expect(source.api.getItems().map((item) => item.id)).toEqual(['1', '3'])
    expect(source.api.getItemByOccurrenceKey(secondOccurrenceKey)).toBeNull()

    source.unmount()
  })
})
