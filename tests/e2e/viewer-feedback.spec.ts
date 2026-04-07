import type { Locator } from '@playwright/test'

import { expect, gotoRoute, test } from './fixtures'

test('home route exposes retry UI after an initial load failure and recovers on retry', async ({ page }) => {
  await gotoRoute(page, '/?failPage=1&failCount=1')

  const listSurface = page.getByTestId('vibe-list-surface')
  const retryButton = page.getByRole('button', { name: 'Retry' })
  const progress = listSurface.getByTestId('vibe-pagination')

  await expect(retryButton).toBeVisible({ timeout: 15_000 })

  await retryButton.click()

  await expect(retryButton).toHaveCount(0)
  await expect(progress).toHaveText('1 / 25', { timeout: 15_000 })
})

test('home route keeps visible items while a later page fails and recovers on the next bottom cycle', async ({ page }) => {
  await page.setViewportSize({
    width: 2_560,
    height: 1_207,
  })

  await gotoRoute(page, '/?failPage=2&failCount=1')

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

test('desktop append motion keeps bottom-entering cards on the forward stagger order', async ({ page }) => {
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
  await page.waitForTimeout(50)

  const cards = await getAnimatedCards(listSurface)
  const enteringCards = cards.filter((card) => card.index >= 25 && card.transition.includes('600ms'))

  expect(enteringCards.length).toBeGreaterThan(0)

  const delayedEnteringCards = enteringCards
    .filter((card) => Number.isFinite(card.delayMs))
    .sort((left, right) => left.index - right.index)

  if (delayedEnteringCards.length >= 2) {
    expect(delayedEnteringCards[0].delayMs).toBeLessThanOrEqual(delayedEnteringCards.at(-1)!.delayMs)
  }
})

test('desktop prepend motion keeps top-entering cards on the reversed stagger order', async ({ page }) => {
  await page.setViewportSize({
    width: 1_100,
    height: 650,
  })

  await gotoRoute(page, '/demo/advanced-integration')

  const listSurface = page.getByTestId('vibe-list-surface')
  const progress = listSurface.getByTestId('vibe-pagination')
  const scrollViewport = listSurface.getByTestId('vibe-list-scroll')

  await expect(progress).toContainText('P10 · V10', { timeout: 15_000 })
  await scrollViewport.evaluate((element) => {
    const node = element as HTMLElement
    node.scrollTop = 0
    node.dispatchEvent(new Event('scroll', { bubbles: true }))
  })

  await expect.poll(async () => normalizeWhitespace(await progress.textContent())).toContain('/ 50')
  await page.waitForTimeout(50)

  const cards = await getAnimatedCards(listSurface)
  const enteringCards = cards.filter((card) => card.index < 25 && card.transition.includes('600ms'))

  expect(enteringCards.length).toBeGreaterThan(0)

  const delayedEnteringCards = enteringCards
    .filter((card) => Number.isFinite(card.delayMs))
    .sort((left, right) => left.index - right.index)

  if (delayedEnteringCards.length >= 2) {
    expect(delayedEnteringCards[0].delayMs).toBeGreaterThanOrEqual(delayedEnteringCards.at(-1)!.delayMs)
  }
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

  await scrollViewport.evaluate((element) => {
    const node = element as HTMLElement
    node.scrollTop = 0
    node.dispatchEvent(new Event('scroll', { bubbles: true }))
  })
  await expect(firstCard).toBeVisible()
  await firstCard.locator('button').click()
  await expect(root).toHaveAttribute('data-surface-mode', 'fullscreen')
  for (let step = 0; step < 11; step += 1) {
    await page.keyboard.press('ArrowDown')
  }
  await expect(fullscreenSurface).toContainText('404', { timeout: 15_000 })

  await page.keyboard.press('ArrowDown')
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

async function getAnimatedCards(listSurface: Locator) {
  return listSurface.locator('[data-testid="vibe-list-card"]').evaluateAll((nodes) => {
    return nodes.map((node) => {
      const element = node as HTMLElement
      const delayMs = Number.parseFloat(element.style.transitionDelay || '0')

      return {
        delayMs,
        index: Number.parseInt(element.dataset.index || '-1', 10),
        transition: element.style.transition,
      }
    }).filter((card) => card.transition)
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
