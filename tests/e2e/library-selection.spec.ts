import { expect, test, type Page } from '@playwright/test'
import type {} from '../browser/harness'
import type {} from '../browser/selectionHarness'

const chosen = [1, 2, 3, 117, 118, 119, 120]

test('ordering can be enabled independently while ordinary media activation remains available', async ({ page }) => {
  await open(page, 'orderingOnly')
  await expect(page.getByRole('button', { name: 'Select items', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Arrange items', exact: true }).click()
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Move 1', exact: true })).toBeVisible()
  await page.locator('.masonry-item[data-post-id="1"]').getByRole('button', { name: 'Open post 1', exact: true }).click()
  await expect(page.locator('.vibe-reel-overlay')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
  expect(await page.evaluate(() => window.__vibe.getSelection().count)).toBe(0)
})

async function open(page: Page, query = '') {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`/?scenario=selection&${query}`)
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('.masonry-item').first()).toBeVisible()
  return errors
}

async function order(page: Page) {
  return page.evaluate(() => window.__vibe.getState().items.map((item) => item.postId))
}

async function moveDialog(page: Page, source: number, destination: number) {
  await page.getByRole('button', { name: `Move Item ${source}`, exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Move items', exact: true })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('searchbox', { name: 'Find destination' }).fill(`Item ${destination}`)
  await dialog.getByRole('button', { name: `Choose Item ${destination}`, exact: true }).click()
  return dialog
}

test('disabled capabilities leave the existing masonry geometry and activation unchanged', async ({ page }) => {
  await page.goto('/?layout=masonry')
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('.masonry')).toHaveClass(/masonry--ready/)
  const geometry = () => page.locator('.masonry-item').evaluateAll((cards) => cards.slice(0, 8).map((card) => {
    const bounds = card.getBoundingClientRect()
    return { id: (card as HTMLElement).dataset.postId, x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
  }))
  const baseline = await geometry()
  await open(page, 'disabled')
  await expect(page.locator('.masonry')).toHaveClass(/masonry--ready/)
  expect(await geometry()).toEqual(baseline)
  await expect(page.locator('.vibe-selection-toolbar')).toHaveCount(0)
  await expect(page.locator('.vibe-selection-card-controls')).toHaveCount(0)
  await page.locator('.masonry-item').first().click()
  await expect(page.locator('.vibe-reel-overlay')).toBeVisible()
})

test('all seven selections survive paging, virtualization, review, batch actions and reel navigation', async ({ page }) => {
  const errors = await open(page)
  await page.getByRole('button', { name: 'Select items', exact: true }).click()
  for (const id of [1, 2, 3]) await page.getByRole('checkbox', { name: `Select Item ${id}`, exact: true }).check()
  await page.evaluate(async () => {
    await window.__vibe.loadNext()
    await window.__vibe.loadNext()
  })
  await expect.poll(() => page.evaluate(() => window.__vibe.getState().items.length)).toBe(120)
  await page.locator('.masonry-feed').evaluate((feed) => { feed.scrollTop = feed.scrollHeight })
  for (const id of [117, 118, 119, 120]) await page.getByRole('checkbox', { name: `Select Item ${id}`, exact: true }).check()
  await expect.poll(() => page.evaluate(() => window.__vibe.getSelection())).toEqual({ selectedIds: chosen, count: 7 })
  await expect(page.locator('.vibe-selection-toolbar')).toContainText('7 selected')
  await expect(page.locator('.vibe-selection-toolbar')).toContainText('off-screen')
  await expect(page.locator('.masonry-item[data-post-id="1"]')).toHaveCount(0)
  await page.screenshot({ path: test.info().outputPath('selection-desktop.png') })
  await page.getByRole('button', { name: 'Review selection', exact: true }).click()
  const review = page.getByRole('dialog', { name: 'Selected items', exact: true })
  for (const id of chosen) await expect(review.getByRole('button', { name: `Remove Item ${id} from selection`, exact: true })).toBeAttached()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Collect selected', exact: true }).click()
  expect(await page.evaluate(() => window.__selectionHarness.batchCalls)).toEqual([chosen])
  await page.locator('.masonry-feed').evaluate((feed) => { feed.scrollTop = 0 })
  for (const id of [1, 2, 3]) await expect(page.getByRole('checkbox', { name: `Select Item ${id}`, exact: true })).toBeChecked()
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.locator('.masonry-item[data-post-id="1"]').click()
  await expect(page.locator('.vibe-reel-overlay')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
  expect(await page.evaluate(() => window.__vibe.getSelection().selectedIds)).toEqual(chosen)
  expect(errors).toEqual([])
})

test('selection review retains labels across replacement and lets the consumer replace or clear the basket', async ({ page }) => {
  await open(page)
  await page.evaluate(async () => {
    window.__vibe.setSelection([1, 2, 3])
    const item = window.__vibe.getState().items[0]!
    await window.__vibe.replacePage({ items: [{ ...item, postId: 200 }], next: null })
  })
  await page.getByRole('button', { name: 'Review selection', exact: true }).click()
  const review = page.getByRole('dialog', { name: 'Selected items', exact: true })
  await review.getByRole('button', { name: 'Remove Item 2 from selection', exact: true }).click()
  expect(await page.evaluate(() => window.__vibe.getSelection().selectedIds)).toEqual([1, 3])
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Collect selected', exact: true }).click()
  expect(await page.evaluate(() => window.__selectionHarness.batchCalls)).toEqual([[1, 3]])
  await page.evaluate(() => window.__vibe.setSelection([200]))
  expect(await page.evaluate(() => window.__vibe.getSelection())).toEqual({ selectedIds: [200], count: 1 })
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click()
  expect(await page.evaluate(() => window.__vibe.getSelection())).toEqual({ selectedIds: [], count: 0 })
})

test('Move action orders a selected group and a separate single item without changing selection', async ({ page }) => {
  await open(page)
  await page.evaluate(() => window.__vibe.setSelection([1, 40]))
  await page.getByRole('button', { name: 'Arrange items', exact: true }).click()
  const dialog = await moveDialog(page, 1, 3)
  await dialog.getByRole('button', { name: 'Before', exact: true }).click()
  await dialog.getByRole('button', { name: 'Move items', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect.poll(async () => (await order(page)).slice(0, 5)).toEqual([2, 1, 40, 3, 4])
  const single = await moveDialog(page, 2, 4)
  await single.getByRole('button', { name: 'After', exact: true }).click()
  await single.getByRole('button', { name: 'Move items', exact: true }).click()
  await expect.poll(async () => (await order(page)).slice(0, 5)).toEqual([1, 40, 3, 4, 2])
  expect(await page.evaluate(() => window.__vibe.getSelection().selectedIds)).toEqual([1, 40])
  expect(await page.evaluate(() => window.__selectionHarness.reorderCalls)).toEqual([
    { movedPostIds: [1, 40], targetPostId: 3, position: 'before' },
    { movedPostIds: [2], targetPostId: 4, position: 'after' },
  ])
})

test('failed batch actions keep the full selection and retry without losing items', async ({ page }) => {
  await open(page)
  await page.evaluate(() => { window.__vibe.setSelection([1, 2, 40]); window.__selectionHarness.failBatch = true })
  await page.getByRole('button', { name: 'Collect selected', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Could not complete the action')
  expect(await page.evaluate(() => window.__vibe.getSelection().selectedIds)).toEqual([1, 2, 40])
  await page.evaluate(() => { window.__selectionHarness.failBatch = false })
  await page.getByRole('button', { name: 'Retry operation', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(await page.evaluate(() => window.__selectionHarness.batchCalls)).toEqual([[1, 2, 40], [1, 2, 40]])
})

test('native dragging moves the full selected group including unmounted members', async ({ page }) => {
  await open(page)
  await page.evaluate(() => window.__vibe.setSelection([1, 40]))
  await page.getByRole('button', { name: 'Arrange items', exact: true }).click()
  await expect(page.locator('.masonry-item[data-post-id="40"]')).toHaveCount(0)
  const target = page.locator('.masonry-item[data-post-id="3"]')
  await page.getByRole('button', { name: 'Drag to move Item 1', exact: true }).dragTo(target, { targetPosition: { x: 50, y: 50 } })
  await expect.poll(async () => (await order(page)).slice(0, 5)).toEqual([2, 1, 40, 3, 4])
  expect(await page.evaluate(() => window.__selectionHarness.reorderCalls)).toEqual([
    { movedPostIds: [1, 40], targetPostId: 3, position: 'before' },
  ])
  await expect(page.locator('[data-reorder-target]')).toHaveCount(0)
  await expect(page.locator('.vibe-selection-drag-preview')).toHaveCount(0)
})

test('failed order saves preserve layout and selection, retrying applies only the confirmed move', async ({ page }) => {
  await open(page)
  await page.evaluate(() => { window.__vibe.setSelection([1, 40]); window.__selectionHarness.failReorder = true })
  const original = await order(page)
  const result = await page.evaluate(() => window.__vibe.reorderItems(1, 3, 'before'))
  expect(result).toBe(false)
  expect(await order(page)).toEqual(original)
  await expect(page.getByRole('alert')).toContainText('Could not save the new order')
  await page.evaluate(() => { window.__selectionHarness.failReorder = false })
  await page.getByRole('button', { name: 'Retry operation', exact: true }).click()
  await expect.poll(async () => (await order(page)).slice(0, 5)).toEqual([2, 1, 40, 3, 4])
  expect(await page.evaluate(() => window.__vibe.getSelection().selectedIds)).toEqual([1, 40])
})

test('confirmed ordering preserves pages appended while the consumer is saving', async ({ page }) => {
  await open(page)
  await page.evaluate(() => {
    window.__vibe.setSelection([1, 40])
    window.__selectionHarness.holdReorder = true
    void window.__vibe.reorderItems(1, 3, 'before')
  })
  await expect.poll(() => page.evaluate(() => window.__selectionHarness.reorderCalls.length)).toBe(1)
  expect((await order(page)).slice(0, 4)).toEqual([1, 2, 3, 4])
  await page.evaluate(async () => {
    await window.__vibe.loadNext()
    window.__selectionHarness.resolveOperation?.()
  })
  await expect.poll(async () => (await order(page)).slice(0, 5)).toEqual([2, 1, 40, 3, 4])
  expect((await order(page)).slice(-3)).toEqual([78, 79, 80])
  expect((await order(page)).length).toBe(80)
})

test('replacing a collection cancels a deferred reorder and ignores its late confirmation', async ({ page }) => {
  await open(page)
  await page.evaluate(() => {
    window.__vibe.setSelection([1, 40])
    window.__selectionHarness.holdReorder = true
    void window.__vibe.reorderItems(1, 3, 'before').then((result) => { window.__selectionHarness.reorderResult = result })
  })
  await expect.poll(() => page.evaluate(() => window.__selectionHarness.reorderCalls.length)).toBe(1)
  await page.evaluate(async () => {
    const replacement = [...window.__vibe.getState().items.slice(0, 4)].reverse()
    await window.__vibe.replacePage({ items: replacement, next: null })
    window.__selectionHarness.resolveOperation?.()
  })
  await expect.poll(() => page.evaluate(() => window.__selectionHarness.reorderResult)).toBe(false)
  expect(await page.evaluate(() => window.__selectionHarness.operationAborted)).toBe(true)
  expect(await order(page)).toEqual([4, 3, 2, 1])
  expect(await page.evaluate(() => window.__vibe.getSelection().selectedIds)).toEqual([1, 40])
})

test('a grouped post exposes one checkbox and contributes one post ID to batch actions', async ({ page }) => {
  await open(page)
  expect(await page.evaluate(() => window.__vibe.getState().items[0]!.items.length)).toBe(2)
  await page.getByRole('button', { name: 'Select items', exact: true }).click()
  const post = page.locator('.masonry-item[data-post-id="1"]')
  await expect(post.getByRole('checkbox')).toHaveCount(1)
  await post.getByRole('checkbox', { name: 'Select Item 1', exact: true }).check()
  await page.getByRole('button', { name: 'Collect selected', exact: true }).click()
  expect(await page.evaluate(() => window.__selectionHarness.batchCalls)).toEqual([[1]])
})

test('media selection with custom card chrome preserves independent carousel and footer actions', async ({ page }) => {
  await open(page, 'chrome')
  await page.getByRole('button', { name: 'Select items', exact: true }).click()
  const post = page.locator('.masonry-item[data-post-id="1"]')
  await post.getByRole('button', { name: 'Toggle selection for post 1', exact: true }).click()
  await expect(post.getByRole('checkbox', { name: 'Select Item 1', exact: true })).toBeChecked()
  await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
  await post.hover()
  await post.getByRole('button', { name: 'Next media for post 1', exact: true }).click()
  await expect(post.locator('.media-card-frame[data-media-index="1"]')).toBeVisible()
  const like = post.getByRole('button', { name: 'Like', exact: true })
  await like.click()
  await expect(like).toHaveAttribute('aria-pressed', 'true')
  await post.getByRole('button', { name: 'Information 1', exact: true }).click()
  await expect(post.locator('[data-test="custom-details"]')).toBeVisible()
  expect(await page.evaluate(() => window.__vibe.getSelection().selectedIds)).toEqual([1])
  await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
})

test('a late desktop batch completion keeps a subsequently opened selection review visible', async ({ page }) => {
  await open(page)
  await page.evaluate(() => { window.__vibe.setSelection([1, 40]); window.__selectionHarness.holdBatch = true })
  await page.getByRole('button', { name: 'Collect selected', exact: true }).click()
  await page.getByRole('button', { name: 'Review selection', exact: true }).click()
  const review = page.getByRole('dialog', { name: 'Selected items', exact: true })
  await expect(review).toBeVisible()
  await page.evaluate(() => window.__selectionHarness.resolveOperation?.())
  await expect(page.getByRole('button', { name: 'Cancel operation', exact: true })).toHaveCount(0)
  await expect(review).toBeVisible()
  expect(await page.evaluate(() => window.__vibe.getSelection().selectedIds)).toEqual([1, 40])
})

test('a held native drag survives its source card virtualizing before a distant drop', async ({ page }) => {
  await open(page)
  await page.evaluate(() => window.__vibe.setSelection([1, 2]))
  await page.evaluate(() => {
    for (const type of ['dragstart', 'dragover', 'dragend', 'drop']) {
      document.addEventListener(type, (event) => {
        const id = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-post-id]')?.dataset.postId : undefined
        window.__selectionHarness.dragEvents.push(`${type}:${id ?? 'outside'}`)
      }, true)
    }
  })
  await page.getByRole('button', { name: 'Arrange items', exact: true }).click()
  const grip = page.getByRole('button', { name: 'Drag to move Item 1', exact: true })
  const source = (await grip.boundingBox())!
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2)
  await page.mouse.down()
  try {
    await page.mouse.move(source.x + source.width / 2 + 16, source.y + source.height / 2 + 16, { steps: 4 })
    await expect(page.locator('.vibe-selection-drag-preview')).toHaveCount(1)
    await page.locator('.masonry-feed').evaluate((feed) => { feed.scrollTop = feed.scrollHeight })
    await expect(page.locator('.masonry-item[data-post-id="1"]')).toHaveCount(0)
    await expect(page.locator('.vibe-selection-drag-preview')).toHaveCount(1)
    const target = page.locator('.masonry-item[data-post-id="40"]')
    await expect(target).toBeVisible()
    const destination = (await target.boundingBox())!
    await page.mouse.move(destination.x + destination.width / 2, destination.y + 20, { steps: 4 })
    // Native Chromium dragover needs a second destination move after the initial dragenter.
    await page.mouse.move(destination.x + destination.width / 2, destination.y + 20)
    const events = await page.evaluate(() => window.__selectionHarness.dragEvents)
    expect(events).toContain('dragstart:1')
    expect(events).toContain('dragover:40')
    await expect(target, JSON.stringify(events)).toHaveAttribute('data-reorder-target', 'before')
    await page.mouse.up()
    await expect.poll(async () => (await order(page)).slice(-3)).toEqual([1, 2, 40])
  } finally {
    await page.mouse.up()
  }
  await expect(page.locator('.vibe-selection-drag-preview')).toHaveCount(0)
  expect(await page.evaluate(() => window.__selectionHarness.reorderCalls)).toEqual([
    { movedPostIds: [1, 2], targetPostId: 40, position: 'before' },
  ])
})

test('cancelling pending consumer work propagates abort and keeps selection', async ({ page }) => {
  await open(page)
  await page.evaluate(() => { window.__vibe.setSelection([1, 40]); window.__selectionHarness.holdBatch = true })
  await page.getByRole('button', { name: 'Collect selected', exact: true }).click()
  await page.getByRole('button', { name: /Stop|Cancel operation/ }).click()
  await expect.poll(() => page.evaluate(() => window.__selectionHarness.operationAborted)).toBe(true)
  expect(await page.evaluate(() => window.__vibe.getSelection().selectedIds)).toEqual([1, 40])
  await expect(page.getByRole('button', { name: 'Collect selected', exact: true })).toBeEnabled()
})

test.describe('phone selection', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`phone selection actions, review and keyboard move fit without overflow (${reducedMotion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion })
    const errors = await open(page)
    const client = await page.context().newCDPSession(page)
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 650 }] })
    for (const y of [550, 450, 350, 250]) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y }] })
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await client.detach()
    await expect.poll(() => page.locator('.masonry-feed').evaluate((feed) => feed.scrollTop)).toBeGreaterThan(0)
    await page.locator('.masonry-feed').evaluate((feed) => { feed.scrollTop = 0 })
    await page.getByRole('button', { name: 'Select items', exact: true }).click()
    const checkbox = page.getByRole('checkbox', { name: 'Select Item 1', exact: true })
    await checkbox.focus()
    await page.keyboard.press('Space')
    await expect(checkbox).toBeChecked()
    const toolbar = page.locator('.vibe-selection-toolbar')
    await expect(toolbar).toContainText('1 selected')
    const bounds = await toolbar.boundingBox()
    expect(bounds!.y + bounds!.height).toBeCloseTo(844, 0)
    await page.getByRole('button', { name: 'Actions', exact: true }).click()
    await page.getByRole('button', { name: 'Collect selected', exact: true }).click()
    expect(await page.evaluate(() => window.__selectionHarness.batchCalls)).toEqual([[1]])
    await expect(page.getByRole('dialog', { name: 'Selection actions', exact: true })).not.toBeVisible()
    await page.screenshot({ path: test.info().outputPath(`selection-phone-${reducedMotion}.png`) })
    const entering = await page.evaluate(async () => {
      const trigger = document.querySelector<HTMLButtonElement>('.vibe-selection-review')!
      trigger.focus()
      trigger.click()
      await Promise.resolve()
      await Promise.resolve()
      const panel = document.querySelector<HTMLDialogElement>('.vibe-selection-dialog')!
      const animations = panel.getAnimations()
      const durations = animations.map((animation) => animation.effect?.getTiming().duration)
      await Promise.allSettled(animations.map((animation) => animation.finished))
      return { durations, open: panel.open }
    })
    expect(entering.open).toBe(true)
    expect(entering.durations).toEqual(reducedMotion === 'reduce' ? [] : [140])
    await page.screenshot({ path: test.info().outputPath(`selection-review-phone-${reducedMotion}.png`) })
    const leaving = await page.evaluate(async () => {
      const panel = document.querySelector<HTMLDialogElement>('.vibe-selection-dialog')!
      panel.querySelector<HTMLButtonElement>('[aria-label="Close selection panel"]')!.click()
      await Promise.resolve()
      const animations = panel.getAnimations()
      const openDuringClose = panel.open
      const durations = animations.map((animation) => animation.effect?.getTiming().duration)
      await Promise.allSettled(animations.map((animation) => animation.finished))
      return { durations, openDuringClose }
    })
    expect(leaving.durations).toEqual(reducedMotion === 'reduce' ? [] : [140])
    if (reducedMotion === 'no-preference') expect(leaving.openDuringClose).toBe(true)
    await expect(page.getByRole('dialog', { name: 'Selected items', exact: true })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Review selection', exact: true })).toBeFocused()
    await page.getByRole('button', { name: 'Arrange items', exact: true }).click()
    const dialog = await moveDialog(page, 1, 3)
    await dialog.getByRole('button', { name: 'Move items', exact: true }).click()
    await expect.poll(async () => (await order(page)).slice(0, 3)).toEqual([2, 1, 3])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(errors).toEqual([])
  })
  }
})
