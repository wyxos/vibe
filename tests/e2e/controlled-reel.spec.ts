import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/demos/controlled-reel')
  await expect(page.locator('.vibe-controlled-reel')).toHaveAttribute('data-current-id', '1')
})

test('wheel and keyboard navigate a bounded queue without replacing host media', async ({ page }) => {
  const reel = page.locator('.vibe-controlled-reel')
  const audio = await reel.locator('audio').elementHandle()
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await reel.hover()
  await page.mouse.wheel(0, 1000)
  await expect(reel).toHaveAttribute('data-current-id', '2')
  await expect(reel).toHaveAttribute('aria-busy', 'false')
  await reel.focus()
  await page.keyboard.press('ArrowUp')
  await expect(reel).toHaveAttribute('data-current-id', '1')
  await expect(reel.locator('.vibe-controlled-reel-frame')).toHaveCount(3)
  await expect(reel.locator('audio')).toHaveCount(1)
  expect(await audio?.evaluate(node => node === document.querySelector('.vibe-controlled-reel audio'))).toBe(true)
  expect(errors).toEqual([])
  await page.getByRole('button', { name: 'Last', exact: true }).click()
  await reel.focus()
  await page.keyboard.press('ArrowDown')
  await expect(reel).toHaveAttribute('data-current-id', '2999999')
  await expect(reel.locator('.vibe-controlled-reel-frame')).toHaveCount(2)
})

test('held, declined, failed and externally invalidated requests keep queue authority', async ({ page }) => {
  const reel = page.locator('.vibe-controlled-reel')
  await page.getByLabel('Hold request').check()
  await reel.focus()
  await page.keyboard.press('ArrowDown')
  await expect(reel).toHaveAttribute('aria-busy', 'true')
  await expect(page.getByRole('button', { name: 'Complete request' })).toBeEnabled()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByText(/Requests: 1$/)).toBeVisible()
  await expect(reel).toHaveAttribute('data-current-id', '1')
  await page.getByRole('button', { name: 'Restart' }).click()
  await expect(reel).toHaveAttribute('aria-busy', 'false')
  await expect(page.getByRole('button', { name: 'Complete request' })).toBeDisabled()
  await page.getByLabel('Hold request').uncheck()
  await page.getByLabel('Decline request').check()
  await reel.focus()
  await page.keyboard.press('ArrowUp')
  await expect(reel).toHaveAttribute('aria-busy', 'false')
  await expect(reel).toHaveAttribute('data-current-id', '1')
  await page.getByLabel('Decline request').uncheck()
  await page.getByLabel('Fail request').check()
  await reel.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('alert')).toHaveText('Unable to change sample. Try again.')
  await expect(reel).toHaveAttribute('aria-busy', 'false')
  await page.getByLabel('Fail request').uncheck()
  await reel.focus()
  await page.keyboard.press('ArrowDown')
  await expect(reel).toHaveAttribute('data-current-id', '2')
})

test('real touch scroll advances at phone width and respects reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  try {
    const page = await context.newPage()
    await page.goto('/demos/controlled-reel')
    const reel = page.locator('.vibe-controlled-reel')
    await expect(reel).toBeVisible()
    await reel.scrollIntoViewIfNeeded()
    const rect = await reel.boundingBox()
    if (!rect) throw new Error('Missing controlled viewport')
    const session = await context.newCDPSession(page)
    const x = rect.x + rect.width / 2
    const from = rect.y + rect.height * 0.8
    const to = rect.y + rect.height * 0.1
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: from }] })
    for (let step = 1; step <= 8; step += 1) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: from + (to - from) * step / 8 }] })
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await session.detach()
    await expect(reel).toHaveAttribute('data-current-id', '2')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: 'Previous', exact: true }).click()
    await expect(reel).toHaveAttribute('data-current-id', '1')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  } finally { await context.close() }
})

test('invalidating a queue during a native touch discards the remaining gesture', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  try {
    const page = await context.newPage()
    await page.goto('/demos/controlled-reel')
    const reel = page.locator('.vibe-controlled-reel')
    await expect(reel).toHaveAttribute('data-current-id', '1')
    await reel.scrollIntoViewIfNeeded()
    const rect = await reel.boundingBox()
    if (!rect) throw new Error('Missing controlled viewport')
    const x = rect.x + rect.width / 2
    const from = rect.y + rect.height * .8
    const middle = rect.y + rect.height * .6
    const to = rect.y + rect.height * .1
    expect(await page.evaluate(({ x, y }) => {
      const target = document.elementFromPoint(x, y)
      return y < innerHeight && target?.tagName === 'IMG' && !!target.closest('.vibe-controlled-reel-current')
    }, { x, y: from })).toBe(true)
    await reel.evaluate(element => {
      element.addEventListener('touchstart', () => { element.setAttribute('data-fixture-touch-started', 'true') }, { once: true })
    })
    const session = await context.newCDPSession(page)
    try {
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: from }] })
      await expect(reel).toHaveAttribute('data-fixture-touch-started', 'true')
      for (let step = 1; step <= 5; step++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: from + (middle - from) * step / 5 }] })
        await page.evaluate(() => new Promise(requestAnimationFrame))
      }
      const heldOffset = await reel.evaluate(element => element.scrollTop / element.clientHeight)
      expect(heldOffset).toBeGreaterThan(1)
      expect(heldOffset).toBeLessThan(1.5)
      await expect(reel).toHaveAttribute('data-current-id', '1')
      // The physical finger remains down while the host changes the revision.
      await page.getByRole('button', { name: 'Restart', exact: true }).evaluate(element => element.click())
      await expect.poll(() => reel.evaluate(element => element.scrollTop / element.clientHeight)).toBe(1)
      for (let step = 1; step <= 12; step++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: middle + (to - middle) * step / 12 }] })
        await page.evaluate(() => new Promise(requestAnimationFrame))
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await expect(reel).toHaveAttribute('aria-busy', 'false')
      await expect(reel).toHaveAttribute('data-current-id', '1')
      await expect(page.getByText(/Requests: 0$/)).toBeVisible()
      // A fresh deliberate touch can navigate the replacement queue normally.
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: from }] })
      for (let step = 1; step <= 12; step++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: from + (to - from) * step / 12 }] })
        await page.evaluate(() => new Promise(requestAnimationFrame))
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await expect(reel).toHaveAttribute('data-current-id', '2')
      await expect(page.getByText(/Requests: 1$/)).toBeVisible()
    } finally { await session.detach() }
  } finally { await context.close() }
})
