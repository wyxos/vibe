import { defineConfig } from '@playwright/test'

const host = '127.0.0.1'
const port = 4174
const baseURL = `http://${host}:${port}`
// Keep all interaction checks available when a task forbids visual capture.
const noVisuals = process.env.VIBE_TEST_NO_VISUALS === '1'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: noVisuals ? 'off' : 'on-first-retry',
    screenshot: noVisuals ? 'off' : 'only-on-failure',
    video: noVisuals ? 'off' : 'retain-on-failure',
    viewport: {
      width: 1_440,
      height: 900,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
})
