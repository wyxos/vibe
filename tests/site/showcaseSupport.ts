import { expect, type Page } from '@playwright/test'

const noVisuals = process.env.VIBE_TEST_NO_VISUALS === '1'
const evidence = process.env.VIBE_SITE_REVIEW_DIR ?? 'test-results'
export async function capture(page: Page, name: string) {
  if (!noVisuals) await page.screenshot({ path: `${evidence}/${name}.png` })
}

export async function ready(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect.poll(async () => Number(await page.locator('[data-test=loaded-count]').textContent())).toBeGreaterThanOrEqual(18)
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.masonry-item img').first()).toBeVisible()
  await expect(page.locator('.masonry-item img').first()).toHaveJSProperty('complete', true)
  await expect(page.locator('.masonry-item img').first()).not.toHaveJSProperty('naturalWidth', 0)
  return errors
}
