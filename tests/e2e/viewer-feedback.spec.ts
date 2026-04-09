import type { Locator } from '@playwright/test'

import { expect, gotoRoute, test } from './fixtures'

test('dynamic feed demo exposes retry UI after an initial load failure and recovers on retry', async ({ page }) => {
  await gotoRoute(page, '/demo/dynamic-feed?failPage=1&failCount=1')

  const listSurface = page.getByTestId('vibe-list-surface')
  const retryButton = page.getByRole('button', { name: 'Retry' })
  const progress = listSurface.getByTestId('vibe-pagination')
  const statusBar = page.getByTestId('dynamic-demo-status-bar')

  await expect(retryButton).toBeVisible({ timeout: 15_000 })

  await retryButton.click()

  await expect(retryButton).toHaveCount(0)
  await expect(progress).toHaveText('1 / 25', { timeout: 15_000 })
  await expect(statusBar.getByTestId('dynamic-demo-status-current')).toContainText('1')
  await expect(statusBar.getByTestId('dynamic-demo-status-next')).toContainText('2')
  await expect(statusBar.getByTestId('dynamic-demo-status-previous')).toContainText('N/A')
})

test('dynamic feed demo keeps visible items while a later page fails and recovers on the next bottom cycle', async ({ page }) => {
  await page.setViewportSize({
    width: 2_560,
    height: 1_207,
  })

  await gotoRoute(page, '/demo/dynamic-feed?failPage=2&failCount=1')

  const listSurface = page.getByTestId('vibe-list-surface')
  const progress = listSurface.getByTestId('vibe-pagination')
  const scrollViewport = listSurface.getByTestId('vibe-list-scroll')
  const warning = page.getByText('Simulated page 2 failure.')

  await expect(progress).toHaveText('1 / 25', { timeout: 15_000 })

  await hitBottom(scrollViewport)

  await expect(warning).toBeVisible({ timeout: 15_000 })
  await expect.poll(async () => (await getPaginationState(progress)).total).toBe(25)

  await page.waitForTimeout(2_600)
  await moveAwayFromBottom(scrollViewport)
  await hitBottom(scrollViewport)

  await expect(warning).toHaveCount(0)
  await expect.poll(async () => (await getPaginationState(progress)).total).toBe(50)
})

test('dynamic feed demo surfaces raw cursor labels in the grid footer', async ({ page }) => {
  await page.setViewportSize({
    width: 2_560,
    height: 1_207,
  })

  await gotoRoute(page, '/demo/dynamic-feed')

  const statusBar = page.getByTestId('dynamic-demo-status-bar')

  await expect(statusBar.getByTestId('dynamic-demo-status-current')).toContainText('1', { timeout: 15_000 })
  await expect(statusBar.getByTestId('dynamic-demo-status-next')).toContainText('2')
  await expect(statusBar.getByTestId('dynamic-demo-status-previous')).toContainText('N/A')
  await expect(statusBar.getByTestId('dynamic-demo-status-status')).toContainText('dynamic')
  await expect(statusBar.getByTestId('dynamic-demo-status-delay')).toContainText('N/A')
  await expect(statusBar.getByTestId('dynamic-demo-status-fill')).toContainText('25 / 25')
  await expect(statusBar.getByTestId('dynamic-demo-status-total')).toContainText('25')
})

test('dynamic feed demo shows filling progress before committing a full appended batch', async ({ page }) => {
  await page.setViewportSize({
    width: 2_560,
    height: 1_207,
  })

  await gotoRoute(page, '/demo/dynamic-feed')

  const listSurface = page.getByTestId('vibe-list-surface')
  const progress = listSurface.getByTestId('vibe-pagination')
  const scrollViewport = listSurface.getByTestId('vibe-list-scroll')
  const statusBar = page.getByTestId('dynamic-demo-status-bar')

  await expect(progress).toHaveText('1 / 25', { timeout: 15_000 })

  await hitBottom(scrollViewport)

  await expect(statusBar.getByTestId('dynamic-demo-status-status')).toContainText('filling', { timeout: 15_000 })
  await expect(statusBar.getByTestId('dynamic-demo-status-delay')).toHaveText(/0\.\ds|1\.\ds/, { timeout: 15_000 })
  await expect(statusBar.getByTestId('dynamic-demo-status-fill')).toContainText('/ 25')

  await expect.poll(async () => (await getPaginationState(progress)).total).toBe(50)
  await expect(statusBar.getByTestId('dynamic-demo-status-next')).toContainText('5')
  await expect(statusBar.getByTestId('dynamic-demo-status-delay')).toContainText('N/A')
})

test('desktop append pagination grows the feed after a bottom hit', async ({ page }) => {
  await page.setViewportSize({
    width: 2_560,
    height: 1_207,
  })

  await gotoRoute(page, '/')

  const listSurface = page.getByTestId('vibe-list-surface')
  const progress = listSurface.getByTestId('vibe-pagination')
  const scrollViewport = listSurface.getByTestId('vibe-list-scroll')

  await expect(progress).toHaveText('1 / 25', { timeout: 15_000 })

  await hitBottom(scrollViewport)
  await expect.poll(async () => (await getPaginationState(progress)).total).toBe(50)
})

