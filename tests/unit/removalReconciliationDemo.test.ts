import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import {
  createRemovalReconciliationDemoServer,
  RECONCILIATION_DEMO_PAGE_SIZE,
} from '@/demo/removalReconciliationServer'
import { createDemoRouter } from '@/router'

function request(cursor: string | null) {
  return { cursor, signal: new AbortController().signal }
}

describe('capacity-aware reconciliation demo provider', () => {
  it('is available from the dedicated demo route', () => {
    const router = createDemoRouter(createMemoryHistory())
    const route = router.resolve('/demos/item-removal-reconciliation')
    expect(route.name).toBe('demo-item-removal-reconciliation')
    expect(route.matched.at(-1)?.components?.default).toBeTruthy()
  })

  it('provides a direct branch with three full pages', async () => {
    const server = createRemovalReconciliationDemoServer(0)
    server.reset('full')
    const pages = await Promise.all([null, 'p2', 'p3'].map((cursor) => (
      server.loadPage(request(cursor))
    )))
    expect(pages.map(({ items }) => items.length)).toEqual([20, 20, 20])
    expect(pages.every(({ items }) => items.length === RECONCILIATION_DEMO_PAGE_SIZE)).toBe(true)
  })

  it('starts with an 18-item page and later exposes new identities across replay pages', async () => {
    const server = createRemovalReconciliationDemoServer(0)
    server.reset('variation')
    const baseline = []
    for (const cursor of [null, 'p2', 'p3']) baseline.push(await server.loadPage(request(cursor)))
    expect(baseline.map(({ items }) => items.length)).toEqual([20, 18, 20])

    server.publishResults()
    const replay = []
    for (const cursor of [null, 'p2', 'p3']) replay.push(await server.loadPage(request(cursor)))
    const newIds = replay.flatMap(({ items }) => items.map(({ postId }) => Number(postId)))
      .filter((id) => id >= 101)
    expect(replay.map(({ items }) => items.length)).toEqual([20, 20, 20])
    expect(newIds).toHaveLength(20)
  })

  it('fails one request without corrupting its retry', async () => {
    const server = createRemovalReconciliationDemoServer(0)
    server.failNextRequest()
    await expect(server.loadPage(request(null))).rejects.toThrow('Simulated provider failure')
    await expect(server.loadPage(request(null))).resolves.toMatchObject({ next: 'p2', total: 100 })
    expect(server.getRequests().map(({ status }) => status)).toEqual(['failed', 'succeeded'])
  })
})
