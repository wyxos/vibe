import { expect, test } from '@playwright/test'

test('selects grouped images, resumes after reload, exports CSV and undoes', async ({ page }) => {
  let rows: { imageId: number; postId: number }[] = []
  let failSave = true
  await page.route('**/__selection', async (route) => {
    if (route.request().method() === 'POST') {
      if (failSave) {
        failSave = false
        await route.fulfill({ status: 500, body: 'Temporary failure' })
        return
      }
      const action = route.request().postDataJSON()
      rows = action.selected ? [{ imageId: 11, postId: action.postId }, { imageId: 12, postId: action.postId }] : []
    }
    await route.fulfill({ json: rows })
  })
  await page.route('**/data/civitai/images/page-*.json', async (route) => {
    await route.fulfill({ json: {
      items: route.request().url().includes('page-01') ? [11, 12].map((id) => ({
        id, postId: 50, width: 400, height: 400,
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="slategray"/></svg>',
      })) : [], metadata: {},
    } })
  })
  await page.goto('/select')
  const select = page.getByRole('button', { name: 'Select post · 2 images' })
  await select.click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(select).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.locator('.selection-toolbar [role=status]')).toContainText('1 post · 2 images saved to CSV')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Selected · 2 images' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('link', { name: 'Download CSV' })).toHaveAttribute('href', '/__selection/csv')
  await page.screenshot({ path: 'test-results/selection-desktop.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('button', { name: 'Selected · 2 images' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/selection-phone.png' })
  await page.getByRole('button', { name: 'Selected · 2 images' }).click()
  await expect(page.locator('.selection-toolbar [role=status]')).toContainText('0 posts · 0 images saved to CSV')
})
