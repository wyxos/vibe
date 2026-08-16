import { expect, test } from '@playwright/test'

test('failed media retry is styled, guarded, and activation-safe', async ({ page }) => {
  let releaseRetry: (() => void) | undefined
  let requestCount = 0

  await page.route('**/demo-errors/401/**', async (route) => {
    requestCount += 1
    if (requestCount > 1) {
      await new Promise<void>((resolve) => {
        releaseRetry = resolve
      })
    }
    await route.fulfill({
      body: 'Synthetic media error',
      contentType: 'text/plain',
      status: 401,
    })
  })

  await page.goto('/')

  const error = page.locator('[data-test="media-error"][aria-label="401 Authentication required"]')
  const retry = error.getByRole('button', { name: 'Retry' })
  const frame = error.locator('..')
  await expect(error).toBeVisible()
  await expect(retry).toBeVisible()
  expect(await retry.evaluate((element) => element.tagName)).toBe('BUTTON')

  const styles = await retry.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      backgroundColor: style.backgroundColor,
      borderStyle: style.borderStyle,
      cursor: style.cursor,
      minHeight: style.minHeight,
    }
  })
  expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  expect(styles.borderStyle).toBe('solid')
  expect(styles.cursor).toBe('pointer')
  expect(styles.minHeight).toBe('32px')

  const initialGeneration = await frame.locator('img').getAttribute('data-source-generation')
  await retry.click()
  await expect.poll(() => requestCount).toBe(2)
  await expect.poll(() => Boolean(releaseRetry)).toBe(true)
  await expect(retry).toBeDisabled()
  await expect(retry).toHaveText('Retrying…')
  await expect(error).toHaveAttribute('aria-busy', 'true')
  await expect(frame.locator('img')).not.toHaveAttribute(
    'data-source-generation',
    initialGeneration ?? '',
  )
  await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
  expect(await retry.evaluate((element) => getComputedStyle(element).cursor)).toBe('wait')

  const releasePointerRetry = releaseRetry
  releaseRetry = undefined
  releasePointerRetry?.()
  await expect(retry).toBeEnabled()
  await expect(retry).toHaveText('Retry')

  await retry.focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(retry).toBeFocused()
  expect(await retry.evaluate((element) => element.matches(':focus-visible'))).toBe(true)
  expect(await retry.evaluate((element) => getComputedStyle(element).outlineStyle))
    .toBe('solid')

  await page.keyboard.press('Enter')
  await expect.poll(() => requestCount).toBe(3)
  await expect.poll(() => Boolean(releaseRetry)).toBe(true)
  await expect(retry).toBeDisabled()
  await expect(retry).toHaveText('Retrying…')
  await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)

  releaseRetry?.()
  await expect(retry).toBeEnabled()
})
