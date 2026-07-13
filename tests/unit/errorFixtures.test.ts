import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

interface FixtureItem {
  url: string
}

interface FixturePage {
  items: FixtureItem[]
}

describe('stored media error fixtures', () => {
  it('keeps one to three reproducible failures on every page', async () => {
    const representedStatuses = new Set<string>()

    for (let page = 1; page <= 10; page += 1) {
      const pageLabel = String(page).padStart(2, '0')
      const fixturePath = resolve(
        `public/data/civitai/images/page-${pageLabel}.json`,
      )
      const fixture = JSON.parse(await readFile(fixturePath, 'utf8')) as FixturePage
      const errorItems = fixture.items.filter((item) => item.url.startsWith('/demo-errors/'))

      expect(errorItems.length).toBeGreaterThanOrEqual(1)
      expect(errorItems.length).toBeLessThanOrEqual(3)

      errorItems.forEach((item) => {
        const status = item.url.match(/\/demo-errors\/(\d+)\//)?.[1]
        if (status) representedStatuses.add(status)
      })
    }

    expect([...representedStatuses].sort()).toEqual(['401', '403', '404', '419', '500'])
  })
})
