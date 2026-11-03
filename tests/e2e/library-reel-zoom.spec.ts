import { expect, test } from '@playwright/test'
import type {} from '../browser/harness'

for (const phone of [false, true]) {
  test.describe(phone ? 'phone media zoom' : 'desktop media zoom', () => {
    test.use({ viewport: { width: phone ? 390 : 1440, height: 844 }, hasTouch: phone, isMobile: phone })
    for (const scenario of ['video', 'mixed', 'audio']) {
      test(`zooms ${scenario} media and fits it again`, async ({ page }) => {
        await page.goto(`/?scenario=${scenario}&layout=reel`)
        const media = page.locator('.reel-item .media-card-media').first()
        const preview = media.locator('.media-preview--ready')
        await expect(preview).toBeVisible()
        const box = (await media.boundingBox())!
        const x = box.x + box.width / 2
        const y = box.y + box.height / 2
        if (phone) {
          const session = await page.context().newCDPSession(page)
          try {
            const points = (distance: number) => [{ x: x - distance, y, id: 1 }, { x: x + distance, y, id: 2 }]
            await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(25) })
            await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(70) })
            await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
          } finally {
            await session.detach()
          }
        } else {
          await page.mouse.move(x, y)
          await page.keyboard.down('Control')
          await page.mouse.wheel(0, -240)
          await page.keyboard.up('Control')
        }
        const fit = page.getByRole('button', { name: 'Fit media' })
        await expect(fit).toBeVisible()
        expect(await preview.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).a)).toBeGreaterThan(1)
        if (!phone) {
          await page.mouse.move(x, y)
          await page.mouse.down()
          await page.mouse.move(x + 45, y + 25)
          await page.mouse.up()
          expect(await preview.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).e)).toBeGreaterThan(0)
        }
        if (phone) await fit.tap()
        else await fit.click()
        await expect(fit).toHaveCount(0)
        await expect(preview).toHaveCSS('transform', 'none')
      })
    }
  })
}

test('Ctrl+wheel zooms an image in forward and back out to fit', async ({ page }) => {
  await page.goto('/?scenario=mixed&layout=reel')
  const media = page.locator('.reel-item .media-card-media').first()
  await expect(media.locator('img')).toBeVisible()
  await media.hover()
  await page.keyboard.down('Control')
  await page.mouse.wheel(0, -240)
  const fit = page.getByRole('button', { name: 'Fit media' })
  await expect(fit).toBeVisible()
  await page.mouse.wheel(0, 250)
  await page.keyboard.up('Control')
  await expect(fit).toHaveCount(0)
  await expect(media).not.toHaveAttribute('data-zoomed')
})

test('fullscreen retains enabled header and footer actions', async ({ page }) => {
  await page.goto('/?scenario=video&layout=reel&chrome')
  const header = page.locator('.reel-shell > .media-card-header')
  const footer = page.locator('.reel-shell > .media-card-footer')
  const cog = page.getByRole('button', { name: 'Video options', exact: true })
  await cog.click()
  await page.getByRole('button', { name: 'Enter fullscreen', exact: true }).click()
  await expect(page.locator('.vibe-surface')).toHaveAttribute('data-reel-fullscreen', 'true')
  await expect(header).toBeVisible()
  await expect(footer).toBeVisible()
  await footer.getByRole('button', { name: 'Like' }).click()
  await expect(footer.getByRole('button', { name: 'Like' })).toHaveAttribute('aria-pressed', 'true')
  await cog.click()
  await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click()
  await expect(footer.getByRole('button', { name: 'Like' })).toHaveAttribute('aria-pressed', 'true')
})

for (const layout of ['reel', 'masonry']) {
  test(`fullscreen exit retains the post reached by scrolling (${layout})`, async ({ page }) => {
    await page.goto(`/?scenario=mixed&layout=${layout}&chrome`)
    if (layout === 'masonry') await page.locator('.masonry-item').nth(4).click()
    const reel = page.locator('.reel-feed')
    const scrollTo = (index: number) => reel.evaluate((node, target) => {
      node.scrollTop = target * node.clientHeight
    }, index)
    await expect(reel).not.toHaveAttribute('data-resizing')
    if (layout === 'reel') {
      await scrollTo(2)
      await expect(reel).toHaveAttribute('data-active-post-id', '3')
      await scrollTo(4)
    }
    await expect(reel).toHaveAttribute('data-active-post-id', '5')
    await reel.locator('[data-post-id="5"] .media-card-media').dblclick()
    const surface = page.locator('.vibe-surface')
    await expect(surface).toHaveAttribute('data-reel-fullscreen', 'true')
    await expect(reel).not.toHaveAttribute('data-resizing')
    await scrollTo(5)
    await expect(reel).toHaveAttribute('data-active-post-id', '6')
    await page.evaluate(async () => {
      window.__vibe.nextReelPost()
      await document.exitFullscreen()
    })
    await expect(surface).not.toHaveAttribute('data-reel-fullscreen')
    await expect(reel).not.toHaveAttribute('data-transitioning')
    await expect(reel).not.toHaveAttribute('data-resizing')
    await expect(reel).toHaveAttribute('data-active-post-id', '7')
    await expect.poll(() => reel.evaluate(node => Math.round(node.scrollTop / node.clientHeight))).toBe(6)
  })
}
