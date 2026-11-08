import { expect, test, type Page } from '@playwright/test'
import type {} from '../browser/harness'
import type {} from '../browser/selectionHarness'

const selectedIds = [1, 2, 3, 117, 118, 119, 120]

async function open(page: Page, enabled = true) {
  await page.goto(`/?scenario=selection&chrome&implicitSelection&bottomSpace=240&${enabled ? 'clearBackground' : ''}`)
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('.masonry-item').first()).toBeVisible()
  await page.evaluate(async ids => {
    await window.__vibe.loadNext()
    await window.__vibe.loadNext()
    window.__vibe.setSelection(ids)
  }, selectedIds)
}

async function selection(page: Page) {
  return page.evaluate(() => window.__vibe.getSelection().selectedIds)
}

async function gap(page: Page) {
  return page.locator('.masonry').evaluate(element => {
    const bounds = element.getBoundingClientRect()
    for (let y = Math.max(1, bounds.top + 1); y < Math.min(innerHeight - 40, bounds.bottom); y += 4) {
      for (let x = bounds.left + 1; x < bounds.right; x += 4) {
        if (document.elementFromPoint(x, y) === element) return { x, y }
      }
    }
    throw new Error('No visible masonry gap')
  })
}

test('a plain gap click clears the full selection without invoking actions', async ({ page }) => {
  await open(page)
  await page.locator('.masonry-feed').evaluate(feed => { feed.scrollTop = feed.scrollHeight })
  await expect(page.locator('.masonry-item[data-post-id="1"]')).toHaveCount(0)
  const point = await gap(page)
  await page.mouse.click(point.x, point.y)
  await expect.poll(() => selection(page)).toEqual([])
  expect(await page.evaluate(() => window.__selectionHarness.batchCalls)).toEqual([])
  expect(await page.evaluate(() => window.__selectionHarness.reorderCalls)).toEqual([])
  await expect(page.getByRole('checkbox')).toHaveCount(0)
})

test('modified background clicks and card controls preserve selection; empty spacer clears it', async ({ page }) => {
  await open(page)
  const point = await gap(page)
  for (const modifiers of [['Alt'], ['Control'], ['Meta'], ['Shift']] as const) {
    await page.keyboard.down(modifiers[0])
    await page.mouse.click(point.x, point.y)
    await page.keyboard.up(modifiers[0])
    expect(await selection(page)).toEqual(selectedIds)
  }
  await page.mouse.click(point.x, point.y, { button: 'middle' })
  expect(await selection(page)).toEqual(selectedIds)
  await page.locator('.masonry-item[data-post-id="1"]').getByRole('button', { name: 'Like', exact: true }).click()
  expect(await selection(page)).toEqual(selectedIds)
  await page.getByRole('button', { name: 'Review selection', exact: true }).click()
  expect(await selection(page)).toEqual(selectedIds)
  await page.keyboard.press('Escape')
  await page.locator('.masonry-bottom-space').click()
  await expect.poll(() => selection(page)).toEqual([])
})

test('background clearing stays opt-in', async ({ page }) => {
  await open(page, false)
  const point = await gap(page)
  await page.mouse.click(point.x, point.y)
  await page.locator('.masonry-bottom-space').click()
  expect(await selection(page)).toEqual(selectedIds)
})

test('clearing empty space preserves an explicitly entered selection mode', async ({ page }) => {
  await page.goto('/?scenario=selection&clearBackground')
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
  await page.getByRole('button', { name: 'Select items', exact: true }).click()
  await page.evaluate(ids => window.__vibe.setSelection(ids), selectedIds)
  const point = await gap(page)
  await page.mouse.click(point.x, point.y)
  await expect.poll(() => selection(page)).toEqual([])
  await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible()
  expect(await page.getByRole('checkbox').count()).toBeGreaterThan(0)
})

test.describe('phone background selection', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  test('touch scrolling preserves selection and a spacer tap clears it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    await page.locator('.masonry-feed').evaluate(feed => { feed.scrollTop = feed.scrollHeight })
    expect(await selection(page)).toEqual(selectedIds)
    await page.locator('.masonry-bottom-space').tap()
    await expect.poll(() => selection(page)).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
})
