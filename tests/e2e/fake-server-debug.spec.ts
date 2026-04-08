import { expect, gotoRoute, test } from './fixtures'

test('fake-server debug route paginates and shows response metadata', async ({ page }) => {
  await gotoRoute(page, '/debug/fake-server')

  await expect(page.getByRole('heading', { name: 'Fake paginated media server' })).toBeVisible()

  const responseSnapshot = page.getByTestId('fake-server-response-snapshot')
  const previousButton = page.getByRole('button', { name: 'Previous' })
  const nextButton = page.getByRole('button', { name: 'Next' })
  const cards = page.getByRole('article')

  await expect(page.getByTestId('fake-server-current-page')).toHaveText('1', { timeout: 15_000 })
  await expect(page.getByTestId('fake-server-page-size')).toHaveText('25')
  await expect(page.getByTestId('fake-server-total-pages')).toHaveText('100')
  await expect(page.getByTestId('fake-server-total-items')).toHaveText('2500')
  await expect(page.getByTestId('fake-server-next-page')).toHaveText('2')
  await expect(responseSnapshot).toContainText('"page": 1', { timeout: 15_000 })
  await expect(previousButton).toBeDisabled()
  await expect(nextButton).toBeEnabled()
  await expect(cards).toHaveCount(25)
  await expect(page.getByText('Main dimensions').first()).toBeVisible()
  await expect(page.getByText('Preview dimensions').first()).toBeVisible()
  await expect(page.getByText('Vibe callback shape')).toBeVisible()

  await nextButton.click()

  await expect(page.getByTestId('fake-server-current-page')).toHaveText('2')
  await expect(page.getByTestId('fake-server-next-page')).toHaveText('3')
  await expect(responseSnapshot).toContainText('"page": 2')
  await expect(previousButton).toBeEnabled()
  await expect(cards).toHaveCount(25)
})

test('advanced static demo exposes raw cursor footer labels', async ({ page }) => {
  await page.setViewportSize({
    width: 1_100,
    height: 650,
  })

  await gotoRoute(page, '/demo/advanced-integration')

  const root = page.getByTestId('vibe')
  const statusBar = page.getByTestId('advanced-static-status-bar')

  await expect(root).toHaveAttribute('data-surface-mode', 'list')
  await expect(statusBar.getByTestId('advanced-static-status-current')).toContainText('10', { timeout: 15_000 })
  await expect(statusBar.getByTestId('advanced-static-status-next')).toContainText('11')
  await expect(statusBar.getByTestId('advanced-static-status-previous')).toContainText('9')
  await expect(statusBar.getByTestId('advanced-static-status-status')).toContainText('static')
  await expect(statusBar.getByTestId('advanced-static-status-fill')).toContainText('25 / 25')
  await expect(statusBar.getByTestId('advanced-static-status-total')).toContainText('25')
})

test('bidirectional paging demo reactions remove an item and update the status bar', async ({ page }) => {
  await page.setViewportSize({
    width: 1_100,
    height: 650,
  })

  await gotoRoute(page, '/demo/advanced-integration')

  const listSurface = page.getByTestId('vibe-list-surface')
  const progress = listSurface.getByTestId('vibe-pagination')
  const firstCard = listSurface.locator('[data-testid="vibe-list-card"][data-index="0"]')
  const firstCardInner = firstCard.getByTestId('vibe-list-card-inner')
  const statusBar = page.getByTestId('advanced-static-status-bar')

  await expect(progress).toContainText('1 / 25', { timeout: 15_000 })
  await expect(firstCard).toBeVisible()
  await expect(statusBar).toBeVisible()
  await expect(page.getByTestId('advanced-static-status-current')).toContainText('10')
  await expect(page.getByTestId('advanced-static-status-next')).toContainText('11')
  await expect(page.getByTestId('advanced-static-status-previous')).toContainText('9')
  await expect(page.getByTestId('advanced-static-status-status')).toContainText('idle')
  await expect(page.getByTestId('advanced-static-status-total')).toContainText('25')

  await firstCardInner.dispatchEvent('pointerenter')
  await expect(firstCardInner.getByTestId('demo-reaction-bar')).toBeVisible()

  await firstCardInner.getByTestId('demo-reaction-button').first().click()

  await expect.poll(async () => (await getPaginationState(progress)).total).toBe(24)
  await expect(page.getByTestId('advanced-static-status-total')).toContainText('24')

  await page.keyboard.press('Control+z')

  await expect.poll(async () => (await getPaginationState(progress)).total).toBe(25)
  await expect(page.getByTestId('advanced-static-status-total')).toContainText('25')
})

test('advanced integration demo footer bar is only visible in grid mode', async ({ page }) => {
  await page.setViewportSize({
    width: 1_100,
    height: 650,
  })

  await gotoRoute(page, '/demo/advanced-integration')

  const root = page.getByTestId('vibe')
  const statusBar = page.getByTestId('advanced-static-status-bar')
  const firstCardButton = page.locator('[data-testid="vibe-list-card"][data-index="0"] button').first()

  await expect(root).toHaveAttribute('data-surface-mode', 'list')
  await expect(statusBar).toBeVisible({ timeout: 15_000 })

  await firstCardButton.click()

  await expect(root).toHaveAttribute('data-surface-mode', 'fullscreen')
  await expect(statusBar).toBeHidden()
})

test('advanced static demo reloads the current cursor before advancing after local removals', async ({ page }) => {
  await page.setViewportSize({
    width: 2_560,
    height: 1_207,
  })

  await gotoRoute(page, '/demo/advanced-integration')

  const listSurface = page.getByTestId('vibe-list-surface')
  const progress = listSurface.getByTestId('vibe-pagination')
  const scrollViewport = listSurface.getByTestId('vibe-list-scroll')
  const statusBar = page.getByTestId('advanced-static-status-bar')
  const firstCardInner = listSurface.locator('[data-testid="vibe-list-card"][data-index="0"]').getByTestId('vibe-list-card-inner')

  await expect(progress).toContainText('1 / 25', { timeout: 15_000 })
  await firstCardInner.dispatchEvent('pointerenter')
  await firstCardInner.getByTestId('demo-reaction-button').first().click()
  await expect.poll(async () => (await getPaginationState(progress)).total).toBe(24)

  await hitBottom(scrollViewport)

  await expect.poll(async () => (await getPaginationState(progress)).total).toBe(25)
  await expect(statusBar.getByTestId('advanced-static-status-current')).toContainText('10')
  await expect(statusBar.getByTestId('advanced-static-status-next')).toContainText('11')

  await page.waitForTimeout(2_600)
  await moveAwayFromBottom(scrollViewport)
  await hitBottom(scrollViewport)

  await expect.poll(async () => (await getPaginationState(progress)).total).toBeGreaterThan(25)
})

function normalizeWhitespace(value: string | null) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

async function getPaginationState(locator: import('@playwright/test').Locator) {
  const text = normalizeWhitespace(await locator.textContent())
  const match = text.match(/^(\d+)\s*\/\s*(\d+)/)

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

async function hitBottom(scrollViewport: import('@playwright/test').Locator) {
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

async function moveAwayFromBottom(scrollViewport: import('@playwright/test').Locator) {
  await scrollViewport.evaluate((element) => {
    const node = element as HTMLElement
    node.scrollTop = Math.max(0, node.scrollHeight - node.clientHeight - 240)
    node.dispatchEvent(new Event('scroll', { bubbles: true }))
  })
}
