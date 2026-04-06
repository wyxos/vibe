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
  await page.setViewportSize({
    width: 1_100,
    height: 650,
  })

  await gotoRoute(page, '/demo/bidirectional-paging')

  const root = page.getByTestId('vibe-root')
  const listSurface = page.getByTestId('vibe-root-list-surface')
  const progress = listSurface.getByTestId('vibe-root-pagination')
  const listScroll = listSurface.getByTestId('vibe-list-scroll')

  await expect(root).toHaveAttribute('data-surface-mode', 'list')
  await expect(progress).toContainText('13 / 25', { timeout: 15_000 })
  await expect(progress).toContainText('P10 · V10')
  await page.waitForTimeout(500)
  await expect(progress).toContainText('/ 25')
  await expect(progress).toContainText('P10 · V10')
  await expect.poll(async () => {
    return listScroll.evaluate((element) => {
      const node = element as HTMLElement
      return node.scrollHeight > node.clientHeight
    })
  }).toBe(true)
  await expect.poll(async () => {
    return listScroll.evaluate((element) => {
      const node = element as HTMLElement
      return node.scrollTop
    })
  }).toBeGreaterThan(0)

  await listScroll.evaluate((element) => {
    const node = element as HTMLElement
    node.scrollTop = 0
    node.dispatchEvent(new Event('scroll', { bubbles: true }))
  })

  await expect.poll(async () => normalizeWhitespace(await progress.textContent())).toContain('/ 50')
  await expect(progress).toContainText('P9-10 · V9')
  await listScroll.evaluate((element) => {
    element.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      deltaY: -160,
    }))
  })
  await page.waitForTimeout(1_200)
  await expect(progress).toContainText('/ 50')

  await page.waitForTimeout(1_400)
  await listScroll.evaluate((element) => {
    element.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      deltaY: -160,
    }))
  })

  await expect.poll(async () => normalizeWhitespace(await progress.textContent())).toContain('/ 75')
  await expect(progress).toContainText('P8-10 · V8')
})

function normalizeWhitespace(value: string | null) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}
