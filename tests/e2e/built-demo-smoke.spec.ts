import type { Page } from '@playwright/test'

import { expect, gotoRoute, test } from './fixtures'

test('built demo serves the primary routes from dist preview', async ({ page }) => {
  await gotoRoute(page, '/')
  await expect(page.getByTestId('workspace-menu-button')).toBeVisible()
  await expect(page.getByTestId('vibe')).toHaveAttribute('data-surface-mode', 'list', { timeout: 15_000 })

  await gotoRoute(page, '/documentation')
  await expectDocumentationPage(page)

  await page.setViewportSize({
    width: 1_100,
    height: 650,
  })
  await gotoRoute(page, '/demo/feed-behavior')
  await expect(page.getByTestId('vibe')).toHaveAttribute('data-surface-mode', 'list', { timeout: 15_000 })
  await expect(page.getByTestId('feed-behavior-status-current')).toContainText('9')

  await gotoRoute(page, '/debug/fake-server')
  await expect(page.getByRole('heading', { name: 'Fake paginated media server' })).toBeVisible()
  await expect(page.getByTestId('fake-server-current-page')).toHaveText('1', { timeout: 15_000 })
})

test('built demo reloads the documentation deep link', async ({ page }) => {
  await gotoRoute(page, '/documentation')
  await expectDocumentationPage(page)

  const response = await page.reload({
    waitUntil: 'domcontentloaded',
  })

  expect(response, 'Expected a navigation response when reloading /documentation.').not.toBeNull()
  expect(
    response?.ok(),
    `Expected /documentation reload to load successfully, received ${response?.status()}.`,
  ).toBeTruthy()
  await expectDocumentationPage(page)
})

async function expectDocumentationPage(page: Page) {
  await expect(page.getByTestId('documentation-page')).toBeVisible()
  await expect(page.getByTestId('documentation-aside')).toContainText('API Reference')
  await expect(page.getByTestId('docs-section-installation')).toBeVisible()
}
