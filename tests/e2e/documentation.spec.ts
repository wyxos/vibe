import { expect, gotoRoute, test } from './fixtures'

test('documentation route renders grouped navigation and api content', async ({ page }) => {
  await gotoRoute(page, '/documentation')

  const docsPage = page.getByTestId('documentation-page')
  const aside = page.getByTestId('documentation-aside')

  await expect(docsPage).toBeVisible()
  await expect(aside).toContainText('Getting Started')
  await expect(aside).toContainText('Data Flow')
  await expect(aside).toContainText('Customization')
  await expect(aside).toContainText('API Reference')
  await expect(page.getByTestId('docs-section-installation')).toBeVisible()
  await expect(page.getByTestId('docs-section-api-props')).toContainText('VibeProps')
  await expect(page.getByTestId('docs-copy-installation')).toBeVisible()

  const highlightedTokens = page.getByTestId('docs-code-quick-start').locator('span')
  expect(await highlightedTokens.count()).toBeGreaterThan(0)
})

test('documentation aside links update the hash and scroll to the matching section', async ({ page }) => {
  await gotoRoute(page, '/documentation')

  const targetLink = page.getByTestId('docs-nav-api-handle')
  const targetSection = page.getByTestId('docs-section-api-handle')

  await targetLink.click()

  await expect(page).toHaveURL(/\/documentation#api-handle$/)
  await expect(targetSection).toBeInViewport()
})

test('documentation code samples can be copied from the docs page', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await gotoRoute(page, '/documentation')

  const copyButton = page.getByTestId('docs-copy-installation')

  await copyButton.click()

  await expect(copyButton).toContainText('Copied')
})
