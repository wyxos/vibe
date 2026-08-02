import { expect, test } from '@playwright/test'

function postIds(page: import('@playwright/test').Page): Promise<(string | undefined)[]> {
  return page.locator('.masonry-item').evaluateAll(
    (elements) => elements.map((element) => (
      (element as HTMLElement).dataset.postId
    )),
  )
}

test('items can be removed, randomly removed, and restored in place', async ({
  page,
}) => {
  await page.goto('/demos/item-removal')
  const byTest = (name: string) => page.locator(`[data-test="${name}"]`)

  const firstCard = page.locator('.masonry-item').first()
  await expect(firstCard).toBeVisible()
  const originalPostIds = await postIds(page)
  const firstPostId = originalPostIds[0]!
  const retainedPostId = originalPostIds[1]!
  const positionLabel = page.locator('.demo-card-post-position').first()
  const loadedCount = Number(
    (await positionLabel.textContent())?.split(' / ')[1],
  )
  const removableCard = page.locator(
    `.masonry-item[data-post-id="${firstPostId}"]`,
  )

  await removableCard.getByRole('button', {
    name: `Remove post ${firstPostId}`,
  }).click()
  await expect(removableCard).toHaveClass(/media-card--leaving/)
  await expect.poll(() => page.evaluate(
    ([leavingId, retainedId]) => [leavingId, retainedId].every((postId) => (
      [...document.querySelector<HTMLElement>(
        `.masonry-item[data-post-id="${postId}"]`,
      )?.getAnimations() ?? []].some((animation) => (
        animation instanceof CSSTransition
        && animation.transitionProperty === 'transform'
        && animation.playState === 'running'
      ))
    )),
    [firstPostId, retainedPostId],
  ), { timeout: 300 }).toBe(true)
  await expect(byTest('removal-status')).toHaveText('Removed 1 item')
  await expect(positionLabel).toContainText(`/ ${loadedCount - 1}`)

  await byTest('undo-removal').click()
  await expect(byTest('removal-status')).toHaveText('Restored 1 item')
  await expect(positionLabel).toContainText(`/ ${loadedCount}`)
  expect((await postIds(page)).slice(0, originalPostIds.length)).toEqual(originalPostIds)

  await byTest('remove-random-items').click()
  await expect(byTest('removal-status')).toHaveText('Removed 3 items')
  await expect(positionLabel).toContainText(`/ ${loadedCount - 3}`)
  await byTest('undo-removal').click()
  await expect(byTest('removal-status')).toHaveText('Restored 3 items')
  await expect(positionLabel).toContainText(`/ ${loadedCount}`)
  expect((await postIds(page)).slice(0, originalPostIds.length)).toEqual(originalPostIds)
})

test('item removal is available in the narrow reel layout', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto('/demos/item-removal')
  const byTest = (name: string) => page.locator(`[data-test="${name}"]`)

  const reel = page.locator('[data-layout-mode="reel"]')
  await expect(reel).toBeVisible()
  const reelFeed = page.locator('.reel-feed')
  const activePostId = await reelFeed.getAttribute('data-active-post-id')
  const removeAction = page.getByRole('button', {
    name: `Remove post ${activePostId}`,
  })
  await expect(removeAction).toBeVisible()

  await removeAction.click()
  await expect(byTest('removal-status')).toHaveText('Removed 1 item')
  await byTest('undo-removal').click()
  await expect(byTest('removal-status')).toHaveText('Restored 1 item')
  expect(await page.locator('.item-removal-demo-stage').evaluate((element) => (
    element.scrollWidth <= element.clientWidth
  ))).toBe(true)
})

test('removing the active masonry reel item advances without closing the reel', async ({
  page,
}) => {
  await page.goto('/demos/item-removal')
  await page.locator('.masonry-item').first().click()

  const overlay = page.locator('.vibe-reel-overlay')
  const reel = overlay.locator('.reel-feed')
  await expect(overlay).toBeVisible()
  const activePostId = await reel.getAttribute('data-active-post-id')
  expect(activePostId).not.toBeNull()
  await page.evaluate((postId) => {
    const feed = document.querySelector<HTMLElement>('.vibe-reel-overlay .reel-feed')
    const browserWindow = window as Window & {
      __vibeRemovalMotion?: Array<{ oldItemPresent: boolean; scrollTop: number }>
    }
    browserWindow.__vibeRemovalMotion = []
    feed?.addEventListener('scroll', () => {
      browserWindow.__vibeRemovalMotion?.push({
        oldItemPresent: Boolean(document.querySelector(
          `.vibe-reel-overlay .reel-item[data-post-id="${postId}"]`,
        )),
        scrollTop: feed.scrollTop,
      })
    }, { passive: true })
  }, activePostId)

  await overlay.getByRole('button', {
    name: `Remove post ${activePostId}`,
  }).click()
  await expect(page.locator('[data-test="removal-status"]')).toHaveText('Removed 1 item')
  await expect(overlay).toBeVisible()
  await expect.poll(() => reel.getAttribute('data-active-post-id'))
    .not.toBe(activePostId)
  const motion = await page.evaluate(() => (
    (window as Window & {
      __vibeRemovalMotion?: Array<{ oldItemPresent: boolean; scrollTop: number }>
    }).__vibeRemovalMotion ?? []
  ))
  expect(motion.length).toBeGreaterThan(1)
  expect(motion[0]?.oldItemPresent).toBe(true)
  expect(motion.filter(({ oldItemPresent }) => oldItemPresent).length).toBeGreaterThan(1)
  expect(new Set(motion.map(({ scrollTop }) => Math.round(scrollTop))).size)
    .toBeGreaterThan(1)
})
