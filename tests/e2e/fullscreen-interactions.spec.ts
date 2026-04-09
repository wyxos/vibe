import { expect, gotoRoute, test } from './fixtures'

test('mobile fullscreen supports touch-style swipe navigation in both directions', async ({ page }) => {
  await page.setViewportSize({
    width: 430,
    height: 932,
  })

  await gotoRoute(page, '/')

  const root = page.getByTestId('vibe')
  const stage = page.getByTestId('vibe-stage')
  const progress = page.getByTestId('vibe-pagination')

  await expect(root).toHaveAttribute('data-surface-mode', 'fullscreen')
  await expect(stage).toBeVisible()
  await expect(progress).toHaveText('1 / 25', { timeout: 15_000 })

  await stage.dispatchEvent('pointerdown', {
    bubbles: true,
    clientX: 215,
    clientY: 760,
    isPrimary: true,
    pointerId: 1,
    pointerType: 'touch',
  })
  await stage.dispatchEvent('pointermove', {
    bubbles: true,
    clientX: 215,
    clientY: 360,
    isPrimary: true,
    pointerId: 1,
    pointerType: 'touch',
  })
  await stage.dispatchEvent('pointerup', {
    bubbles: true,
    clientX: 215,
    clientY: 360,
    isPrimary: true,
    pointerId: 1,
    pointerType: 'touch',
  })

  await expect(progress).toHaveText('2 / 25')

  await stage.dispatchEvent('pointerdown', {
    bubbles: true,
    clientX: 215,
    clientY: 320,
    isPrimary: true,
    pointerId: 2,
    pointerType: 'touch',
  })
  await stage.dispatchEvent('pointermove', {
    bubbles: true,
    clientX: 215,
    clientY: 760,
    isPrimary: true,
    pointerId: 2,
    pointerType: 'touch',
  })
  await stage.dispatchEvent('pointerup', {
    bubbles: true,
    clientX: 215,
    clientY: 760,
    isPrimary: true,
    pointerId: 2,
    pointerType: 'touch',
  })

  await expect(progress).toHaveText('1 / 25')
})
