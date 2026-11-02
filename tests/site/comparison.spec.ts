import { expect, test, type Page } from '@playwright/test'

const evidence = process.env.VIBE_SITE_REVIEW_DIR

async function capture(page: Page, name: string) {
  if (evidence && process.env.VIBE_TEST_NO_VISUALS !== '1') {
    await page.screenshot({ path: `${evidence}/${name}.png` })
  }
}

test('local version links use the same showcase controls and switch the selected variant', async ({ page }) => {
  await page.goto('/?demo=v2')
  const versions = page.getByRole('navigation', { name: 'Demo version', exact: true })
  await expect(page.locator('.showcase-page')).toHaveAttribute('data-demo-variant', 'v2')
  await expect(versions.getByRole('link', { name: 'V2', exact: true })).toHaveAttribute('aria-current', 'page')
  expect(await page.locator('.filter-tabs button').allTextContents()).toEqual(['All media', 'Images', 'Motion', 'Sound'])
  await expect(page.getByRole('button', { name: 'Restart demo', exact: true })).toBeVisible()
  await expect(page.locator('[data-test=auto-scroll], [data-test=layout-reel]')).toHaveCount(0)
  await versions.getByRole('link', { name: 'V1', exact: true }).click()
  await expect(page.locator('.showcase-page')).toHaveAttribute('data-demo-variant', 'v1')
  await expect(versions.getByRole('link', { name: 'V1', exact: true })).toHaveAttribute('aria-current', 'page')
  await versions.getByRole('link', { name: 'Compare', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Vibe comparison', exact: true })).toBeVisible()
})

for (const viewport of [{ width: 1440, height: 960 }, { width: 390, height: 844 }]) {
  test(`comparison has equal, bounded real demo panels at ${viewport.width}px`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: viewport.width === 390 ? 'reduce' : 'no-preference' })
    await page.goto('/?compare=1')
    await expect(page.getByRole('heading', { name: 'Vibe comparison', exact: true })).toBeVisible()
    await expect(page.getByText('Side-by-side view runs both feeds; compare performance individually.')).toBeVisible()
    for (const [id, title] of [['v1', 'V1 Current'], ['v2', 'V2 Experimental']]) {
      const selector = `iframe[title="${title} demo"]`
      await expect(page.locator(selector)).toHaveAttribute('src', `?demo=${id}&embedded=1`)
      const demo = page.frameLocator(selector)
      await expect(demo.locator('.showcase-page')).toHaveAttribute('data-demo-variant', id!)
      await expect(demo.locator('.masonry-item').first()).toBeVisible()
      await expect(demo.getByRole('navigation', { name: 'Demo version', exact: true })).toHaveCount(0)
      await expect(demo.getByRole('button', { name: 'Restart demo', exact: true })).toBeVisible()
      await expect(demo.locator('.masonry-item img').first()).toHaveClass(/media-preview--ready/)
      await expect(demo.locator('.masonry')).toHaveCSS('opacity', '1')
      await demo.locator('.masonry').evaluate(async () => {
        await Promise.all(document.getAnimations().filter((animation) => animation instanceof CSSTransition)
          .map((animation) => animation.finished.catch(() => {})))
      })
    }
    const panels = page.locator('.comparison-panel')
    const first = (await panels.nth(0).boundingBox())!
    const second = (await panels.nth(1).boundingBox())!
    expect(Math.abs(first.width - second.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(first.height - second.height)).toBeLessThanOrEqual(1)
    if (viewport.width > 760) {
      expect(first.y).toBe(second.y)
      expect(second.x).toBeGreaterThanOrEqual(first.x + first.width)
    } else {
      expect(first.x).toBe(second.x)
      expect(second.y).toBeGreaterThanOrEqual(first.y + first.height)
    }
    expect(await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })))
      .toEqual({ width: viewport.width, height: viewport.height })
    const openV1 = page.getByRole('link', { name: 'Open V1 full width', exact: true })
    await expect(openV1).toHaveAttribute('href', '?demo=v1')
    await expect(page.getByRole('link', { name: 'Open V2 full width', exact: true })).toHaveAttribute('href', '?demo=v2')
    await openV1.focus()
    await expect(openV1).toBeFocused()
    await capture(page, `comparison-${viewport.width}`)
    expect(errors).toEqual([])
  })
}

test('embedded local demos suppress only the comparison navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?demo=v2&embedded=1')
  await expect(page.locator('.showcase-page')).toHaveAttribute('data-demo-variant', 'v2')
  await expect(page.getByRole('navigation', { name: 'Demo version', exact: true })).toHaveCount(0)
  await expect(page.locator('[data-test=filter-all]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Restart demo', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.goto('/?demo=v2')
  const versions = page.getByRole('navigation', { name: 'Demo version', exact: true })
  await expect(versions).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  for (const link of await versions.getByRole('link').all()) {
    const bounds = (await link.boundingBox())!
    expect(bounds.width).toBeGreaterThanOrEqual(44)
    expect(bounds.height).toBeGreaterThanOrEqual(44)
  }
})
