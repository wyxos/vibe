import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

type E2EFixtures = {
  pageErrors: string[]
}

export const test = base.extend<E2EFixtures>({
  pageErrors: async ({ page }, use) => {
    const pageErrors: string[] = []

    page.on('pageerror', (error) => {
      pageErrors.push(error.stack ?? error.message)
    })

    await use(pageErrors)

    expect(
      pageErrors,
      pageErrors.length > 0
        ? `Unexpected page errors:\n\n${pageErrors.join('\n\n')}`
        : undefined,
    ).toEqual([])
  },
})

export { expect }

export async function gotoRoute(page: Page, path: string) {
  const response = await page.goto(path, {
    waitUntil: 'domcontentloaded',
  })

  expect(response, `Expected a navigation response for "${path}".`).not.toBeNull()
  expect(
    response?.ok(),
    `Expected "${path}" to load successfully, received ${response?.status()}.`,
  ).toBeTruthy()
}
