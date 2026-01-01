import { describe, expect, it } from 'vitest'
import { fetchPage } from '@/demo/fakeServer'

describe('fakeServer.fetchPage', () => {
  it('returns only { items, nextPage }', async () => {
    const result = await fetchPage(1)

    expect(Object.keys(result).sort()).toEqual(['items', 'nextPage'])
    expect(Array.isArray(result.items)).toBe(true)
    expect(result.items).toHaveLength(20)

    const [first] = result.items
    expect(first).toMatchObject({
      id: expect.any(String),
      type: expect.any(String),
      reaction: null,
      width: expect.any(Number),
      height: expect.any(Number),
      original: expect.any(String),
      preview: expect.any(String),
    })
  })

  it('accepts a numeric string page token', async () => {
    const result = await fetchPage('1')
    expect(result.items).toHaveLength(20)
  })

  it('returns nextPage token that may be number or string', async () => {
    const result = await fetchPage(1)
    expect([typeof result.nextPage, result.nextPage]).toSatisfy((value) => {
      const [t, v] = value as [string, unknown]
      return v === null || t === 'number' || t === 'string'
    })
  })

  it('throws on out-of-range page', async () => {
    await expect(fetchPage(0)).rejects.toThrow(/out of range/i)
    await expect(fetchPage(101)).rejects.toThrow(/out of range/i)
  })

  it('throws on non-number-like page token', async () => {
    await expect(fetchPage('nope')).rejects.toThrow(/number-like/i)
  })
})
