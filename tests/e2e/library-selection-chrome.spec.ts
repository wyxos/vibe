import { expect, test, type Page } from '@playwright/test'
import type {} from '../browser/harness'
import type {} from '../browser/selectionHarness'

async function open(page: Page, extra = '') {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`/?scenario=selection&chrome&implicitSelection&${extra}`)
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('.masonry-item').first()).toBeVisible()
  return errors
}

async function clickChrome(page: Page, id: number, placement: 'header' | 'footer' = 'header', touch = false) {
  const region = page.locator(`.masonry-item[data-post-id="${id}"] .media-card-${placement}`)
  const bounds = (await region.boundingBox())!
  await region[touch ? 'tap' : 'click']({ position: { x: bounds.width - 5, y: bounds.height / 2 } })
}

test('card chrome starts selection directly and reveals all checkboxes until the final selection clears', async ({ page }) => {
  const errors = await open(page)
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await expect(page.locator('.vibe-selection-toolbar')).toHaveCount(0)
  await clickChrome(page, 1)
  await expect(page.getByRole('checkbox', { name: 'Select Item 1', exact: true })).toBeChecked()
  const first = page.locator('.masonry-item[data-post-id="1"]')
  const header = (await first.locator('.media-card-header').boundingBox())!
  const checkbox = (await first.locator('.vibe-selection-check').boundingBox())!
  expect(checkbox.y).toBeGreaterThanOrEqual(header.y + header.height)
  expect(await page.getByRole('checkbox').count()).toBeGreaterThan(1)
  await expect(page.getByRole('button', { name: 'Select items', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Arrange items', exact: true })).toHaveCount(0)
  await expect(page.locator('.vibe-selection-toolbar')).toContainText('1 selected')
  await clickChrome(page, 2, 'footer')
  expect(await page.evaluate(() => window.__vibe.getSelection().selectedIds)).toEqual([1, 2])
  await clickChrome(page, 1)
  await clickChrome(page, 2, 'footer')
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await expect(page.locator('.vibe-selection-toolbar')).toHaveCount(0)
  await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('consumer controls, media activation, modified clicks and text selection keep their actions', async ({ page }) => {
  await open(page)
  const first = page.locator('.masonry-item[data-post-id="1"]')
  await first.getByRole('button', { name: 'Information 1', exact: true }).click()
  await expect(first.locator('[data-test="custom-details"]')).toBeVisible()
  await first.getByRole('button', { name: 'Like', exact: true }).click()
  await expect(first.getByRole('button', { name: 'Like', exact: true })).toHaveAttribute('aria-pressed', 'true')
  for (const event of [{ button: 1 }, { button: 2 }, { button: 0, altKey: true }, { button: 0, shiftKey: true }]) {
    await first.locator('.media-card-header .test-chrome').dispatchEvent('click', event)
  }
  await first.locator('[data-test="custom-details"]').evaluate(element => {
    const range = document.createRange()
    range.selectNodeContents(element)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
  })
  await first.locator('[data-test="custom-details"]').dispatchEvent('click', { button: 0 })
  expect(await page.evaluate(() => window.__vibe.getSelection().count)).toBe(0)
  await page.evaluate(() => window.getSelection()?.removeAllRanges())
  await clickChrome(page, 1)
  await first.getByRole('button', { name: 'Information 1', exact: true }).click()
  await expect(first.locator('[data-test="custom-details"]')).toHaveCount(0)
  expect(await page.evaluate(() => window.__vibe.getSelection().selectedIds)).toEqual([1])
  await first.getByRole('button', { name: 'Open post 1', exact: true }).click()
  await expect(page.locator('.vibe-reel-overlay')).toBeVisible()
  expect(await page.evaluate(() => window.__vibe.getSelection().selectedIds)).toEqual([1])
  await page.keyboard.press('Escape')
  await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
})

test('headless card selection persists across pagination and sends every selected post to the consumer', async ({ page }) => {
  await open(page, 'hideSelectionToolbar')
  const geometry = () => page.locator('.masonry-item').evaluateAll(cards => cards.slice(0, 8).map(card => {
    const rect = card.getBoundingClientRect()
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
  }))
  const initial = await geometry()
  for (const id of [1, 2, 3]) await clickChrome(page, id)
  expect(await geometry()).toEqual(initial)
  await expect(page.locator('.vibe-selection-toolbar')).toHaveCount(0)
  await page.evaluate(async () => { await window.__vibe.loadNext(); await window.__vibe.loadNext() })
  await page.locator('.masonry-feed').evaluate(feed => { feed.scrollTop = feed.scrollHeight })
  for (const id of [117, 118, 119, 120]) await clickChrome(page, id, 'footer')
  await expect(page.locator('.masonry-item[data-post-id="1"]')).toHaveCount(0)
  await page.evaluate(() => window.__vibe.runSelectionAction('collect'))
  expect(await page.evaluate(() => window.__selectionHarness.batchCalls)).toEqual([[1, 2, 3, 117, 118, 119, 120]])
  await page.locator('.masonry-feed').evaluate(feed => { feed.scrollTop = 0 })
  for (const id of [1, 2, 3]) await expect(page.getByRole('checkbox', { name: `Select Item ${id}`, exact: true })).toBeChecked()
})

test.describe('phone chrome selection', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  for (const reducedMotion of ['no-preference', 'reduce'] as const) test(`phone keyboard selection and touch chrome fit (${reducedMotion})`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion })
  const errors = await open(page, 'hideSelectionToolbar')
  const start = page.getByRole('button', { name: 'Select Item 1', exact: true })
  await start.focus()
  await page.keyboard.press('Enter')
  const checkbox = page.getByRole('checkbox', { name: 'Select Item 1', exact: true })
  await expect(checkbox).toBeChecked()
  await expect(checkbox).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await clickChrome(page, 1, 'footer', true)
  await expect(page.getByRole('checkbox', { name: 'Select Item 1', exact: true })).toBeChecked()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
})
})
