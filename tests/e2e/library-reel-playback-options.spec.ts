import { expect, test } from '@playwright/test'
import type {} from '../browser/harness'

for (const phone of [false, true]) {
  test.describe(phone ? 'phone playback options' : 'desktop playback options', () => {
    test.use({ viewport: { width: phone ? 390 : 1440, height: 844 }, hasTouch: phone, isMobile: phone })

    test('media double gesture toggles fullscreen without changing playback', async ({ page }) => {
      await page.goto('/?scenario=video&layout=reel')
      const video = page.locator('.reel-item').first().locator('video')
      const cog = page.getByRole('button', { name: 'Video options', exact: true })
      await expect(cog).toBeVisible()
      const paused = await video.evaluate(element => element.paused)
      if (phone) {
        await video.tap()
        await video.tap()
      } else await video.dblclick()
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true)
      expect(await video.evaluate(element => element.paused)).toBe(paused)
      await cog.click()
      await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click()
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false)
      await expect(cog).toBeFocused()
      await cog.click()
      await page.getByRole('button', { name: 'Enter fullscreen', exact: true }).click()
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true)
    })

    test('image cog configures and starts the shared auto-advance timer', async ({ page }) => {
      await page.goto('/?scenario=mixed&layout=reel')
      await page.getByRole('button', { name: 'Image options', exact: true }).click()
      const duration = page.getByRole('spinbutton', { name: 'Image duration (seconds)' })
      await expect(duration).toHaveValue('3')
      await page.getByRole('button', { name: 'Increase image duration' }).click()
      await expect(duration).toHaveValue('4')
      await page.getByRole('button', { name: 'Decrease image duration' }).click()
      await expect(duration).toHaveValue('3')
      const evidenceDir = process.env.VIBE_SITE_REVIEW_DIR
      if (evidenceDir) {
        const menu = page.getByRole(phone ? 'dialog' : 'group', { name: 'Image options', exact: true })
        if (!phone) await page.getByRole('button', { name: 'Auto advance', exact: true }).hover()
        await menu.screenshot({ path: `${evidenceDir}/playback-options-${phone ? 'phone' : 'desktop'}.png` })
      }
      await duration.fill('1')
      await duration.press('Tab')
      const advance = page.getByRole('button', { name: 'Auto advance', exact: true })
      await advance.click()
      await expect(advance).toHaveAttribute('aria-pressed', 'true')
      expect(await page.evaluate(() => window.__vibe.getState().reelAutoAdvance)).toMatchObject({
        intervalMs: 1000, enabled: true,
      })
      await expect(page.locator('.reel-feed')).toHaveAttribute('data-active-post-id', '2')
      await expect(page.getByRole('dialog', { name: 'Image options', exact: true })).toHaveCount(0)
    })
  })
}
