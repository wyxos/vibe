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
  await expect(page.getByText('VibeRoot callback shape')).toBeVisible()

  await nextButton.click()

  await expect(page.getByTestId('fake-server-current-page')).toHaveText('2')
  await expect(page.getByTestId('fake-server-next-page')).toHaveText('3')
  await expect(responseSnapshot).toContainText('"page": 2')
  await expect(previousButton).toBeEnabled()
  await expect(cards).toHaveCount(25)
})

test('bidirectional paging demo prepends earlier pages when navigating upward', async ({ page }) => {
  await gotoRoute(page, '/demo/bidirectional-paging')

  const progress = page.getByTestId('vibe-root-pagination')

  await expect(progress).toContainText('4 / 25', { timeout: 15_000 })
  await expect(progress).toContainText('P10 · V10')

  await page.keyboard.press('ArrowUp')

  await expect(progress).toContainText('28 / 50')
  await expect(progress).toContainText('P9-10 · V10')
})
