import { expect, type Page, test } from '@playwright/test'

type CardPos = { x: number; y: number }
type CardPosById = Record<string, CardPos>

async function snapshotCardPositionsById(page: Page): Promise<CardPosById> {
  return page.$$eval('[data-testid="item-card"]', (cards: Element[]) => {
    const out: Record<string, { x: number; y: number }> = {}
    for (const card of cards) {
      const btn = card.querySelector('button[data-testid^="remove-"]')
      const tid = btn?.getAttribute('data-testid')
      if (!tid) continue
      const id = tid.slice('remove-'.length)
      const r = (card as HTMLElement).getBoundingClientRect()
      out[id] = { x: r.x, y: r.y }
    }
    return out
  })
}

test('loads next page when scrolling to bottom', async ({ page }) => {
  await page.goto('/#/')

  const scroller = page.getByTestId('items-scroll-container')

  await expect(page.getByTestId('pages-loaded')).toBeVisible()
  await expect(page.getByTestId('pages-loaded')).toHaveText(/1/)

  // Scroll near bottom to trigger prefetch
  await scroller.evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })

  await expect(page.getByTestId('pages-loaded')).toHaveText(/2/)
})

test('animates remaining items when removing an item', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.goto('/#/')

  // Wait for initial items to render.
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="item-card"]').length >= 6
  )

  const idToRemove = await page.$eval('[data-testid="item-card"] button[data-testid^="remove-"]', (el) => {
    const tid = el.getAttribute('data-testid')
    if (!tid) throw new Error('Expected remove button to have data-testid')
    return tid.slice('remove-'.length)
  })
  const before = await snapshotCardPositionsById(page)

  await page.getByTestId(`remove-${idToRemove}`).click()

  // Assert that at least one remaining card has a transform transition applied.
  await page.waitForFunction(() => {
    const cards = Array.from(document.querySelectorAll('[data-testid="item-card"]')) as HTMLElement[]
    return cards.some((el) => (el.getAttribute('style') || '').includes('transition:'))
  })

  // Assert that at least one remaining card eventually moves to a new position.
  await page.waitForFunction(
    (snapshot) => {
      const cards = Array.from(document.querySelectorAll('[data-testid="item-card"]')) as HTMLElement[]
      for (const card of cards) {
        const btn = card.querySelector('button[data-testid^="remove-"]')
        const tid = btn?.getAttribute('data-testid')
        if (!tid) continue
        const id = tid.slice('remove-'.length)
        if (id === snapshot.idToRemove) continue
        const before = snapshot.before[id]
        if (!before) continue
        const r = card.getBoundingClientRect()
        const dx = r.x - before.x
        const dy = r.y - before.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d > 2) return true
      }
      return false
    },
    { before, idToRemove }
  )
})

test('cannot restore an item after it is forgotten (committed)', async ({ page }) => {
  await page.goto('/#/')

  await page.waitForFunction(
    () => Boolean((window as any).__vibeMasonry) && document.querySelectorAll('[data-testid="item-card"]').length > 0
  )

  const idToRemove = await page.$eval('[data-testid="item-card"] button[data-testid^="remove-"]', (el) => {
    const tid = el.getAttribute('data-testid')
    if (!tid) throw new Error('Expected remove button to have data-testid')
    return tid.slice('remove-'.length)
  })

  await page.getByTestId(`remove-${idToRemove}`).click()
  await expect(page.locator(`[data-testid="item-card"] button[data-testid="remove-${idToRemove}"]`)).toHaveCount(0)

  // Parent commits removal.
  await page.evaluate(async (id) => {
    await (window as any).__vibeMasonry?.forget?.(id)
  }, idToRemove)

  // Try to restore and undo; neither should bring it back.
  await page.evaluate(async (id) => {
    await (window as any).__vibeMasonry?.restore?.(id)
    await (window as any).__vibeMasonry?.undo?.()
  }, idToRemove)

  await expect(page.locator(`[data-testid="item-card"] button[data-testid="remove-${idToRemove}"]`)).toHaveCount(0)
})