test('advanced static demo surfaces cursor status bars and keeps top-entering cards on the reversed stagger order', async ({ page }) => {
  await page.setViewportSize({
    width: 1_100,
    height: 650,
  })

  await gotoRoute(page, '/demo/advanced-integration')

  const statusBar = page.getByTestId('advanced-static-status-bar')

  await expect(statusBar.getByTestId('advanced-static-status-current')).toContainText('10', { timeout: 15_000 })
  await expect(statusBar.getByTestId('advanced-static-status-next')).toContainText('11')
  await expect(statusBar.getByTestId('advanced-static-status-previous')).toContainText('9')
  await expect(statusBar.getByTestId('advanced-static-status-status')).toContainText('static')
  await expect(statusBar.getByTestId('advanced-static-status-fill')).toContainText('25 / 25')
  await expect(statusBar.getByTestId('advanced-static-status-total')).toContainText('25')
})

test('broken demo assets surface 404 and generic preload errors in list and fullscreen', async ({ page }) => {
  await page.setViewportSize({
    width: 2_560,
    height: 1_440,
  })

  await gotoRoute(page, '/')

  const root = page.getByTestId('vibe')
  const listSurface = page.getByTestId('vibe-list-surface')
  const fullscreenSurface = page.getByTestId('vibe-fullscreen-surface')
  const scrollViewport = listSurface.getByTestId('vibe-list-scroll')
  const firstCard = listSurface.locator('[data-testid="vibe-list-card"][data-index="0"]')
  const missingCard = listSurface.locator('[data-testid="vibe-list-card"][data-item-id="img-missing-proof-0012"]')
  const brokenAssetCard = listSurface.locator('[data-testid="vibe-list-card"][data-item-id="img-broken-preview-0013"]')

  await expect(root).toHaveAttribute('data-surface-mode', 'list')
  await scrollNearBottomOfFirstPage(scrollViewport)
  await expect(missingCard).toHaveCount(1, { timeout: 15_000 })
  await expect(missingCard).toBeVisible()
  await expect(missingCard.getByTestId('vibe-list-card-error')).toHaveAttribute('data-kind', 'not-found', { timeout: 15_000 })
  await expect(missingCard).toContainText('404')
  await expect(brokenAssetCard).toBeVisible()
  await expect(brokenAssetCard.getByTestId('vibe-list-card-error')).toHaveAttribute('data-kind', 'generic', { timeout: 15_000 })
  await expect(brokenAssetCard).toContainText('Load error')

  await missingCard.getByTestId('vibe-list-card-open').evaluate((button) => {
    (button as HTMLButtonElement).click()
  })
  await expect(root).toHaveAttribute('data-surface-mode', 'fullscreen')
  await expect(fullscreenSurface).toContainText('404', { timeout: 15_000 })
  await page.getByTestId('vibe-back-to-list').click()
  await expect(root).toHaveAttribute('data-surface-mode', 'list')

  await expect(firstCard).toBeVisible()
  await brokenAssetCard.getByTestId('vibe-list-card-open').evaluate((button) => {
    (button as HTMLButtonElement).click()
  })
  await expect(root).toHaveAttribute('data-surface-mode', 'fullscreen')
  await expect(fullscreenSurface).toContainText('Load error', { timeout: 15_000 })
  await expect(fullscreenSurface).toContainText('Load error')
  await expect(fullscreenSurface.getByTestId('vibe-media-bar')).toHaveCount(0)
})

async function hitBottom(scrollViewport: Locator) {
  await scrollViewport.evaluate((element) => {
    const node = element as HTMLElement
    node.scrollTop = node.scrollHeight
    node.dispatchEvent(new Event('scroll', { bubbles: true }))
    node.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      deltaY: 180,
    }))
  })
}

async function moveAwayFromBottom(scrollViewport: Locator) {
  await scrollViewport.evaluate((element) => {
    const node = element as HTMLElement
    node.scrollTop = Math.max(0, node.scrollHeight - node.clientHeight - 240)
    node.dispatchEvent(new Event('scroll', { bubbles: true }))
  })
}

async function scrollNearBottomOfFirstPage(scrollViewport: Locator) {
  await scrollViewport.evaluate((element) => {
    const node = element as HTMLElement
    node.scrollTop = Math.max(0, node.scrollHeight - node.clientHeight - 280)
    node.dispatchEvent(new Event('scroll', { bubbles: true }))
  })
}

async function getPaginationState(locator: Locator) {
  const text = normalizeWhitespace(await locator.textContent())
  const match = text.match(/^(\d+)\s*\/\s*(\d+)$/)

  if (!match) {
    return {
      active: -1,
      total: -1,
    }
  }

  return {
    active: Number.parseInt(match[1], 10),
    total: Number.parseInt(match[2], 10),
  }
}

function normalizeWhitespace(value: string | null) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}
