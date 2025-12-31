import { expect, test } from '@playwright/test'

async function snapshotCardPositionsById(page) {
  return page.$$eval('[data-testid="item-card"]', (cards) => {
    const out = {}
    for (const card of cards) {
      const btn = card.querySelector('button[data-testid^="remove-"]')
      const tid = btn?.getAttribute('data-testid')
      if (!tid) continue
      const id = tid.slice('remove-'.length)
      const r = card.getBoundingClientRect()
      out[id] = { x: r.x, y: r.y }
    }
    return out
  })
}

function dist(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

test('loads next page when scrolling to bottom', async ({ page }) => {
  await page.goto('/#/')

  const scroller = page.getByTestId('items-scroll-container')

  await expect(page.getByText('Pages loaded: 1')).toBeVisible()

  // Scroll near bottom to trigger prefetch
  await scroller.evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })

  await expect(page.getByText('Pages loaded: 2')).toBeVisible()
})

test('animates remaining items when removing an item', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.goto('/#/')

  // Wait for initial items to render.
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="item-card"]').length >= 6)

  const idToRemove = await page.$eval('button[data-testid^="remove-"]', (el) => el.getAttribute('data-testid').slice('remove-'.length))
  const before = await snapshotCardPositionsById(page)

  await page.getByTestId(`remove-${idToRemove}`).click()

  // Give Vue/RAF a moment to apply FLIP invert.
  await page.waitForTimeout(30)
  const t0 = await snapshotCardPositionsById(page)

  // Mid-animation samples (two checkpoints to reduce flakiness).
  await page.waitForTimeout(60)
  const mid1 = await snapshotCardPositionsById(page)
  await page.waitForTimeout(100)
  const mid2 = await snapshotCardPositionsById(page)

  // End sample (ENTER_FROM_LEFT_MS=300) + buffer.
  await page.waitForTimeout(200)
  const end = await snapshotCardPositionsById(page)

  // Find a card that actually moved (other than the removed one).
  let movedId = null
  for (const [id, endPos] of Object.entries(end)) {
    if (id === idToRemove) continue
    const startPos = before[id]
    const midPos = mid1[id]
    if (!startPos || !midPos) continue
    if (dist(startPos, endPos) > 2) {
      movedId = id
      break
    }
  }

  expect(movedId, 'expected at least one remaining item to move after removal').toBeTruthy()

  const startPos = before[movedId]
  const mid1Pos = mid1[movedId]
  const mid2Pos = mid2[movedId]
  const endPos = end[movedId]

  const dSE = dist(startPos, endPos)

  // At least one midpoint should be between start and end (not a jump).
  expect(dSE).toBeGreaterThan(2)

  const midpoints = [mid1Pos, mid2Pos].filter(Boolean)
  const hasBetween = midpoints.some((p) => {
    const dSP = dist(startPos, p)
    const dPE = dist(p, endPos)
    return dSP > 0.5 && dPE > 0.5 && dSP < dSE && dPE < dSE
  })
  expect(hasBetween, 'expected a remaining item to occupy an intermediate position during the move transition').toBe(true)

  // Also ensure we aren't stuck at the initial layout post-click.
  // (t0 is typically close to start due to inverse offset).
  expect(dist(t0[movedId], endPos)).toBeGreaterThan(0.5)
})
